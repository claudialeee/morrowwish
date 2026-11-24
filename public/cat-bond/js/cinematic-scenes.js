/* Canon-aligned authored scene catalogue. Story triggers/state remain owned by Chat 4. */
(() => {
  'use strict';
  const image = path => `assets/cinematics/${path}`;
  const scenes = [
    {
      id: 'prologue/P-01', sourceSceneId: 'P-01', chapter: { zh: '序章 · 无声之铃', en: 'PROLOGUE · THE SILENT BELL' },
      title: { zh: '六座圣所', en: 'Six Sanctuaries' }, mode: 'auto', allowSkip: true,
      frames: [{ id: 'p01-six-sanctuaries', image: image('prologue/p01-six-sanctuaries.svg'),
        alt: { zh: '六座圣所依次回应，中央星铃被坠星击中', en: 'Six sanctuaries answer before a falling star strikes the Central Star Bell' },
        durationMs: 7600, camera: { from: { x: 0, y: 1, scale: 1.02 }, to: { x: -2, y: -2, scale: 1.09 } } }]
    },
    {
      id: 'prologue/P-02', sourceSceneId: 'P-02', chapter: { zh: '序章 · 无声之铃', en: 'PROLOGUE · THE SILENT BELL' },
      title: { zh: '第一任守铃者的选择', en: "The First Bellkeeper's Choice" }, mode: 'auto', allowSkip: true,
      frames: [
        { id: 'p02-01', image: image('prologue/p02-first-bellkeepers-choice.svg'), durationMs: 4800,
          camera: { from: { x: -3, y: 0, scale: 1.03 }, to: { x: -7, y: -1, scale: 1.09 } },
          subtitle: { zh: { speaker: '暮铃', text: '还有办法。我们还没试完所有办法。' }, en: { speaker: 'Muling', text: 'There is still a way. We have not tried everything.' } } },
        { id: 'p02-02', image: image('prologue/p02-first-bellkeepers-choice.svg'), durationMs: 4200,
          camera: { from: { x: -7, y: -1, scale: 1.09 }, to: { x: -5, y: -2, scale: 1.12 } },
          subtitle: { zh: { speaker: '玩家', text: '来不及了。' }, en: { speaker: 'Player', text: 'There is no time.' } } },
        { id: 'p02-03', image: image('prologue/p02-first-bellkeepers-choice.svg'), durationMs: 7000,
          camera: { from: { x: -5, y: -2, scale: 1.12 }, to: { x: -2, y: -2, scale: 1.14 } },
          subtitle: { zh: { speaker: '暮铃 / 玩家', text: '暮铃：那就再找一天。\n玩家：它已经进入港口了。再等下去，连他们是谁都不会记得。' },
            en: { speaker: 'Muling / Player', text: 'Muling: Then find one more day.\nPlayer: It has already reached the harbor. If we wait, they will forget who they are.' } } },
        { id: 'p02-04', image: image('prologue/p02-first-bellkeepers-choice.svg'), durationMs: 7000,
          camera: { from: { x: 0, y: -2, scale: 1.14 }, to: { x: 3, y: -1, scale: 1.16 } },
          subtitle: { zh: { speaker: '暮铃 / 玩家', text: '暮铃：那就让我去。\n玩家：你去了也一样。\n暮铃：你答应过我，不会再一个人做这种决定。' },
            en: { speaker: 'Muling / Player', text: 'Muling: Then let me go.\nPlayer: It would be the same if you went.\nMuling: You promised you would never make this kind of decision alone again.' } } },
        { id: 'p02-05', image: image('prologue/p02-first-bellkeepers-choice.svg'), durationMs: 8000,
          camera: { from: { x: 3, y: -1, scale: 1.16 }, to: { x: 1, y: -2, scale: 1.18 } },
          subtitle: { zh: { speaker: '暮铃 / 玩家', text: '玩家：我知道。\n暮铃：那就回答我。你听见了吗？\n玩家：听见了。\n暮铃：看着我。' },
            en: { speaker: 'Muling / Player', text: 'Player: I know.\nMuling: Then answer me. Can you hear it?\nPlayer: I can.\nMuling: Look at me.' } } },
        { id: 'p02-06', image: image('prologue/p02-first-bellkeepers-choice.svg'), durationMs: 9500,
          camera: { from: { x: 1, y: -2, scale: 1.18 }, to: { x: 0, y: -4, scale: 1.22 } },
          subtitle: { zh: { speaker: '暮铃 / 玩家', text: '玩家：对不起。\n暮铃：我不要你的道歉。\n玩家：如果他们还能回应彼此，就让他们自己发出声音。\n暮铃：你回来以后，亲自告诉我这句话是什么意思。' },
            en: { speaker: 'Muling / Player', text: 'Player: I am sorry.\nMuling: I do not want your apology.\nPlayer: If they can still answer one another, let them make their own voices heard.\nMuling: When you come back, tell me yourself what that means.' } } },
        { id: 'p02-seal-closes', image: image('prologue/p02-first-bellkeepers-choice.svg'), durationMs: 6200,
          camera: { from: { x: 0, y: -4, scale: 1.22 }, to: { x: 0, y: -1, scale: 1.08 } },
          alt: { zh: '玩家将爪子放在破损星铃上，记忆进入紧急锚点，封印隔开暮铃与玩家', en: 'The player places a paw on the broken Star Bell; memories enter the emergency anchor and the seal closes between the two cats' } }
      ]
    },
    {
      id: 'prologue/P-03', sourceSceneId: 'P-03', chapter: { zh: '序章 · 无声之铃', en: 'PROLOGUE · THE SILENT BELL' },
      title: { zh: '漫长的等待', en: 'Years of Waiting' }, mode: 'auto', allowSkip: true,
      frames: [{ id: 'p03-seasons', image: image('prologue/p03-years-of-waiting.svg'),
        alt: { zh: '季节掠过荒废的阳光花园，暮铃带回地图、旧记录、工具和破损的铃', en: 'Seasons pass over the abandoned Sunlit Garden as Muling returns with maps, records, tools and broken bells' },
        durationMs: 8500, camera: { from: { x: 4, y: 0, scale: 1.02 }, to: { x: -2, y: -1, scale: 1.1 } } }]
    },
    {
      id: 'prologue/P-04', sourceSceneId: 'P-04', chapter: { zh: '序章 · 无声之铃', en: 'PROLOGUE · THE SILENT BELL' },
      title: { zh: '苏醒', en: 'Awakening' }, mode: 'auto', allowSkip: true,
      frames: [
        { id: 'p04-01', image: image('prologue/p04-awakening.svg'), durationMs: 3600, camera: { from: { x: -4, y: 0, scale: 1.02 }, to: { x: -5, y: -2, scale: 1.07 } },
          subtitle: { zh: { speaker: '玩家', text: '这里是……？' }, en: { speaker: 'Player', text: 'Where is…?' } } },
        { id: 'p04-02', image: image('prologue/p04-awakening.svg'), durationMs: 3200, camera: { from: { x: -5, y: -2, scale: 1.07 }, to: { x: -3, y: -1, scale: 1.08 } },
          subtitle: { zh: { speaker: '暮铃', text: '阳光花园。' }, en: { speaker: 'Muling', text: 'Sunlit Garden.' } } },
        { id: 'p04-03', image: image('prologue/p04-awakening.svg'), durationMs: 3200, camera: { from: { x: -3, y: -1, scale: 1.08 }, to: { x: -2, y: -1, scale: 1.1 } },
          subtitle: { zh: { speaker: '玩家', text: '你认识我？' }, en: { speaker: 'Player', text: 'Do you know me?' } } },
        { id: 'p04-04', image: image('prologue/p04-awakening.svg'), durationMs: 4600, camera: { from: { x: -2, y: -1, scale: 1.1 }, to: { x: 0, y: -1, scale: 1.12 } },
          subtitle: { zh: { speaker: '暮铃 / 玩家', text: '暮铃：我叫暮铃。你呢？\n玩家：我不知道。' }, en: { speaker: 'Muling / Player', text: 'Muling: My name is Muling. What is yours?\nPlayer: I do not know.' } } },
        { id: 'p04-05', image: image('prologue/p04-awakening.svg'), durationMs: 5200, camera: { from: { x: 0, y: -1, scale: 1.12 }, to: { x: 2, y: -1, scale: 1.13 } },
          subtitle: { zh: { speaker: '暮铃 / 玩家', text: '暮铃：那就先不找名字。名字不会跑。\n玩家：这里发生过什么？' }, en: { speaker: 'Muling / Player', text: 'Muling: Then we will not look for your name yet. It is not going anywhere.\nPlayer: What happened here?' } } },
        { id: 'p04-06', image: image('prologue/p04-awakening.svg'), durationMs: 7000, camera: { from: { x: 2, y: -1, scale: 1.13 }, to: { x: 0, y: -3, scale: 1.15 } },
          subtitle: { zh: { speaker: '暮铃 / 玩家', text: '暮铃：很久以前，有一座钟停了。现在它又开始出声了。\n玩家：为什么？\n暮铃：这正是我想查清楚的事。' },
            en: { speaker: 'Muling / Player', text: 'Muling: A long time ago, a bell stopped. Now it has begun to sound again.\nPlayer: Why?\nMuling: That is exactly what I want to find out.' } } }
      ]
    },
    {
      id: 'prologue/P-05', sourceSceneId: 'P-05', chapter: { zh: '序章 · 无声之铃', en: 'PROLOGUE · THE SILENT BELL' },
      title: { zh: '启程', en: 'The Journey' }, mode: 'auto', allowSkip: true,
      objective: { zh: '离开阳光花园，前往霁潮港。', en: 'Leave Sunlit Garden and travel to Misttide Harbor.' },
      frames: [
        { id: 'p05-01', image: image('prologue/p05-the-journey.svg'), durationMs: 4200, camera: { from: { x: 2, y: 0, scale: 1.02 }, to: { x: 0, y: -1, scale: 1.08 } },
          subtitle: { zh: { speaker: '玩家', text: '你一个人不行吗？' }, en: { speaker: 'Player', text: 'Can you not do it alone?' } } },
        { id: 'p05-02', image: image('prologue/p05-the-journey.svg'), durationMs: 4400, camera: { from: { x: 0, y: -1, scale: 1.08 }, to: { x: -2, y: -1, scale: 1.1 } },
          subtitle: { zh: { speaker: '暮铃', text: '如果我一个人行，我就不会站在这里了。' }, en: { speaker: 'Muling', text: 'If I could do it alone, I would not be standing here.' } } },
        { id: 'p05-03', image: image('prologue/p05-the-journey.svg'), durationMs: 4800, camera: { from: { x: -2, y: -1, scale: 1.1 }, to: { x: 1, y: -1, scale: 1.12 } },
          subtitle: { zh: { speaker: '玩家 / 暮铃', text: '玩家：那我们一起去。\n暮铃：你甚至不知道自己是谁。' }, en: { speaker: 'Player / Muling', text: 'Player: Then we will go together.\nMuling: You do not even know who you are.' } } },
        { id: 'p05-04', image: image('prologue/p05-the-journey.svg'), durationMs: 5200, camera: { from: { x: 1, y: -1, scale: 1.12 }, to: { x: 0, y: -2, scale: 1.15 } },
          subtitle: { zh: { speaker: '玩家 / 暮铃', text: '玩家：但我知道他们需要帮助。\n暮铃：……还是没变。' }, en: { speaker: 'Player / Muling', text: 'Player: But I know they need help.\nMuling: …You have not changed.' } } }
      ]
    },
    {
      id: 'finale/B-03', sourceSceneId: 'B-03', chapter: { zh: '终章 · 最后的共鸣', en: 'FINALE · THE LAST RESONANCE' },
      title: { zh: '六段旋律归来', en: 'Six Notes Return' }, mode: 'auto', allowSkip: true,
      frames: [
        { id: 'b03-six-regions', image: image('finale/b03-six-notes-return.svg'), durationMs: 5200, camera: { from: { x: 0, y: 1, scale: 1.02 }, to: { x: 0, y: -1, scale: 1.08 } },
          subtitle: { zh: { speaker: '暮铃', text: '他们真的……还记得彼此。' }, en: { speaker: 'Muling', text: 'They really… still remember one another.' } } },
        { id: 'b03-player-answer', image: image('finale/b03-six-notes-return.svg'), durationMs: 4800, camera: { from: { x: 0, y: -1, scale: 1.08 }, to: { x: -2, y: -2, scale: 1.1 } },
          subtitle: { zh: { speaker: '玩家', text: '他们一直都可以。' }, en: { speaker: 'Player', text: 'They always could.' } } },
        { id: 'b03-muling-realizes', image: image('finale/b03-six-notes-return.svg'), durationMs: 4800, camera: { from: { x: -2, y: -2, scale: 1.1 }, to: { x: 2, y: -2, scale: 1.12 } },
          subtitle: { zh: { speaker: '暮铃 / 玩家', text: '暮铃：我以为已经太迟了。\n玩家：你只是没有再给他们机会。' }, en: { speaker: 'Muling / Player', text: 'Muling: I thought it was already too late.\nPlayer: You simply stopped giving them a chance.' } } }
      ]
    },
    {
      id: 'epilogue/E-01', sourceSceneId: 'E-01', chapter: { zh: '尾声 · 铃声再起', en: 'EPILOGUE · THE BELL RINGS AGAIN' },
      title: { zh: '六地回应', en: 'Six Regions Answer' }, mode: 'auto', allowSkip: true,
      frames: [{ id: 'e01-reciprocal-montage', image: image('epilogue/e01-six-regions-answer.svg'),
        alt: { zh: '六个地区通过航船、药草、工具、航线和星图持续互相回应', en: 'Ships, medicine, tools, flight routes and star charts connect all six regions' },
        durationMs: 8500, camera: { from: { x: 0, y: 0, scale: 1.02 }, to: { x: -2, y: -1, scale: 1.09 } } }]
    },
    {
      id: 'epilogue/E-03', sourceSceneId: 'E-03', chapter: { zh: '尾声 · 铃声再起', en: 'EPILOGUE · THE BELL RINGS AGAIN' },
      title: { zh: '阳光花园', en: 'Sunlit Garden' }, mode: 'auto', allowSkip: true,
      frames: [
        { id: 'e03-remember', image: image('epilogue/e03-sunlit-garden.svg'), durationMs: 3800, camera: { from: { x: 0, y: 0, scale: 1.02 }, to: { x: -2, y: -1, scale: 1.08 } },
          subtitle: { zh: { speaker: '暮铃', text: '你还记得我吗？' }, en: { speaker: 'Muling', text: 'Do you still remember me?' } } },
        { id: 'e03-player-remembers', image: image('epilogue/e03-sunlit-garden.svg'), durationMs: 3000, camera: { from: { x: -2, y: -1, scale: 1.08 }, to: { x: 0, y: -1, scale: 1.1 } },
          subtitle: { zh: { speaker: '玩家', text: '记得。' }, en: { speaker: 'Player', text: 'I do.' } } },
        { id: 'e03-accountability', image: image('epilogue/e03-sunlit-garden.svg'), durationMs: 4200, camera: { from: { x: 0, y: -1, scale: 1.1 }, to: { x: 2, y: -1, scale: 1.12 } },
          subtitle: { zh: { speaker: '暮铃 / 玩家', text: '暮铃：也记得我做过什么？\n玩家：记得。' }, en: { speaker: 'Muling / Player', text: 'Muling: And you remember what I did?\nPlayer: I do.' } } },
        { id: 'e03-second-key', image: image('epilogue/e03-sunlit-garden.svg'), durationMs: 6500, camera: { from: { x: 2, y: -1, scale: 1.12 }, to: { x: 0, y: -2, scale: 1.14 } },
          subtitle: { zh: { speaker: '暮铃 / 玩家', text: '暮铃：那你还愿意让我留下？\n玩家：留下来吧。这次，我们一起决定以后怎么走。' }, en: { speaker: 'Muling / Player', text: 'Muling: Then are you willing to let me stay?\nPlayer: Stay. This time, we decide together what comes next.' } } }
      ]
    }
  ];
  window.CatBondCinematicScenes = scenes;
})();
