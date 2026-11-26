// Canon 2.2 cloud waterfall: deterministic input-driven flight; replayable proof.
function newGlide(operation,choice){return {operation,choice,training:choice==="train"||operation==="puzzle:sky-pouch",practice:operation==="puzzle:sky-pouch",openGlide:true,x:0,y:.5,target:.5,velocity:0,elapsed:0,attempts:0,started:false,solved:false,notice:"ready",gate:0,passed:[],route:[],lastSteer:0,steerTravel:0,routeUsed:null,liftTime:0,platform:false,frames:0,acc:0,inputs:[],sampledTarget:.5};}

function steerGlide(f,y){if(!f||f.solved||!Number.isFinite(y))return false;const target=Math.max(.15,Math.min(.85,y));f.target=target;f.started=true;f.notice="flying";const last=f.inputs.at(-1);if(last?.frame===f.frames)last.y=target;else if(last?.y!==target)f.inputs.push({frame:f.frames,y:target});return true;}

function retryGlide(f,notice){const attempts=f.attempts+1;Object.assign(f,newGlide(f.operation,f.choice),{attempts,notice});}

function glideStep(f){const dt=.02;if(Math.abs(f.target-f.sampledTarget)>.015){f.lastSteer++;f.steerTravel+=Math.abs(f.target-f.sampledTarget);f.sampledTarget=f.target;}f.frames++;f.elapsed=f.frames*dt;const lift=f.x>.13&&f.x<.39&&f.y<.43;const storm=f.x>.39&&f.x<.72;const wind=Math.sin(f.x*19)*.055+(storm&&f.routeUsed==="upper"?Math.sin(f.x*51)*.13:0);f.velocity+=((f.target-f.y)*5+wind+(lift?-.18:.07)-f.velocity*3)*dt;f.y+=f.velocity*dt; if(lift)f.liftTime+=dt;
 if(f.practice){f.routeUsed="practice";f.x=Math.min(1,f.x+.16*dt);if(f.y<.10||f.y>.90){retryGlide(f,"edge");return false;}if(f.x>=1){if(Math.abs(f.y-.5)>.18||f.lastSteer<2||f.steerTravel<.20||f.liftTime<.3){retryGlide(f,"landing");return false;}f.solved=true;f.notice="landed";return true;}return false;}
 if(!f.routeUsed&&f.x>=.37){if(f.y<.41&&f.liftTime>=.7)f.routeUsed="upper";else if(f.y>.55)f.routeUsed="lower";else {retryGlide(f,"miss");return false;}}
 if(storm&&((f.routeUsed==="upper"&&f.y>.48)||(f.routeUsed==="lower"&&f.y<.50))){retryGlide(f,"miss");return false;}
 if(f.routeUsed==="lower"&&f.x>.55&&f.x<.68&&f.y>.64&&f.y<.80)f.platform=true;
 if(f.y<.10||f.y>.90||f.frames>1500){retryGlide(f,"edge");return false;}
 f.x=Math.min(1,f.x+(f.routeUsed==="upper"?.135:f.routeUsed==="lower"?.075:.10)*dt);
 if(f.x>=1){if(Math.abs(f.y-.5)>(f.training?.18:.13)||f.lastSteer<2||f.steerTravel<.20||(f.routeUsed==="lower"&&!f.platform)){retryGlide(f,"landing");return false;}f.solved=true;f.notice="landed";return true;}return false;}

function tickGlide(f,dt){if(!f?.started||f.solved||!Number.isFinite(dt)||dt<=0)return false;f.acc+=Math.min(dt,.10);while(f.acc+1e-9>=.02){f.acc-=.02;const attempts=f.attempts;if(glideStep(f))return true;if(f.attempts!==attempts)return false;}return false;}

function glideProof(f){return f?.solved?{operation:f.operation,choice:f.choice,route:f.routeUsed,frames:f.frames,inputs:f.inputs.map(x=>({...x})),landing:f.y,attempts:f.attempts}:null;}

function validGlideProof(operation,choice,p){if(!["puzzle:joint-flight","puzzle:sky-pouch","explore:flight-recorder"].includes(operation)||p?.operation!==operation||p.choice!==choice||!Number.isInteger(p.frames)||p.frames<1||p.frames>1500||!Number.isInteger(p.attempts)||p.attempts<0||!Array.isArray(p.inputs)||!p.inputs.length||p.inputs.length>1500||p.inputs[0]?.frame!==0||!Number.isFinite(p.landing))return false;const f=newGlide(operation,choice);let j=0;for(let i=0;i<p.frames;i++){const a=p.inputs[j];if(a?.frame===i){if(!Number.isFinite(a.y)||a.y<.15||a.y>.85||!steerGlide(f,a.y))return false;j++;}if(p.inputs[j]?.frame<=i)return false;glideStep(f);if(f.attempts||f.solved&&i!==p.frames-1)return false;}return f.solved&&j===p.inputs.length&&f.routeUsed===p.route&&Math.abs(f.y-p.landing)<1e-6;}
export {newGlide,steerGlide,tickGlide,glideProof,validGlideProof};
