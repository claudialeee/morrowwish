import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gameRoot = path.join(root, 'public/cat-bond');
const manifest = JSON.parse(fs.readFileSync(path.join(gameRoot, 'assets/cinematics/asset-manifest.json'), 'utf8'));
const rendererPath = path.join(gameRoot, 'js/cinematic-presentation.js');
const scenesPath = path.join(gameRoot, 'js/cinematic-scenes.js');
const renderer = fs.readFileSync(rendererPath, 'utf8');
const scenesSource = fs.readFileSync(scenesPath, 'utf8');

assert.equal(manifest.project, 'Cat Bond — The Last Resonance');
assert.equal(manifest.status, 'branch-only; not integrated into production');
assert.equal(manifest.assets.filter(asset => asset.kind === 'environment-key-art').length, 6, 'six unique regional key-art assets required');
assert.deepEqual(manifest.characters, ['岬灯','栖蓝','芽禾','榆川','烬婆','小铆','翎羽','远帆','墨页','白栞','星芽','砾川']);

const assetIds = new Set();
for (const asset of manifest.assets) {
  assert.ok(!assetIds.has(asset.id), `duplicate asset id: ${asset.id}`);
  assetIds.add(asset.id);
  const absolute = path.resolve(gameRoot, asset.path);
  assert.ok(absolute.startsWith(gameRoot + path.sep), `asset path escaped game root: ${asset.path}`);
  assert.ok(fs.existsSync(absolute), `missing cinematic asset: ${asset.path}`);
  const content = fs.readFileSync(absolute, 'utf8');
  assert.match(content, /^<svg\s/, `asset is not an SVG source: ${asset.path}`);
  assert.ok(content.length > 900, `unexpectedly small artwork: ${asset.path}`);
  assert.ok(!/The Last Page|last-page/i.test(content), `deprecated story material found in ${asset.path}`);
}

const sceneContext = { window: {} };
vm.runInNewContext(scenesSource, sceneContext);
const scenes = sceneContext.window.CatBondCinematicScenes;
assert.ok(Array.isArray(scenes) && scenes.length >= 8, 'canon scene catalogue missing');
const sceneIds = new Set();
const rendererContext = { window: {} };
vm.runInNewContext(renderer, rendererContext);
const validateScene = rendererContext.window.CatBondCinematicPresentation.validateScene;
for (const scene of scenes) {
  assert.ok(!sceneIds.has(scene.id), `duplicate scene id: ${scene.id}`);
  sceneIds.add(scene.id);
  assert.equal(validateScene(scene), true, `invalid scene schema: ${scene.id}`);
  for (const frame of scene.frames) {
    const absolute = path.resolve(gameRoot, frame.image);
    assert.ok(absolute.startsWith(gameRoot + path.sep));
    assert.ok(fs.existsSync(absolute), `scene frame image missing: ${scene.id} -> ${frame.image}`);
  }
}
for (const required of ['prologue/P-01','prologue/P-02','prologue/P-03','prologue/P-04','prologue/P-05','finale/B-03','epilogue/E-01','epilogue/E-03']) {
  assert.ok(sceneIds.has(required), `missing canonical scene: ${required}`);
}
assert.ok(sceneIds.has('epilogue/E-01'), 'duplicate E-01 must be namespaced');
assert.match(renderer, /interrupt\(\)/);
assert.match(renderer, /restore\(snapshot\)/);
assert.match(renderer, /setLanguage\(language\)/);
assert.match(renderer, /prefers-reduced-motion/);
assert.match(renderer, /safe-area-inset-bottom/);
assert.match(renderer, /onComplete/);
assert.match(renderer, /onSkip/);
assert.ok(!/LAST_PAGE|The Last Page|last-page/i.test(scenesSource), 'deprecated narrative detected in cinematic catalogue');

console.log(`Cat Bond cinematic source checks passed: ${manifest.assets.length} assets, ${scenes.length} scenes, 6 regions, 12 NPC designs.`);
