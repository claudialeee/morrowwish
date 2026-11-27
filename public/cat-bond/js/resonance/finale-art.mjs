// Canon 2.2 phase-specific original paintings. All paths relative to assets/.
export const finaleArt=Object.freeze({
 "finale:B-01":Object.freeze({wide:"combat/star-bell-arena-lock-wide.webp",portrait:"mobile-portrait/battle-finale-lock.webp"}),
 "finale:B-02":Object.freeze({wide:"combat/star-bell-arena-wide.webp",portrait:"mobile-portrait/battle-finale.webp"}),
 "finale:B-03":Object.freeze({wide:"combat/star-bell-arena-chorus-wide.webp",portrait:"mobile-portrait/battle-finale-chorus.webp"}),
 "finale:B-04":Object.freeze({wide:"core-art-remaster/story/b04-reunion.webp",portrait:"mobile-portrait/story-b04-reunion.webp"})
});
export function finaleBattleAsset(id,portrait=false){
 const phase=id==="finale:B-04"?"finale:B-03":id;
 return (finaleArt[phase]||finaleArt["finale:B-02"])[portrait?"portrait":"wide"];
}
