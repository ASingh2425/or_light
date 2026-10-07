import { createHash, timingSafeEqual } from 'crypto';
import { FLAG_RECORDS } from './flagHashes.generated';

/**
 * Server-only flag helpers. Never import this from a client component.
 *
 * normalizeFlag MUST stay identical to normalize() in organizer-only/build_act3.py:
 * the stored hashes are SHA-256 of the normalised flag.
 */
export function normalizeFlag(input: string): string {
  return input.trim().toUpperCase();
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hexEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export type FlagVerdict =
  | { kind: 'correct' }
  | { kind: 'decoy'; message: string }
  | { kind: 'wrong' }
  | { kind: 'unavailable' };

export function checkFlag(buildingId: string, submitted: string): FlagVerdict {
  const record = FLAG_RECORDS[buildingId];
  if (!record) return { kind: 'unavailable' };

  const hash = sha256Hex(normalizeFlag(submitted));
  if (hexEquals(hash, record.hash)) return { kind: 'correct' };

  const decoy = record.decoys.find((d) => hexEquals(hash, d.hash));
  if (decoy) return { kind: 'decoy', message: decoy.message };

  return { kind: 'wrong' };
}
