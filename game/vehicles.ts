import * as T from 'three';
import {branchBetween} from './organic';
import {damp} from './surfaces';
const paint=new T.MeshStandardMaterial({color:'#526e73',metalness:.38,roughness:.36});
const rubber=new T.MeshStandardMaterial({color:'#222725',roughness:.91});
const chrome=new T.MeshStandardMaterial({color:'#b0b6b3',metalness:.78,roughness:.3});
const dark=new T.MeshStandardMaterial({color:'#454b47',metalness:.58,roughness:.57});
const seatMaterial=new T.MeshStandardMaterial({color:'#33362f',roughness:.92});
const glass=new T.MeshStandardMaterial({color:'#d8dfcc',metalness:.1,roughness:.2});
function mesh(g:T.Object3D,geometry:T.BufferGeometry,material:T.Material){const m=new T.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function tube(g:T.Object3D,a:number[],b:number[],radius=.018,material:T.Material=chrome){return mesh(g,branchBetween(new T.Vector3(...a),new T.Vector3(...b),radius,radius),material);}
function panel(g:T.Object3D,outline:number[][],width:number,material:T.Material){
 const s=new T.Shape();const first=outline[0],last=outline[outline.length-1];s.moveTo((first[0]+last[0])/2,(first[1]+last[1])/2);
 outline.forEach((p,i)=>{const next=outline[(i+1)%outline.length];s.quadraticCurveTo(p[0],p[1],(p[0]+next[0])/2,(p[1]+next[1])/2);});
 const geo=new T.ExtrudeGeometry(s,{depth:width,bevelEnabled:true,bevelSize:.016,bevelThickness:.012,bevelSegments:2,steps:1,curveSegments:5});geo.rotateY(-Math.PI/2);geo.translate(width/2,0,0);return mesh(g,geo,material);
}
function wheel(g:T.Object3D,z:number){const group=new T.Group();group.position.set(0,.325,z);g.add(group);
 const tire=mesh(group,new T.TorusGeometry(.266,.058,10,32),rubber);tire.rotation.y=Math.PI/2;
 for(const x of [-.028,.028]){const rim=mesh(group,new T.TorusGeometry(.235,.014,6,32),chrome);rim.rotation.y=Math.PI/2;rim.position.x=x;}
 const hub=mesh(group,new T.CylinderGeometry(.044,.044,.13,12),dark);hub.rotation.z=Math.PI/2;
 for(let i=0;i<20;i++){const a=i*Math.PI/10;tube(group,[i%2?.035:-.035,0,0],[0,Math.sin(a)*.236,Math.cos(a)*.236],.0035);}
 return group;
}
/** Original underbone motorcycle, in metres. Forward +Z, wheel rotation about X. */
export function motorbike(){const g=new T.Group();g.name='underbone-motorbike';
 const rear=wheel(g,-.65),frontAssembly=new T.Group();frontAssembly.position.z=.7;g.add(frontAssembly);const front=wheel(frontAssembly,0);
 panel(g,[[-.77,.68],[-.6,.82],[.04,.8],[.29,.59],[.06,.47],[-.37,.48]],.31,paint);
 panel(g,[[-.71,.82],[-.68,.91],[-.15,.93],[.1,.87],[.06,.81]],.33,seatMaterial);
 panel(g,[[.01,.48],[.2,.85],[.46,1.08],[.53,.99],[.35,.6],[.22,.45]],.25,paint);
 panel(g,[[-.45,.48],[-.33,.63],[-.05,.6],[.12,.47],[-.03,.34],[-.32,.35]],.29,dark);
 for(let i=0;i<6;i++)tube(g,[-.155,.39+i*.032,-.18],[.155,.39+i*.032,-.18],.01,dark);
 for(const side of [-1,1]){
  tube(g,[side*.17,.35,-.65],[side*.15,.74,-.34],.023,dark);
  const spring=mesh(g,new T.TorusGeometry(.028,.007,5,10),chrome);spring.position.set(side*.18,.55,-.51);spring.rotation.x=.5;
  tube(frontAssembly,[side*.1,.33,0],[side*.1,.98,-.15],.025);
  tube(frontAssembly,[side*.1,.32,0],[side*.1,.61,-.075],.037,dark);
  tube(g,[0,.38,.17],[side*.26,.38,.17],.02,dark);
  tube(frontAssembly,[0,1.1,-.16],[side*.28,1.1,-.22],.018);
  tube(frontAssembly,[side*.25,1.1,-.22],[side*.36,1.1,-.24],.026,rubber);
  tube(frontAssembly,[side*.27,1.1,-.19],[side*.33,1.32,-.15],.008);
  const mirror=mesh(frontAssembly,new T.SphereGeometry(1,12,8),chrome);mirror.scale.set(.075,.045,.013);mirror.position.set(side*.34,1.34,-.16);
 }
 panel(frontAssembly,[[-.34,.57],[-.23,.71],[.06,.75],[.33,.59],[.25,.58],[.02,.65],[-.2,.62]],.15,paint);
 panel(frontAssembly,[[-.2,1],[-.2,1.18],[-.02,1.19],[.07,1.11],[.01,1]],.27,paint);
 const lamp=mesh(frontAssembly,new T.SphereGeometry(1,16,10),glass);lamp.scale.set(.104,.067,.025);lamp.position.set(0,1.095,.043);
 tube(g,[.2,.38,.2],[.23,.3,-.1],.023,dark);tube(g,[.23,.3,-.1],[.23,.38,-.8],.051,chrome);
 const tail=mesh(g,new T.BoxGeometry(.18,.068,.025),new T.MeshStandardMaterial({color:'#aa392d',emissive:'#49160c',emissiveIntensity:.25}));tail.position.set(0,.76,-.75);
 const plate=mesh(g,new T.BoxGeometry(.14,.14,.016),new T.MeshStandardMaterial({color:'#e0dfd1',roughness:.8}));plate.position.set(0,.59,-.8);plate.rotation.x=-.13;
 tube(g,[-.17,.96,-.57],[.17,.96,-.57],.012);for(const x of [-.17,.17])tube(g,[x,.96,-.57],[x,.84,-.7],.012);
 let steering=0,lean=0;g.userData.wheels=[front,rear];g.userData.steering=frontAssembly;
 g.userData.update=(dt:number,speed:number,turn:number)=>{steering=damp(steering,turn*.32,10,dt);lean=damp(lean,-turn*.17*Math.min(Math.abs(speed)/7,1),7,dt);frontAssembly.rotation.y=steering;front.rotation.x+=speed*dt/.325;rear.rotation.x+=speed*dt/.325;g.rotation.z=lean;};
 g.userData.reset=()=>{steering=0;lean=0;frontAssembly.rotation.y=0;front.rotation.x=0;rear.rotation.x=0;g.rotation.z=0;};return g;
}

export function villageCar(){const g=new T.Group();g.name='village-hatchback';const bodyPaint=new T.MeshStandardMaterial({color:'#c8cec7',roughness:.39,metalness:.35}),windowMaterial=new T.MeshStandardMaterial({color:'#334f59',roughness:.23,metalness:.18});
 panel(g,[[-1.83,.49],[-1.85,.88],[-1.4,1.03],[-.82,1.08],[.81,1.06],[1.65,.9],[1.84,.72],[1.76,.47]],1.65,bodyPaint);
 panel(g,[[-1.15,.98],[-.85,1.55],[.25,1.59],[.85,1.03]],1.37,bodyPaint);
 panel(g,[[-1.06,1.04],[-.78,1.49],[.25,1.51],[.74,1.04]],1.405,windowMaterial);
 // Roof and pillars sit outside the glazing; cabin silhouette slopes into bonnet and hatch.
 panel(g,[[-.86,1.51],[-.81,1.59],[.25,1.62],[.32,1.52]],1.43,bodyPaint);
 for(const side of [-1,1]){
  tube(g,[side*.716,1.01,-1.1],[side*.716,1.53,-.8],.037,bodyPaint);tube(g,[side*.716,1.01,.79],[side*.716,1.54,.28],.038,bodyPaint);tube(g,[side*.718,1.02,-.25],[side*.718,1.54,-.25],.028,bodyPaint);
  for(const z of [-.73,.33])tube(g,[side*.855,.99,z-.09],[side*.855,.99,z+.09],.012,chrome);
  const mirror=mesh(g,new T.SphereGeometry(1,12,8),bodyPaint);mirror.scale.set(.14,.07,.11);mirror.position.set(side*.87,1.19,.57);
  for(const z of [-1.14,1.17]){const wheelGroup=new T.Group();wheelGroup.position.set(side*.78,.36,z);g.add(wheelGroup);const tire=mesh(wheelGroup,new T.TorusGeometry(.274,.088,10,28),rubber);tire.rotation.y=Math.PI/2;tire.scale.z=1.45;const rim=mesh(wheelGroup,new T.CylinderGeometry(.205,.205,.17,16),chrome);rim.rotation.z=Math.PI/2;for(let i=0;i<5;i++){const a=i*Math.PI*2/5;tube(wheelGroup,[side*.095,0,0],[side*.095,Math.sin(a)*.19,Math.cos(a)*.19],.022,dark);}if(!g.userData.wheels)g.userData.wheels=[];g.userData.wheels.push(wheelGroup);}
  const lamp=mesh(g,new T.SphereGeometry(1,12,8),glass);lamp.scale.set(.23,.085,.055);lamp.position.set(side*.52,.83,1.76);const rearLamp=mesh(g,new T.BoxGeometry(.23,.14,.03),new T.MeshStandardMaterial({color:'#a34232',roughness:.4}));rearLamp.position.set(side*.62,.88,-1.8);
 }
 panel(g,[[1.77,.51],[1.82,.58],[1.81,.7],[1.76,.72]],1.15,dark);panel(g,[[-1.85,.5],[-1.87,.64],[-1.79,.65]],1.4,dark);
 const plate=mesh(g,new T.BoxGeometry(.33,.115,.015),glass);plate.position.set(0,.69,1.82);
 let steering=0;g.userData.update=(dt:number,speed:number,turn:number)=>{steering=damp(steering,turn*.32,9,dt);for(let i=0;i<g.userData.wheels.length;i++){const w=g.userData.wheels[i];w.rotation.x+=speed*dt/.36;if(i%2===1)w.rotation.y=steering;}};
 g.userData.reset=()=>{steering=0;for(const w of g.userData.wheels)w.rotation.set(0,0,0);};return g;
}
