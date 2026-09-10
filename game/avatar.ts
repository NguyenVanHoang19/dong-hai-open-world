import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {surface} from './surfaces';
import {loft,type Ring} from './organic';
/** Original skinned village traveller; authored locally, no third-party character assets. */
export function traveller(options:{shirt?:string;hat?:boolean;variant?:number}={}){
 const group=new T.Group(),bones:T.Bone[]=[],parts:T.BufferGeometry[]=[];
 const bone=(name:string,parent:number,x:number,y:number,z:number)=>{const b=new T.Bone();b.name=name;b.position.set(x,y,z);if(parent>=0)bones[parent].add(b);bones.push(b);return bones.length-1};
 const root=bone('pelvis',-1,0,.89,0),spine=bone('spine',root,0,.28,0),neck=bone('neck',spine,0,.29,0),head=bone('head',neck,0,.15,0);
 const leftArm=bone('armL',spine,-.245,.22,0),leftElbow=bone('elbowL',leftArm,-.055,-.29,0),rightArm=bone('armR',spine,.245,.22,0),rightElbow=bone('elbowR',rightArm,.055,-.29,0);
 const leftLeg=bone('legL',root,-.115,-.025,0),leftKnee=bone('kneeL',leftLeg,0,-.39,0),rightLeg=bone('legR',root,.115,-.025,0),rightKnee=bone('kneeR',rightLeg,0,-.39,0);
 function piece(rings:Ring[],color:string,b:number,blend?:{other:number;y:number;radius:number},sides=16){
  const geo=loft(rings,sides),p=geo.attributes.position,c=new T.Color(color),colors:number[]=[],indices:number[]=[],weights:number[]=[];
  for(let i=0;i<p.count;i++){const weight=blend?T.MathUtils.smoothstep(p.getY(i),blend.y-blend.radius,blend.y+blend.radius):0;colors.push(c.r,c.g,c.b);indices.push(b,blend?.other||0,0,0);weights.push(1-weight,weight,0,0);}
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));parts.push(geo);
 }
 const shirt=options.shirt||'#bcb8a5',skin=['#b58464','#ba906f','#a97859'][(options.variant||0)%3],trousers='#344a5c';
 piece([[.83,.18,.105],[.91,.18,.12],[1.0,.16,.11]],trousers,root);
 piece([[.94,.175,.117],[1.02,.174,.12],[1.16,.192,.123],[1.31,.218,.122],[1.41,.226,.108],[1.46,.16,.087],[1.49,.073,.064]],shirt,spine);
 piece([[1.46,.058,.054],[1.54,.055,.053],[1.58,.063,.058]],skin,neck);
 // Jaw, cheeks, brow and cranium are modelled cross-sections, not a sphere head.
 piece([[1.535,.045,.053,0,.018],[1.56,.073,.067,0,.024],[1.6,.095,.082,0,.011],[1.66,.103,.092],[1.71,.098,.087,0,-.006],[1.76,.074,.07,0,-.012],[1.783,.018,.025,0,-.01]],skin,head,undefined,24);
 piece([[1.711,.101,.083,0,-.01],[1.743,.095,.083,0,-.018],[1.774,.07,.066,0,-.018],[1.791,.008,.012,0,-.013]],'#262724',head,undefined,24);
 piece([[1.61,.016,.012,0,.092],[1.625,.022,.023,0,.101],[1.657,.012,.012,0,.098],[1.681,.008,.008,0,.087]],skin,head,undefined,10);
 for(const side of [-1,1]){
  piece([[1.605,.012,.012,side*.103,0],[1.636,.018,.019,side*.105,0],[1.667,.013,.014,side*.102,0]],skin,head,undefined,10);
  piece([[1.668,.015,.004,side*.04,.084],[1.674,.019,.005,side*.04,.087],[1.68,.015,.004,side*.04,.084]],'#252a28',head,undefined,10);
  piece([[1.689,.022,.004,side*.04,.081],[1.694,.02,.004,side*.04,.083]],'#36312c',head,undefined,10);
 }
 piece([[1.579,.018,.004,0,.086],[1.584,.028,.007,0,.087],[1.59,.021,.004,0,.085]],'#865d4d',head,undefined,10);
 for(const [side,arm,elbow,leg,knee] of [[-1,leftArm,leftElbow,leftLeg,leftKnee],[1,rightArm,rightElbow,rightLeg,rightKnee]]){
  piece([[1.15,.061,.068,side*.295,0],[1.22,.069,.079,side*.281,0],[1.35,.076,.078,side*.25,0],[1.415,.065,.068,side*.225,0]],shirt,arm);
  piece([[.83,.035,.022,side*.305,.01],[.91,.039,.04,side*.305,0],[1.02,.052,.051,side*.3,0],[1.1,.054,.055,side*.3,0],[1.17,.058,.061,side*.295,0]],skin,elbow,{other:arm,y:1.1,radius:.065});
  piece([[.775,.033,.018,side*.305,.02],[.82,.042,.025,side*.305,.01],[.867,.033,.022,side*.305,.005]],skin,elbow,undefined,12);
  for(let f=0;f<4;f++){const x=side*.305+(f-1.5)*.018;piece([[.735+Math.abs(f-1.5)*.008,.006,.006,x,.022],[.77,.008,.009,x,.021],[.793,.009,.009,x,.018]],skin,elbow,undefined,8);}
  piece([[.106,.055,.059,side*.115,0],[.19,.065,.067,side*.115,0],[.31,.073,.079,side*.115,-.008],[.455,.073,.081,side*.115,.008],[.51,.08,.086,side*.115,.005],[.65,.094,.103,side*.115,0],[.83,.103,.114,side*.115,0],[.9,.091,.099,side*.115,0]],trousers,knee,{other:leg,y:.47,radius:.1});
  piece([[.02,.075,.14,side*.115,.06],[.045,.078,.146,side*.115,.06],[.065,.075,.143,side*.115,.06]],'#b7b5aa',knee);
  piece([[.06,.072,.138,side*.115,.06],[.095,.071,.13,side*.115,.063],[.135,.059,.071,side*.115,.007],[.17,.053,.058,side*.115,-.006]],'#414442',knee);
 }
 // Narrow shirt placket and rolled-cuff trim replace the oversized backpack silhouette.
 piece([[1.0,.018,.005,0,.121],[1.31,.018,.005,0,.125],[1.44,.017,.005,0,.095]],'#9a998b',spine,undefined,8);
 if(options.hat){piece([[1.764,.16,.155],[1.777,.16,.155],[1.783,.11,.102],[1.875,.094,.091],[1.893,.075,.074]],'#ae9e7d',head,undefined,24);}
 const geometry=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());const material=surface('cloth','#ffffff');material.vertexColors=true;const mesh=new T.SkinnedMesh(geometry,material);mesh.add(bones[0]);mesh.bind(new T.Skeleton(bones));mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;group.add(mesh);
 const mixer=new T.AnimationMixer(mesh),actions:Record<string,T.AnimationAction>={};
 function clip(name:string,duration:number,poses:Record<string,number[]>){const tracks:T.KeyframeTrack[]=[];for(const [boneName,angles] of Object.entries(poses)){const values:number[]=[],times:number[]=[];angles.forEach((a,i)=>{times.push(duration*i/(angles.length-1));const q=new T.Quaternion().setFromEuler(new T.Euler(a,0,0));values.push(q.x,q.y,q.z,q.w)});tracks.push(new T.QuaternionKeyframeTrack(boneName+'.quaternion',times,values))}actions[name]=mixer.clipAction(new T.AnimationClip(name,duration,tracks));}
 clip('idle',2.4,{spine:[.015,.025,.015],armL:[.03,.04,.03],armR:[.03,.04,.03],legL:[0,0,0],legR:[0,0,0],kneeL:[0,0,0],kneeR:[0,0,0],elbowL:[-.1,-.1,-.1],elbowR:[-.1,-.1,-.1]});
 for(const [name,a,duration] of [['walk',.48,1.0],['run',.8,.68]] as const)clip(name,duration,{spine:[.04,.07,.04,.07,.04],armL:[a,0,-a,0,a],armR:[-a,0,a,0,-a],elbowL:[-.35,-.4,-.35,-.4,-.35],elbowR:[-.35,-.4,-.35,-.4,-.35],legL:[-a,0,a,0,-a],legR:[a,0,-a,0,a],kneeL:[.15,.85,.1,.05,.15],kneeR:[.1,.05,.15,.85,.1]});
 clip('ride',1,{spine:[.1,.1],armL:[-.92,-.92],armR:[-.92,-.92],elbowL:[-.38,-.38],elbowR:[-.38,-.38],legL:[-1.25,-1.25],legR:[-1.25,-1.25],kneeL:[1.5,1.5],kneeR:[1.5,1.5]});
 clip('air',1,{spine:[.1,.1],armL:[-.35,-.35],armR:[-.35,-.35],legL:[-.25,-.25],legR:[.2,.2],kneeL:[.55,.55],kneeR:[.5,.5],elbowL:[-.3,-.3],elbowR:[-.3,-.3]});
 actions.idle.play();let current='idle';
 group.userData.update=(dt:number,speed:number,riding:boolean,airborne:boolean)=>{const next=riding?'ride':airborne?'air':speed>.15?(speed>4?'run':'walk'):'idle';if(next!==current){actions[next].reset().play();actions[current].crossFadeTo(actions[next],.2,false);current=next;}actions[current].timeScale=next==='walk'?Math.max(.6,speed/2):next==='run'?Math.max(.8,speed/5):1;mixer.update(dt)};
 group.userData.reset=(name:string)=>{mixer.stopAllAction();current=name;actions[name].reset().play();mixer.update(0)};
 group.userData.dispose=()=>{mixer.stopAllAction();mixer.uncacheRoot(mesh);mesh.skeleton.dispose()};return group;
}
