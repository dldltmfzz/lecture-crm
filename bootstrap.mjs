import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const parts = [
  'bundle/exact-00',
  'bundle/exact-01',
  'bundle/exact-0203',
  'bundle/exact-0405',
  'bundle/exact-0607',
  'bundle/exact-0809',
  'bundle/exact-1011',
  'bundle/exact-1213',
  'bundle/exact-1415',
];

const b64 = parts.map((p) => fs.readFileSync(p, 'utf8').trim()).join('');
fs.writeFileSync('/tmp/aileaders.tgz', Buffer.from(b64, 'base64'));
execFileSync('tar', ['-xzf', '/tmp/aileaders.tgz', '-C', '.'], { stdio: 'inherit' });
