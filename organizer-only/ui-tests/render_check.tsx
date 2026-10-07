import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
for (const [k, v] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true })) {
  Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
}

async function main() {
const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { flushSync } = await import('react-dom');
const { useGameStore } = await import('@/lib/store');
const { TerminalHUD } = await import('@/components/terminal/TerminalHUD');
const { FORENSIC_CHALLENGES } = await import('@/lib/challenges');
const root = createRoot(document.getElementById('root')!);

type Tab = 'briefing' | 'evidence' | 'flag' | 'fragment';
let pass = 0; const fails: string[] = [];
const ok = (n: string, c: boolean) => { if (c) { pass++; console.log('  PASS ', n); } else { fails.push(n); console.log('  FAIL ', n); } };
const render = (id: string, tab: Tab, extra: Record<string, unknown> = {}) => {
  useGameStore.setState({ isTerminalOpen: true, isTerminalMinimized: false, activeBuildingId: id, activeTerminalTab: tab, clearedBuildingIds: [], revealedHints: {}, ...extra } as never);
  flushSync(() => root.render(React.createElement(TerminalHUD)));
  return document.getElementById('root')!.innerHTML;
};

for (const c of FORENSIC_CHALLENGES) {
  console.log(`\n${c.id} ${c.name} [${c.status}]`);
  const brief = render(c.id, 'briefing');
  ok('briefing renders title', brief.includes(c.briefing.title.replace(/&/g, '&amp;')));
  ok('category + points chip', brief.includes(c.category) && brief.includes(`${c.points}`));
  ok('ML connection card', brief.includes('ML CONNECTION'));
  if (c.status === 'live') {
    ok('hint ladder shows 0/3 and cheapest cost', brief.includes('FORENSIC HINTS (0/3)') && brief.includes(`REVEAL HINT 1 (-${c.hints[0].cost} PTS)`));
    ok('hint text NOT shown before reveal', !brief.includes(c.hints[0].text.slice(0, 40)));
    const h2 = render(c.id, 'briefing', { revealedHints: { [c.id]: 2 } });
    const pen = c.hints[0].cost + c.hints[1].cost;
    ok('after 2 reveals: tiers 1-2 visible, 3 hidden', h2.includes(c.hints[0].text.slice(0, 30)) && h2.includes(`HINT 1 (-${c.hints[0].cost} pts):`) && h2.includes(`HINT 2 (-${c.hints[1].cost} pts):`) && !h2.includes(`HINT 3 (-${c.hints[2].cost} pts):`) && h2.includes('REVEAL HINT 3'));
    ok(`points drop to ${c.points - pen}/${c.points}`, h2.includes(`${c.points - pen}/${c.points} PTS`));
    ok('3 tabs + fragment tab present', brief.includes('SUBMIT FLAG') && brief.includes('EVIDENCE (') && brief.includes('FRAGMENT #'));
    const ev = render(c.id, 'evidence');
    ok('evidence list rendered', c.evidenceList.every((e) => ev.includes(e.title.replace(/&/g, '&amp;'))));
    ok('download attachments rendered', (c.attachments ?? []).every((a) => ev.includes(`href="${a.url}"`) && ev.includes(`download="${a.filename}"`)));
    const fl = render(c.id, 'flag');
    ok('flag form present, NO auto-fill, format hint shown', fl.includes('SUBMIT &amp; DECRYPT') && !fl.includes('Auto-Fill') && fl.includes(c.questionPrompt.formatHint.slice(0, 20)));
    const done = render(c.id, 'fragment', { clearedBuildingIds: [c.id] });
    ok('cleared -> fragment viewer path renders w/o crash', done.length > 500);
  } else {
    ok('offline panel shown', brief.includes('Channel offline'));
    ok('no hints / no flag buttons offered', !brief.includes('FORENSIC HINTS') && !brief.includes('SUBMIT FLAG'));
    const stale = render(c.id, 'flag');   // a stale tab from another sector must fall back to briefing
    ok('stale "flag" tab falls back to briefing (no form)', stale.includes('Channel offline') && !stale.includes('CLEARANCE AUTHORIZATION FLAG'));
  }
}
console.log(`\n${pass} passed, ${fails.length} failed`); process.exit(fails.length ? 1 : 0);
}
main();
