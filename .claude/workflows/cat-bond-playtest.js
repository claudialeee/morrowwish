export const meta = {
  name: 'cat-bond-playtest',
  description: 'Multi-round adversarial playtest: persona players simulate real battles, voice frustrations, an adversary critic attacks the findings, then synthesize ranked fixes',
  whenToUse: 'When you want grounded combat/UX feedback for Cat Bond from many player types, stress-tested by an adversary before acting.',
  phases: [
    { title: 'Simulate', detail: 'run the real headless battle sim per persona (ground truth)' },
    { title: 'Voice', detail: 'one agent per persona turns metrics into that human\'s pain points' },
    { title: 'Adversary', detail: 'critic attacks each pain point; only survivors pass' },
    { title: 'Synthesize', detail: 'rank confirmed issues into concrete fixes' },
  ],
}

// args: { personas?: string[], battles?: number, rounds?: number }
const PERSONAS = (args && args.personas) || ['masher','cautious','explorer','panicky','lazy','impatient'];
const BATTLES = (args && args.battles) || 8;
const ROUNDS = (args && args.rounds) || 1;

const PAIN_SCHEMA = {
  type:'object', additionalProperties:false,
  properties:{
    persona:{type:'string'},
    mood:{type:'string', description:'this player\'s emotional state: engaged / frustrated / bored / confused / annoyed'},
    quit:{type:'boolean', description:'would this player stop playing?'},
    painPoints:{type:'array', items:{type:'object', additionalProperties:false,
      properties:{
        issue:{type:'string', description:'concrete problem in the player\'s own voice'},
        evidence:{type:'string', description:'which metric proves it (cite the numbers)'},
        severity:{type:'string', enum:['low','medium','high']},
        area:{type:'string', enum:['balance','pacing','controls','feedback','onboarding','depth']},
      }, required:['issue','evidence','severity','area']}},
  }, required:['persona','mood','quit','painPoints'],
};

const VERDICT_SCHEMA = {
  type:'object', additionalProperties:false,
  properties:{
    real:{type:'boolean', description:'true only if the issue is a genuine design problem the metrics support'},
    reason:{type:'string'},
    reframe:{type:'string', description:'if real, the tightest accurate restatement of the actual problem'},
  }, required:['real','reason'],
};

const FIX_SCHEMA = {
  type:'object', additionalProperties:false,
  properties:{ fixes:{type:'array', items:{type:'object', additionalProperties:false,
    properties:{
      title:{type:'string'},
      problem:{type:'string'},
      change:{type:'string', description:'specific file/knob to change and in which direction'},
      affects:{type:'array', items:{type:'string'}, description:'which personas benefit'},
      risk:{type:'string', description:'what this could break / who it could hurt'},
      priority:{type:'string', enum:['P0','P1','P2']},
    }, required:['title','problem','change','priority']}}},
  required:['fixes'],
};

const allConfirmed = [];

for (let round = 1; round <= ROUNDS; round++) {
  phase('Simulate');
  // Ground truth: run the REAL battle simulator per persona. Each agent simply
  // executes the sim and returns its JSON — no hallucinated gameplay.
  const seed = 10000 + round * 1000;
  const sims = await parallel(PERSONAS.map(p => () =>
    agent(
      `Run EXACTLY this command from the repo root and return ONLY the JSON it prints (the final JSON object), nothing else:\n\n`+
      `node scripts/playtest-sim.mjs ${p} ${BATTLES} ${seed}\n\n`+
      `The JSON has shape {persona,label,desc,summary,battles}. Return it verbatim as your StructuredOutput.`,
      { label: `sim:${p}`, phase: 'Simulate',
        schema: { type:'object', additionalProperties:true, properties:{ persona:{type:'string'}, label:{type:'string'}, desc:{type:'string'}, summary:{type:'object',additionalProperties:true}, battles:{type:'array',items:{type:'object',additionalProperties:true}} }, required:['persona','summary'] } }
    )
  ));
  const okSims = sims.filter(Boolean);
  log(`Round ${round}: simulated ${okSims.length}/${PERSONAS.length} personas`);

  // Voice: each persona agent interprets ITS OWN real metrics as a human player,
  // then the adversary attacks each pain point before anything is trusted.
  phase('Voice');
  const voiced = await pipeline(
    okSims,
    sim => agent(
      `You ARE the player persona "${sim.label}" (${sim.desc}). Here is the REAL telemetry from ${BATTLES} battles you just played (headless sim of the actual game):\n\n`+
      JSON.stringify(sim.summary, null, 2)+`\n\nPer-battle detail:\n`+JSON.stringify((sim.battles||[]).slice(0,8),null,2)+`\n\n`+
      `Speak in this player's voice. Are you engaged, frustrated, bored, confused, or annoyed? Would you quit? `+
      `List concrete pain points, each backed by a SPECIFIC number from the telemetry (e.g. "I never used dodge in 8 fights", "41% idle time", "lost at 4% HP"). `+
      `Do NOT invent problems the metrics don't show. If the data says you had fun, say so.`,
      { label:`voice:${sim.persona}`, phase:'Voice', schema: PAIN_SCHEMA }
    ),
    // Adversary: attack each pain point. Default to NOT real unless metrics clearly support it.
    pain => parallel((pain?.painPoints||[]).map(pp => () =>
      agent(
        `You are a skeptical game-design ADVERSARY. A playtester (persona "${pain.persona}") claims this pain point:\n\n`+
        `Issue: ${pp.issue}\nEvidence cited: ${pp.evidence}\nSeverity: ${pp.severity} | Area: ${pp.area}\n\n`+
        `Attack it. Is this a REAL design problem, or is it (a) the persona playing badly on purpose, (b) working-as-intended difficulty, (c) not actually supported by the cited metric, or (d) a niche that doesn't matter? `+
        `Default real=false unless the metric genuinely proves a problem a typical player would hit. If real, give the tightest accurate reframe of the ACTUAL problem.`,
        { label:`adv:${pain.persona}`, phase:'Adversary', schema: VERDICT_SCHEMA }
      ).then(v => ({ persona:pain.persona, mood:pain.mood, quit:pain.quit, pp, verdict:v }))
    ))
  );
  const confirmed = voiced.flat().filter(Boolean).filter(x => x.verdict && x.verdict.real);
  log(`Round ${round}: ${confirmed.length} pain points survived the adversary`);
  allConfirmed.push(...confirmed);
}

// Synthesize: turn surviving, adversary-confirmed pain points into ranked fixes.
phase('Synthesize');
if (!allConfirmed.length) {
  return { confirmed: [], fixes: [], note: 'No pain points survived the adversary — combat reads healthy across personas this run.' };
}
const brief = allConfirmed.map(c => `- [${c.persona}/${c.pp.area}/${c.pp.severity}] ${c.verdict.reframe || c.pp.issue}  (evidence: ${c.pp.evidence})`).join('\n');
const moods = allConfirmed.map(c => `${c.persona}: ${c.mood}${c.quit?' (would quit)':''}`);
const synth = await agent(
  `These player pain points survived an adversarial review of REAL Cat Bond battle telemetry across personas:\n\n${brief}\n\n`+
  `Player moods: ${[...new Set(moods)].join('; ')}\n\n`+
  `Cat Bond is a browser Canvas real-time capture-battle game (public/cat-bond/). Combat knobs live in js/battle.js (global tempo dt scale, dodge, combo/ult multipliers, enemy AI distances, shield verbs) and loadouts/skills in js/skills.js. `+
  `Propose concrete, minimal fixes. Each must name the file + knob + direction, say which personas it helps, and flag risk. Rank P0 (most players hit it) to P2 (niche). Do not propose changes that would undo the recent tempo/dodge/combo/shield work unless the data demands it.`,
  { label:'synthesize', phase:'Synthesize', schema: FIX_SCHEMA }
);

return {
  roundsRun: ROUNDS,
  personas: PERSONAS,
  battlesPerPersona: BATTLES,
  confirmedCount: allConfirmed.length,
  confirmed: allConfirmed.map(c => ({ persona:c.persona, area:c.pp.area, severity:c.pp.severity, issue:c.verdict.reframe||c.pp.issue, evidence:c.pp.evidence })),
  fixes: synth?.fixes || [],
};
