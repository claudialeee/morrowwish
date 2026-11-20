// Draft community-specific Reddit promotion posts for actual live homepage games.
// This deliberately never publishes: Reddit API approval and subreddit rules are separate.
import fs from 'node:fs';
import path from 'node:path';
import { publishedGames, trackedLink } from './discovery.mjs';

const hooks = {
 'pawsibly-innocent': ['playmygame','[Web] We made a cat game about stealing three fish (and pretending to be innocent)','Sneak through eight playful rooms, throw yarn to distract the human, steal three fish, and escape through the cat flap.','What is the first thing you tried as the cat?'],
 elsewhere: ['playmygame','[Web] We made a free game about living a life you never chose','Pick a parallel life, make choices that change what happens, and discover where your story ends.','Which life would you try first?'],
 'tiny-town': ['indiegames','We made a tiny town-builder where AI does the work and people get their time back','With money and resources no longer the problem, the question is what kind of town you want to build with all that freedom.','What would be the first place you build?'],
 'flip-dash': ['playmygame','[Web] We made a one-tap gravity-flipping game you can play in a browser','Flip gravity, dodge the spikes, and try to beat your best run.','Did the controls make sense right away?'],
 'parcel-panic': ['playmygame','[Web] We made a one-click package sorting game for quick breaks','One click per parcel, but the rush keeps coming. How long can you keep a streak going?','Did you figure out the sorting rule quickly?'],
 'pocket-aquarium': ['playmygame','[Web] We made a 60-second aquarium game about feeding the right fish','Match food to hungry fish and keep the aquarium clean before time runs out.','What was your aquarium like at the end of a run?']
};
function draft(game) {
 const [community,title,description,question] = hooks[game.slug] || ['playmygame','[Web] We released '+game.title+', a free browser game',game.description,'What did you enjoy most, and what felt unclear?'];
 const trackedUrl = trackedLink(game,'reddit','social','playtest');
 const body = ['We are Morrow Wish, a small indie game studio, and we made '+game.title+(/[.!?]$/.test(game.title)?'':'.'),description,'Play free in your browser (no download or account): '+trackedUrl,question,'Developer post / self-promotion disclosure: this is our game.'].join('\n\n');
 const form = new URL('https://www.reddit.com/r/'+community+'/submit');
 form.searchParams.set('title',title); form.searchParams.set('text',body);
 return {slug:game.slug,game:game.title,community:'r/'+community,title,body,gameUrl:game.url,trackedUrl,submissionFormUrl:form.toString(),status:'draft-not-posted'};
}
const out='release-kit'; fs.mkdirSync(out,{recursive:true});
const all=publishedGames().map(draft);
const launches=fs.existsSync(path.join(out,'new-launches.json')) ? JSON.parse(fs.readFileSync(path.join(out,'new-launches.json'),'utf8')).newGames || [] : [];
const fresh=new Set(launches.map(g=>g.slug));
const newLaunches=all.filter(x=>fresh.has(x.slug));
fs.writeFileSync(path.join(out,'reddit-posts.json'),JSON.stringify({studio:'Morrow Wish',postingRequiresAuthorization:true,drafts:all,newLaunches},null,2)+'\n');
fs.writeFileSync(path.join(out,'reddit-posts.md'),'# Morrow Wish — Reddit launch queue\n\n**NOT POSTED.** Check each subreddit’s current rules and required flair. Do not mass-post.\n\n'+all.map(x=>'## '+x.game+' — '+x.community+'\n\n**Title:** '+x.title+'\n\n'+x.body+'\n\n[Open Reddit submission draft]('+x.submissionFormUrl+')\n').join('\n'));
console.log('Prepared '+all.length+' Reddit drafts; '+newLaunches.length+' new games. No Reddit submissions made.');
