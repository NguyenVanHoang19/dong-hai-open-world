export type AudioSettings={enabled:boolean;master:number;music:number;ambience:number;effects:number};
export const DEFAULT_AUDIO:AudioSettings={enabled:true,master:.7,music:.3,ambience:.5,effects:.8};
export const AUDIO_STORAGE='dong-hai-audio-v1';
export function cleanAudioSettings(value:unknown):AudioSettings{
 const v=value&&typeof value==='object'?value as Partial<AudioSettings>:{};
 const volume=(k:'master'|'music'|'ambience'|'effects')=>typeof v[k]==='number'&&Number.isFinite(v[k])?Math.max(0,Math.min(1,v[k]!)):DEFAULT_AUDIO[k];
 return {enabled:typeof v.enabled==='boolean'?v.enabled:true,master:volume('master'),music:volume('music'),ambience:volume('ambience'),effects:volume('effects')};
}
export function readAudioSettings():AudioSettings{try{return cleanAudioSettings(JSON.parse(localStorage.getItem(AUDIO_STORAGE)||'null'))}catch{return {...DEFAULT_AUDIO}}}
export type SoundCue='ui'|'interact'|'purchase'|'quest'|'jump'|'land'|'mount'|'dismount';
export type AudioFrame={speed:number;vehicle:'bike'|'car'|null;grounded:boolean;coastDistance:number;surface:()=> 'road'|'dirt'};
/** Distance-based cadence: no footsteps when a player runs against a wall or sits in a vehicle. */
export class FootstepClock{
 distance=0;lastGrounded:boolean|null=null;index=0;
 advance(dt:number,speed:number,grounded:boolean,vehicle:boolean){
  const landed=this.lastGrounded===false&&grounded&&!vehicle;this.lastGrounded=vehicle?null:grounded;
  if(vehicle||!grounded||speed<.12){this.distance=0;return {step:false,landed};}
  this.distance+=Math.max(0,Math.min(dt,.1))*Math.abs(speed);const stride=speed>4?1.65:.95;
  const step=this.distance>=stride;if(step){this.distance%=stride;this.index=(this.index+1)%3;}return {step,landed};
 }
 reset(){this.distance=0;this.lastGrounded=null;}
}
const clips=['village-music','village-air','coast-surf','step-road-1','step-road-2','step-road-3','step-dirt-1','step-dirt-2','step-dirt-3','ui','interact','purchase','quest','jump','land','mount','dismount'];
type Buses={master:GainNode;music:GainNode;ambience:GainNode;effects:GainNode;air:GainNode;surf:GainNode;engine:GainNode};
export class GameAudio{
 settings=readAudioSettings();context:AudioContext|null=null;error='';disposed=false;paused=false;hidden=false;unlocked=false;clock=new FootstepClock();
 private meter:AnalyserNode|null=null;private meterSamples=new Float32Array(256);private recent:string[]=[];private buses:Buses|null=null;private loadTask:Promise<void>|null=null;private buffers=new Map<string,AudioBuffer>();private abort=new AbortController();private loops:AudioBufferSourceNode[]=[];private voices=new Set<AudioBufferSourceNode>();private voiceIds=new WeakMap<AudioBufferSourceNode,string>();private engineOsc:OscillatorNode[]=[];private engineFilter:BiquadFilterNode|null=null;private coast=0;private variant=0;
 constructor(private persistSettings=true){}
 configure(patch:Partial<AudioSettings>){this.settings=cleanAudioSettings({...this.settings,...patch});if(this.persistSettings)try{localStorage.setItem(AUDIO_STORAGE,JSON.stringify(this.settings))}catch{}this.mix();}
 private target(param:AudioParam,value:number,time=.08){if(!this.context)return;param.cancelScheduledValues(this.context.currentTime);param.setTargetAtTime(value,this.context.currentTime,time);}
 private mix(){if(!this.buses)return;const b=this.buses,s=this.settings;this.target(b.master.gain,s.enabled&&!this.hidden?s.master:0);this.target(b.music.gain,s.music*(this.paused?.3:1));this.target(b.ambience.gain,s.ambience*(this.paused?.25:1));this.target(b.effects.gain,s.effects);this.target(b.air.gain,1-this.coast*.4);this.target(b.surf.gain,this.coast*.8);if(this.paused||this.hidden)this.target(b.engine.gain,0,.03);}
 /** Must be called directly from a click/key gesture, before any fetch awaits. */
 async unlock(){
  if(this.disposed||!this.settings.enabled)return false;
  try{
   if(!this.context){
    const ctx=this.context=new AudioContext();const gain=()=>{const g=ctx.createGain();g.gain.value=0;return g};
    const master=gain(),music=gain(),ambience=gain(),effects=gain(),air=gain(),surf=gain(),engine=gain();this.buses={master,music,ambience,effects,air,surf,engine};
    const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=12;limiter.ratio.value=6;limiter.attack.value=.005;limiter.release.value=.15;
    music.connect(master);ambience.connect(master);effects.connect(master);air.connect(ambience);surf.connect(ambience);engine.connect(effects);master.connect(limiter);const meter=this.meter=ctx.createAnalyser();meter.fftSize=256;limiter.connect(meter);meter.connect(ctx.destination);
    const filter=this.engineFilter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=240;filter.Q.value=.4;filter.connect(engine);
    for(const [type,freq] of [['sawtooth',48],['triangle',24]] as const){const osc=ctx.createOscillator();osc.type=type;osc.frequency.value=freq;osc.connect(filter);osc.start();this.engineOsc.push(osc);}
   }
   await this.context.resume();if(this.disposed)return false;this.unlocked=this.context.state==='running';this.mix();
   if(!this.loadTask)this.loadTask=this.load();await this.loadTask;return this.unlocked;
  }catch(e){if(!this.disposed)this.error='Không bật được âm thanh. Bấm bật âm thanh để thử lại.';return false;}
 }
 private async load(){
  const ctx=this.context!;const result=await Promise.allSettled(clips.map(async id=>{
   const extension=id.startsWith('village-')||id==='coast-surf'?'mp3':'wav';
   const response=await fetch('/audio/'+id+'.'+extension,{signal:this.abort.signal});if(!response.ok)throw new Error(id+' HTTP '+response.status);
   const bytes=await response.arrayBuffer();if(this.disposed)return;const buffer=await ctx.decodeAudioData(bytes);if(!this.disposed)this.buffers.set(id,buffer);
  }));
  if(this.disposed)return;const failures=result.filter(x=>x.status==='rejected').length;if(failures)this.error=`Chưa tải được ${failures} âm thanh. Tải lại trang để thử lại.`;
  for(const [id,bus] of [['village-music','music'],['village-air','air'],['coast-surf','surf']] as const){const buffer=this.buffers.get(id);if(!buffer)continue;const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(this.buses![bus]);source.start();this.loops.push(source);}this.mix();
 }
 cue(id:SoundCue){this.play(id);}
 private play(id:string){
  if(!this.context||!this.buses||this.disposed||!this.settings.enabled||this.hidden||this.context.state!=='running'||this.voices.size>=16)return;
  const buffer=this.buffers.get(id);if(!buffer)return;
  const voice=this.context.createBufferSource(),gain=this.context.createGain();voice.buffer=buffer;voice.playbackRate.value=id.startsWith('step')?1+(this.variant++%3-1)*.045:1;gain.gain.value=id==='quest'?.8:1;voice.connect(gain);gain.connect(this.buses.effects);this.voices.add(voice);this.voiceIds.set(voice,id);this.recent.push(id);this.recent=this.recent.slice(-6);voice.onended=()=>{voice.disconnect();gain.disconnect();this.voices.delete(voice)};voice.start();
 }
 update(dt:number,frame:AudioFrame){
  if(this.paused||this.hidden||this.disposed){this.clock.reset();return;}
  const events=this.clock.advance(dt,frame.speed,frame.grounded,!!frame.vehicle);
  if(events.landed)this.cue('land');else if(events.step)this.play('step-'+frame.surface()+'-'+(this.clock.index+1));
  const coast=Math.max(0,Math.min(1,1-frame.coastDistance/180));if(Math.abs(coast-this.coast)>.02){this.coast=coast;this.mix();}
  if(this.buses&&this.engineFilter){const speed=Math.abs(frame.speed),on=!!frame.vehicle;const base=frame.vehicle==='car'?34:48;this.target(this.engineOsc[0].frequency,base+speed*5.5,.14);this.target(this.engineOsc[1].frequency,base/2+speed*2.75,.14);this.target(this.engineFilter.frequency,180+speed*22,.12);this.target(this.buses.engine.gain,on?.018+Math.min(speed,25)*.0007:0,.09);}
 }
 setPaused(value:boolean){this.paused=value;this.clock.reset();if(value)this.stopVoices(true);this.mix();}
 setHidden(value:boolean){this.hidden=value;this.clock.reset();this.stopVoices();this.mix();if(this.context&&this.unlocked){if(value)void this.context.suspend().catch(()=>{});else if(this.settings.enabled)void this.context.resume().catch(()=>{this.error='Bấm bật âm thanh để tiếp tục.'});}}
 private stopVoices(stepsOnly=false){for(const voice of this.voices){if(stepsOnly&&!this.voiceIds.get(voice)?.startsWith('step'))continue;try{voice.stop()}catch{}this.voices.delete(voice);}}
 status(){let rms=0;if(this.meter){this.meter.getFloatTimeDomainData(this.meterSamples);rms=Math.sqrt(this.meterSamples.reduce((s,v)=>s+v*v,0)/this.meterSamples.length);}return {signalRms:rms,engineGain:this.buses?.engine.gain.value||0,paused:this.paused,hidden:this.hidden,recent:[...this.recent],context:this.context?.state||'locked',loaded:this.buffers.size,total:clips.length,loops:this.loops.length,voices:this.voices.size,error:this.error,settings:{...this.settings}};}
 dispose(){if(this.disposed)return;this.disposed=true;this.abort.abort();this.stopVoices();for(const s of this.loops){s.stop();s.disconnect()}for(const s of this.engineOsc){s.stop();s.disconnect()}this.loops=[];this.engineOsc=[];this.buffers.clear();if(this.context)void this.context.close().catch(()=>{});}
}
