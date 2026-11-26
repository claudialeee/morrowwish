import assert from 'node:assert/strict';
import {newReplyEdge,clearReplySource,disruptReply,advanceReply,replyProof,validReplyProof,centralEchoHealth} from '../public/cat-bond/js/resonance/canon22-finale-replies.mjs';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
const regions=campaign.regions,edges=regions.map((r,i)=>newReplyEdge(r,regions[(i+1)%regions.length]));
assert.equal(advanceReply(edges[0],.05,1,true,2),null);assert.equal(edges[0].progress,0);assert.equal(replyProof(edges[0]),null);
for(const [i,e] of edges.entries()){
 const t=i*6;assert.ok(clearReplySource(e,t));for(let k=1;k<=60&&!e.done;k++)advanceReply(e,.05,t+k*.05,true,2);
 assert.ok(e.done);assert.ok(replyProof(e));
}
let proof=edges.map(replyProof);assert.ok(validReplyProof(regions,proof,36));assert.equal(validReplyProof(regions,proof,proof.at(-1).secondAt+.5),false);assert.equal(validReplyProof(regions,proof.slice(1),36),false);
assert.ok(disruptReply(edges[2],36));assert.equal(replyProof(edges[2]),null);assert.equal(validReplyProof(regions,edges.map(replyProof),36),false);
for(let k=1;k<=60&&!edges[2].done;k++)advanceReply(edges[2],.05,36+k*.05,true,2);
proof=edges.map(replyProof);assert.ok(validReplyProof(regions,proof,41));assert.equal(validReplyProof(regions,proof.map((e,i)=>i===2?{...e,firstAt:35}:e),41),false);
console.log('Finale reply sources, interruption, independent fresh endpoint replies, stable interval and proof rejection passed');

// Fresh-slot level-one party (138+145 HP), plus larger and solo teams.
assert.equal(centralEchoHealth(283,true),283);
assert.equal(centralEchoHealth(283,false),35);
assert.equal(centralEchoHealth(138,false),35);
assert.equal(centralEchoHealth(800,false),96);
assert.equal(centralEchoHealth(800,true),800);
console.log('Central echo pacing scales with actual team HP while preserving all six reply gates');
