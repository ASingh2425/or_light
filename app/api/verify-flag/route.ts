import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { buildingId, flag } = body;

    if (!buildingId || !flag) {
      return NextResponse.json(
        { success: false, message: 'Building ID and Flag are required.' },
        { status: 400 }
      );
    }

    const challenge = FORENSIC_CHALLENGES.find((c) => c.id === buildingId);
    if (!challenge) {
      return NextResponse.json(
        { success: false, message: 'Forensic challenge sector not found.' },
        { status: 404 }
      );
    }

    // Clean flag input
    const cleanInput = flag.trim();
    const inputHash = crypto.createHash('sha256').update(cleanInput).digest('hex');
    const upperHash = crypto.createHash('sha256').update(cleanInput.toUpperCase()).digest('hex');
    const defaultFlag = challenge.defaultFlag;
    const defaultMatch =
      defaultFlag !== undefined && cleanInput.toUpperCase() === defaultFlag.toUpperCase();

    if (
      inputHash === challenge.flagHash ||
      upperHash === challenge.flagHash ||
      defaultMatch
    ) {
      return NextResponse.json({
        success: true,
        message: `Clearance granted for ${challenge.name}! Dataset Fragment ${challenge.datasetFragment.fragmentId} unlocked.`,
        buildingId: challenge.id,
        fragment: challenge.datasetFragment,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Nope — that clearance code does not match. Give it another shot.',
        },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal validation error.' },
      { status: 500 }
    );
  }
}
