import { NextResponse } from 'next/server';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';
import { checkFlag } from '@/lib/server/flags';

export const dynamic = 'force-dynamic';

const MAX_FLAG_LENGTH = 300;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Malformed request.' }, { status: 400 });
  }

  const { buildingId, flag } = (body ?? {}) as { buildingId?: unknown; flag?: unknown };
  if (typeof buildingId !== 'string' || typeof flag !== 'string' || flag.length === 0) {
    return NextResponse.json({ success: false, message: 'Missing building or flag.' }, { status: 400 });
  }
  if (flag.length > MAX_FLAG_LENGTH) {
    return NextResponse.json({ success: false, message: 'Flag is too long.' }, { status: 400 });
  }

  const challenge = FORENSIC_CHALLENGES.find((c) => c.id === buildingId);
  if (!challenge) {
    return NextResponse.json({ success: false, message: 'Unknown sector.' }, { status: 404 });
  }
  if (challenge.status !== 'live') {
    return NextResponse.json(
      { success: false, message: 'This sector is not declassified yet. It opens in a later drop.' },
      { status: 403 }
    );
  }

  const verdict = checkFlag(challenge.id, flag);

  if (verdict.kind === 'correct') {
    return NextResponse.json({
      success: true,
      message: `Clearance granted for ${challenge.name}! Dataset Fragment ${challenge.datasetFragment.fragmentId} unlocked.`,
      fragment: challenge.datasetFragment,
    });
  }

  if (verdict.kind === 'decoy') {
    return NextResponse.json({ success: false, message: verdict.message }, { status: 401 });
  }

  return NextResponse.json(
    { success: false, message: 'Verification failed. That flag is incorrect.' },
    { status: 401 }
  );
}
