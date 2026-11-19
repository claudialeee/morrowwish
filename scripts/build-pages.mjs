import fs from 'node:fs';
import path from 'node:path';
import { generateDiscovery } from './discovery.mjs';
import { execFileSync } from 'node:child_process';

const base = process.cwd();
if (!fs.existsSync('public/audio/cat-happy-clappy.ogg'))
  execFileSync('bash',['scripts/fetch-cat-music.sh'],{stdio:'inherit'});
const out = path.join(base, 'cloudflare-pages', 'public');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(base, 'public'), out, { recursive: true });

const analytics = fs.readFileSync(path.join(base, 'src', 'analytics.js'), 'utf8')
  .replace('export async function api', 'async function api');
const router = fs.readFileSync(path.join(base, 'src', 'worker.js'), 'utf8')
  .replace('import {api} from "./analytics.js";', '');
if (!analytics.includes('async function api') || !router.includes('ASSETS.fetch')) {
  throw new Error('Unexpected worker source: check the Pages build script before deploying.');
}
fs.writeFileSync(path.join(out, '_worker.js'), analytics + '\n' + router);
console.log('Built Cloudflare Pages assets from canonical public/ and src/.');

generateDiscovery(out);
