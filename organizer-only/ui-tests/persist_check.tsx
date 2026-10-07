import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const [k, v] of Object.entries({ window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage })) Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
// A player's saved progress, with some hand-tampered values mixed in:
dom.window.localStorage.setItem('manu-forensics-state', JSON.stringify({
  clearedBuildingIds: ['building-3', 'building-99', 7],
  submittedFlags: { 'building-3': 'x', 'evil': 'y' },
  revealedHints: { 'building-4': 99, 'building-3': -2, 'building-5': 1.5, 'evil': 3, 'building-1': 2 },
}));
(async () => {
  const { useGameStore, hydrateStoreFromStorage } = await import('@/lib/store');
  hydrateStoreFromStorage();
  const st = useGameStore.getState();
  const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  console.log('cleared ids sanitised      :', eq(st.clearedBuildingIds, ['building-3']));
  console.log('flags sanitised            :', eq(st.submittedFlags, { 'building-3': 'x' }));
  console.log('hints: 99->clamp 3, junk dropped, offline sector clamped to 0 tiers:', eq(st.revealedHints, { 'building-4': 3 }));
  st.revealHint('building-5');
  const saved = JSON.parse(dom.window.localStorage.getItem('manu-forensics-state')!);
  console.log('revealHint persists        :', saved.revealedHints['building-5'] === 1 && saved.revealedHints['building-4'] === 3);
  st.unlockBuilding('building-4', 'f');
  const saved2 = JSON.parse(dom.window.localStorage.getItem('manu-forensics-state')!);
  console.log('unlock keeps hints (was a bug risk: old code overwrote storage):', saved2.revealedHints['building-4'] === 3 && saved2.clearedBuildingIds.includes('building-4'));
  st.resetProgress();
  console.log('reset clears hints + storage:', eq(useGameStore.getState().revealedHints, {}) && dom.window.localStorage.getItem('manu-forensics-state') === null);
  process.exit(0);
})();
