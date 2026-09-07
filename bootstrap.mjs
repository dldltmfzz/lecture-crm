import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

let b64 = '';
for (let i = 0; i < 5; i += 1) {
  const n = String(i).padStart(2, '0');
  b64 += fs.readFileSync(`source.part${n}`, 'utf8').trim();
}

fs.writeFileSync('/tmp/aileaders.txz', Buffer.from(b64, 'base64'));

const extract = "import tarfile; t=tarfile.open('/tmp/aileaders.txz','r:xz'); t.extractall('.'); t.close()";
try {
  execFileSync('python3', ['-c', extract], { stdio: 'inherit' });
} catch {
  execFileSync('python', ['-c', extract], { stdio: 'inherit' });
}
