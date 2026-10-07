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

    if (inputHash === challenge.flagHash || cleanInput === challenge.defaultFlag) {
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
          message: 'Invalid authorization token or signature mismatch.',
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
