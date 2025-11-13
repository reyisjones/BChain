import { createHash } from 'crypto';

export function sha256FileBuffer(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

// TODO: add keccak pipeline and canonical JSON hashing
