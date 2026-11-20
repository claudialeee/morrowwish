// Morrow Wish: Reddit launch drafts are paused until a community explicitly
// permits both AI-assisted games and developer self-promotion. 
// Do not silently route to r/playmygame, r/Games, or similar restricted subs.
// The release-kit contract remains intact for CI, but it issues no submissions.
import fs from 'node:fs';

const policy=JSON.parse(fs.readFileSync('promotion/channel-policy.json','utf8'));
const reddit=policy.channels.find(x=>x.name==='Reddit');
if(reddit?.state!=='manual-reviewed-only')throw Error('Unexpected Reddit policy; review before changing community outreach.');
const blocked=new Set(policy.blocked.map(x=>x.name.toLowerCase()));
if(!blocked.has('r/playmygame')||!blocked.has('r/games'))
 throw Error('Restricted subreddit denylist was changed without review.');
fs.mkdirSync('release-kit',{recursive:true});
fs.writeFileSync('release-kit/reddit-posts.json',JSON.stringify({
 studio:'Morrow Wish',postingRequiresAuthorization:true,
 status:'paused-awaiting-community-rules-review',
 reason:'No subreddit is currently approved for automatic launch drafts; do not spam AI-restrictive communities.',
 drafts:[],newLaunches:[]
},null,2)+'\n');
fs.writeFileSync('release-kit/reddit-posts.md',
 '# Morrow Wish — Reddit launch queue\n\nNo automatic Reddit launch drafts. Communities must explicitly allow AI-assisted games and developer self-promotion; verify rules before posting.\n');
console.log('Reddit launch draft generation held by channel policy. No submissions or automated new-launch issues.');
