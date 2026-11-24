export const meta = {
  name: 'cat-bond-playtest',
  description: 'Multi-round adversarial playtest: persona players simulate real battles, voice reactions, an adversary design-critic pushes every observation into a concrete improvement, then synthesize a ranked design review (always produces suggestions)',
  whenToUse: 'When you want grounded, always-actionable combat/UX critique for Cat Bond from many player types plus an adversarial design reviewer.',
  phases: [
    { title: 'Simulate', detail: 'run the real headless battle sim per persona (ground truth)' },
    { title: 'Voice', detail: 'each persona turns its metrics into reactions + wishes' },
    { title: 'Adversary', detail: 'design-critic turns every reaction into a concrete, graded improvement' },
    { title: 'Synthesize', detail: 'rank all critiques into a prioritized design review' },
  ],
}

// args: { personas?: string[], battles?: number, rounds?: number }
const PERSONAS = (args && args.personas) || ['masher','cautious','explorer','panicky','lazy','impatient'];
const BATTLES = (args && args.battles) || 8;
const ROUNDS = (args && args.rounds) || 1;

// A persona always reports what it felt AND at least one thing it wishes were
// better — even a happy player has an opinion. painPoints may be empty, but
// `wishes` must not be: we want proactive critique every run.
const VOICE_SCHEMA = {
  type:'object', additionalProperties:false,
  properties:{
    persona:{type:'string'},
    mood:{type:'string', description:'engaged / frustrated / bored / confused / annoyed / delighted'},
    funRating:{type:'integer', description:'1 (hated it) to 10 (loved it), based on the real telemetry'},
    quit:{type:'boolean', description:'would this player stop playing?'},
    whatWorked:{type:'string', description:'what felt good, cite a metric'},
    painPoints:{type:'array', items:{type:'object', additionalProperties:false,
      properties:{
        issue:{type:'string', description:'concrete friction in the player\'s own voice'},
        evidence:{type:'string', description:'the metric that shows it (cite numbers)'},
        severity:{type:'string', enum:['low','medium','high']},
        area:{type:'string', enum:['balance','pacing','controls','feedback','onboarding','depth','variety','juice']},
      }, required:['issue','evidence','severity','area']}},
    wishes:{type:'array', minItems:1, description:'at least one thing this player WISHES the game did — even if nothing is broken (new mechanics, more depth, clarity, flair)',
      items:{type:'object', additionalProperties:false,
        properties:{ idea:{type:'string'}, why:{type:'string', description:'what in the telemetry/experience motivates it'}, area:{type:'string', enum:['balance','pacing','controls','feedback','onboarding','depth','variety','juice']} }, required:['idea','why','area']}},
  }, required:['persona','mood','funRating','quit','whatWorked','painPoints','wishes'],
};

// The adversary is a DESIGN CRITIC, not a gate. For EVERY observation (pain or
// wish) it must return a concrete, graded improvement — it may downgrade a weak
// point to low priority, but it never discards: it always proposes something.
const CRITIQUE_SCHEMA = {
  type:'object', additionalProperties:false,
  properties:{
    verdict:{type:'string', enum:['real-problem','works-as-intended','opportunity','polish'], description:'real-problem = genuine defect; opportunity = not broken but a clear improvement; works-as-intended = defensible but note the tradeoff; polish = minor flair'},
    critique:{type:'string', description:'the adversarial take — what is actually weak or missing, stated bluntly'},
    suggestion:{type:'string', description:'a concrete change: name the file/knob (js/battle.js tempo/dodge/combo/ult, js/skills.js loadouts, enemy AI) and the direction'},
    priority:{type:'string', enum:['P0','P1','P2','P3']},
    risk:{type:'string', description:'what this could break or who it could hurt'},
  }, required:['verdict','critique','suggestion','priority'],
};

const REVIEW_SCHEMA = {
  type:'object', additionalProperties:false,
  properties:{
    headline:{type:'string', description:'one-sentence verdict on the build\'s combat feel this run'},
    fixes:{type:'array', minItems:3, description:'ranked design review — ALWAYS at least 3 items, even on a healthy run (turn opportunities/polish into suggestions)',
      items:{type:'object', additionalProperties:false,
        properties:{
          title:{type:'string'},
          problem:{type:'string', description:'what is weak/missing and for whom'},
          change:{type:'string', description:'specific file + knob + direction'},
          affects:{type:'array', items:{type:'string'}, description:'which personas benefit'},
          risk:{type:'string'},
          priority:{type:'string', enum:['P0','P1','P2','P3']},
        }, required:['title','problem','change','priority']}}},
  required:['headline','fixes'],
};

const allCritiques = [];
let allVoices = [];

for (let round = 1; round <= ROUNDS; round++) {
  phase('Simulate');
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

  phase('Voice');
  // Each persona voices reactions + wishes; the adversary design-critic then turns
  // EVERY observation (pain or wish) into a concrete graded improvement. Nothing is
  // discarded — a healthy run still yields opportunities and polish suggestions.
  const voiced = await pipeline(
    okSims,
    sim => agent(
      `You ARE the player persona "${sim.label}" (${sim.desc}). Here is the REAL telemetry from ${BATTLES} battles you just played (headless sim of the actual game):\n\n`+
      JSON.stringify(sim.summary, null, 2)+`\n\nPer-battle detail:\n`+JSON.stringify((sim.battles||[]).slice(0,8),null,2)+`\n\n`+
      `Speak in this player's voice. Rate the fun 1-10 from what the telemetry shows. Say what WORKED. List any pain points (each with a cited metric). `+
      `Then — this is required — list at least one WISH: something you'd want even if nothing is broken (deeper mechanics, more variety, clearer feedback, more flair/juice, a reason to come back). A great game still has wishes.`,
      { label:`voice:${sim.persona}`, phase:'Voice', schema: VOICE_SCHEMA }
    ),
    voice => {
      // feed BOTH pains and wishes to the adversary; it must improve each one.
      const items = [
        ...(voice?.painPoints||[]).map(pp => ({ kind:'pain', ...pp })),
        ...(voice?.wishes||[]).map(w => ({ kind:'wish', issue:w.idea, evidence:w.why, area:w.area, severity:'n/a' })),
      ];
      if (!items.length) return [];
      return parallel(items.map(it => () =>
        agent(
          `You are an adversarial SENIOR GAME DESIGNER reviewing Cat Bond (browser real-time capture-battle; combat in public/cat-bond/js/battle.js, skills in js/skills.js). `+
          `A playtester (persona "${voice.persona}", mood ${voice.mood}, fun ${voice.funRating}/10) raised this ${it.kind}:\n\n`+
          `"${it.issue}"  (basis: ${it.evidence}; area: ${it.area})\n\n`+
          `Do NOT merely validate or dismiss it. Push it into something ACTIONABLE: state the blunt adversarial critique (what's genuinely weak, shallow, or missing — even if the metrics look fine, name the deeper design gap), then give ONE concrete suggestion naming a specific file/knob and direction. `+
          `Classify: real-problem / opportunity / works-as-intended / polish, and assign a priority P0–P3. Every review MUST end in a concrete suggestion — there is always something to improve.`,
          { label:`critic:${voice.persona}:${it.area}`, phase:'Adversary', schema: CRITIQUE_SCHEMA }
        ).then(c => ({ persona:voice.persona, mood:voice.mood, fun:voice.funRating, src:it, critique:c }))
      ));
    }
  );
  // Drop entries whose critique agent returned null (StructuredOutput retry-cap exhausted): a null
  // c.critique crashed the Synthesize step (c.critique.verdict on null). Guard here so one failed
  // adversary call can't abort the whole run.
  allCritiques.push(...voiced.flat().filter(c => c && c.critique));
  allVoices = allVoices.concat(okSims.map(s => ({ persona:s.persona, label:s.label })));
  log(`Round ${round}: ${allCritiques.length} adversarial critiques generated`);
}

phase('Synthesize');
// Always produce a ranked design review — never "nothing to report".
const brief = allCritiques.map(c =>
  `- [${c.critique.verdict}/${c.critique.priority}] (${c.persona}) ${c.critique.critique} → ${c.critique.suggestion}`
).join('\n') || '(no critiques captured — infer improvements from the personas that played)';
const funByPersona = allCritiques.length
  ? [...new Set(allCritiques.map(c => `${c.persona}:${c.fun}/10`))].join(', ')
  : PERSONAS.join(', ');
const synth = await agent(
  `You are the lead designer writing a prioritized combat design review for Cat Bond after an adversarial playtest of REAL battle telemetry.\n\n`+
  `Fun ratings: ${funByPersona}\n\nAdversarial critiques gathered across personas:\n${brief}\n\n`+
  `Cat Bond combat knobs: js/battle.js (global tempo dt, dodge, combo/ult multipliers, knockback, enemy AI cadence/distances, shields, lob AOE), js/skills.js (loadouts, skill kinds). `+
  `Produce a one-line headline verdict and a RANKED list of at least 3 concrete improvements (merge duplicates, keep the sharpest). Each names a file+knob+direction, who it helps, and risk. `+
  `Even if combat is healthy, surface the best opportunities and polish — always give the owner something actionable. Rank P0 (most impactful) to P3 (nice-to-have).`,
  { label:'synthesize', phase:'Synthesize', schema: REVIEW_SCHEMA }
);

return {
  roundsRun: ROUNDS,
  personas: PERSONAS,
  battlesPerPersona: BATTLES,
  critiqueCount: allCritiques.length,
  headline: synth?.headline || '',
  critiques: allCritiques.map(c => ({ persona:c.persona, verdict:c.critique.verdict, priority:c.critique.priority, critique:c.critique.critique, suggestion:c.critique.suggestion })),
  fixes: synth?.fixes || [],
};
