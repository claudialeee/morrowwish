import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const origin = 'http://127.0.0.1:8765';
const out = 'artifacts/cat-bond-harbor';
await fs.mkdir(out, {recursive:true});
const browser = await chromium.launch({headless:true});
const profiles = [
  {name:'desktop', viewport:{width:1440,height:960}, hasTouch:false},
  {name:'portrait', viewport:{width:390,height:844}, hasTouch:true},
  {name:'landscape', viewport:{width:844,height:390}, hasTouch:true}
];

const results = [];
try {
  for (const {name, ...options} of profiles) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    await page.goto(origin+'/cat-bond/?lang=en');
    await page.waitForFunction(() => window.WorldMap === window.CatBondCanonicalWorld && window.CatBondResonance && window.__game);
    const button = (name, scope = page) => scope.getByRole('button',{name,exact:true});
    const scene = id => page.waitForFunction(expected => CatBondResonance.view().current?.id === expected, id);
    const shot = id => page.screenshot({path:out+'/'+name+'-'+id+'.png'});
    const checkObjective = operation => page.waitForFunction(op => CatBondResonance.view().objective.includes(op),operation);
    async function readDialogue(id,choice) {
      const dialogue = page.locator('.res-host[data-scene="'+id+'"]');
      await dialogue.waitFor();
      const advance = button('Skip dialogue',dialogue);
      if (await advance.isVisible() && await advance.isEnabled()) await advance.click();
      if (choice) {
        await button(choice,dialogue).click();
        if (await advance.isVisible() && await advance.isEnabled()) await advance.click();
      }
      if (await dialogue.isVisible()) {
        const close = button('Close',dialogue);
        if (await close.isVisible()) await close.click();
      }
    }
    async function puzzle(label, inputs) {
      await button(label).click();
      const controls = page.locator('.rw-puzzle-controls');
      await controls.waitFor();
      for (const input of inputs) await button(input,controls).click();
      await controls.waitFor({state:'hidden'});
    }

    await shot('title');
    await page.locator('#intro-start').click();
    await page.locator('#intro-slot-list [data-slot="slot1"]').click();
    await page.locator('#panel .cat-starter-card .dex-cell').first().click();
    for (const id of ['prologue:P-01','prologue:P-02','prologue:P-03']) {
      await scene(id);
      await page.locator('.cbcp-art').first().waitFor();
      await page.waitForFunction(() => {
        const image=document.querySelector('.cbcp-art');
        const skip=document.querySelector('.cbcp-skip');
        return image?.naturalWidth > 0 && skip && !skip.disabled;
      });
      if (id === 'prologue:P-01') {
        await shot('opening');
        await page.locator('.cbcp-language').click();
        assert.equal(await page.evaluate(() => MorrowwishI18n.get()),'zh');
        await page.locator('.cbcp-language').click();
        assert.equal(await page.evaluate(() => MorrowwishI18n.get()),'en');
      }
      await page.locator('.cbcp-skip').click();
    }

    await scene('prologue:P-04');
    const bell = page.locator('.res-garden-bell');
    await bell.waitFor();
    await shot('garden');
    const rect = await bell.boundingBox();
    const x=Math.floor(rect.x+rect.width/2), y=Math.floor(rect.y+rect.height/3);
    if (options.hasTouch) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+62}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    } else {
      await page.mouse.move(x,y);
      await page.mouse.down();
      await page.mouse.move(x,y+62,{steps:8});
      await page.mouse.up();
    }
    await readDialogue('prologue:P-04');
    await scene('prologue:P-05');
    await readDialogue('prologue:P-05');
    await shot('atlas');
    await page.locator('.rw-regions [data-region="harbor"]').click();
    await scene('harbor:H-01');
    await shot('harbor');
    await button('Talk to Qilan').click();
    await readDialogue('harbor:H-01');
    await scene('harbor:H-02');
    await button('Talk to Jiedeng').click();
    await page.locator('.res-host[data-scene="harbor:H-02"]').waitFor();
    await shot('dialogue');
    await readDialogue('harbor:H-02','Comfort Qilan first');
    await scene('harbor:H-03');
    await puzzle('Tide cave logbook',['Ebb mark','Dry steps','Logbook chest']);
    await readDialogue('harbor:H-03');
    await scene('harbor:H-04');
    await button('Talk to '+(name==='portrait'?'Jiedeng':'Qilan')).click();
    const calibrate=name==='portrait';
    await readDialogue('harbor:H-04',calibrate?'Calibrate the lighthouse first':'Prioritize rescue');
    const rescue=() => puzzle('Storm boat',['Secure','Signal','Guide']);
    const mirrors=() => puzzle('Lighthouse mirrors',['Left mirror','Left mirror','Center mirror','Center mirror','Right mirror']);
    if (calibrate) {await mirrors();await rescue();} else {await rescue();await mirrors();}
    await scene('harbor:H-05');
    await checkObjective('repair:harbor');
    await puzzle('Lighthouse sanctuary',['Left mirror','Center mirror','Center mirror','Right mirror']);
    await button('Invite Qilan').click();
    await button('Invite Qilan').waitFor({state:'hidden'});
    await button('Invite Jiedeng').click();
    await button('Invite Jiedeng').waitFor({state:'hidden'});
    await puzzle('Returning Tides',['Low','High','Middle']);
    await readDialogue('harbor:H-05');
    await scene('forest:R-01');

    // Follow a normal encounter through the actual battle setup and tutorial.
    await button('Approach wild cat').click();
    await page.locator('#bp-go').click();
    await page.locator('#battle-ui.on').waitFor();
    await shot('battle');
    assert.equal(await page.evaluate(() => window.__game.battle.regionalCombat?.region),'harbor');
    const tutorial = page.locator('#battle-tutorial-skip');
    if (await tutorial.isVisible()) await tutorial.click();
    await page.waitForFunction(() => window.__game.scene === 'map', null, {timeout:75000});
    assert.equal(await page.evaluate(() => WorldMap.currentRegion),'harbor');
    const resultClose=page.locator('#cr-ok,#battle-recovery-ok');
    await resultClose.waitFor();
    const captured=await resultClose.getAttribute('id')==='cr-ok';
    assert.equal(await page.evaluate(() => State.S.catchCount || 0),captured?1:0);
    await resultClose.click();
    await button('Sunlit Garden',page.locator('.rw-head')).click();
    await page.waitForFunction(() => window.__game.scene === 'yard');
    await shot('garden-return');

    await page.reload();
    await page.locator('#intro-continue').click();
    await page.locator('#intro-slot-list [data-slot="slot1"]').click();
    await scene('forest:R-01');
    const state = await page.evaluate(() => ({
      sanctuaries:CatBondResonance.view().sanctuaries,
      melodies:CatBondResonance.view().melodies,
      choice:State.S.resonance.choices['harbor:H-04'],
      slot:State.activeSlot(),
      legacy:!!State.S.lastResonanceWorld
    }));
    assert.deepEqual(state,{sanctuaries:['harbor'],melodies:['harbor'],choice:calibrate?'calibrate':'rescue',slot:'slot1',legacy:false});
    assert.deepEqual(errors,[]);
    results.push({profile:name, captured, ...state});
    await context.close();
  }
} finally {
  await fs.writeFile(out+'/results.json',JSON.stringify(results,null,2));
  await browser.close();
}
