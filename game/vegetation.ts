import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {seeded} from './surfaces';
import {leafGeometry,branchBetween,loft} from './organic';
const bark=new T.MeshStandardMaterial({color:'#6e6656',roughness:1});
const leaves=new T.MeshStandardMaterial({color:'#ffffff',roughness:.88,side:T.DoubleSide});
export type TreeKind='shade'|'fruit'|'palm'|'banana';
const templates=new Map<string,T.Group>();
function build(kind:TreeKind,seed:number,detail:number){
 const g=new T.Group(),random=seeded(seed),trunkParts:T.BufferGeometry[]=[],points:{position:T.Vector3;yaw:number;size:number;tilt:number}[]=[];
 const palm=kind==='palm',banana=kind==='banana',height=banana?2.5:palm?6:kind==='fruit'?3.6:5.8;
 trunkParts.push(loft([[0,.23,.2],[height*.35,.17,.16,.06,0],[height*.7,.12,.11,.21,.08],[height,.075,.07,.38,.12]],10));
 if(palm||banana){
  const arms=banana?8:11;
  for(let arm=0;arm<arms;arm++){const yaw=arm*Math.PI*2/arms+seed*.7,len=banana?2:3.5;
   if(banana){points.push({position:new T.Vector3(.3,height+random()*.3,.1),yaw,size:1.4,tilt:-.35+random()*.8});continue;}
   const start=new T.Vector3(.38,height,.12);
   for(let j=1;j<=8;j++){const t=j/8;const end=new T.Vector3(Math.sin(yaw)*len*t,height+Math.sin(t*Math.PI)*.65-t*.95,Math.cos(yaw)*len*t);const prev=j===1?start:new T.Vector3(Math.sin(yaw)*len*(t-.125),height+Math.sin((t-.125)*Math.PI)*.65-(t-.125)*.95,Math.cos(yaw)*len*(t-.125));trunkParts.push(branchBetween(prev,end,.018*(1-t)+.005,.012));for(const side of [-1,1])points.push({position:end.clone(),yaw:yaw+side*1.05,size:.9-t*.5,tilt:.35+t*.4});}
  }
 }else{
  for(let limb=0;limb<7;limb++){
   const yaw=limb*Math.PI*2/7+random()*.5,reach=(kind==='fruit'?1.3:2.1)+random()*.65;
   const centre=new T.Vector3(Math.sin(yaw)*reach,height-.3+random()*1.1,Math.cos(yaw)*reach);
   trunkParts.push(branchBetween(new T.Vector3(.15,height*.55,0),centre,.08,.017));
   const clusters=detail===0?7:detail===1?4:2;
   for(let c=0;c<clusters;c++){const at=centre.clone().add(new T.Vector3((random()-.5)*1.4,(random()-.5)*.8,(random()-.5)*1.4));
    if(detail===0)trunkParts.push(branchBetween(centre,at,.014,.004));
    for(let l=0;l<(detail===0?16:detail===1?11:9);l++){const size=(detail===0?.32:detail===1?.48:.7)*(kind==='fruit'?.8:1);points.push({position:at.clone().add(new T.Vector3((random()-.5)*.8,(random()-.5)*.65,(random()-.5)*.8)),yaw:random()*Math.PI*2,size:size*(.7+random()*.7),tilt:(random()-.5)*1.5});}
   }
  }
 }
 const trunk=new T.Mesh(mergeGeometries(trunkParts)!,bark);trunkParts.forEach(p=>p.dispose());trunk.castShadow=detail<2;trunk.receiveShadow=true;g.add(trunk);
 const geo=banana?leafGeometry(1.5,.38,.26):palm?leafGeometry(1,.08,.05):leafGeometry(1,.34,.15);
 const canopy=new T.InstancedMesh(geo,leaves,points.length),o=new T.Object3D();
 points.forEach((p,i)=>{o.position.copy(p.position);o.rotation.set(p.tilt,p.yaw,banana?(i%2?.08:-.08):.12);o.scale.setScalar(p.size);o.updateMatrix();canopy.setMatrixAt(i,o.matrix);canopy.setColorAt(i,new T.Color().setHSL(.22+random()*.075,.3+random()*.17,.21+random()*.14));});canopy.castShadow=detail<2;canopy.receiveShadow=true;canopy.computeBoundingSphere();g.add(canopy);return g;
}
/** Shared geometry/material per species/variant; three real geometry LOD levels. */
export function vegetation(kind:TreeKind='shade',variant=0){
 const lod=new T.LOD();
 for(let detail=0;detail<3;detail++){const key=kind+':'+variant%4+':'+detail;if(!templates.has(key))templates.set(key,build(kind,318+variant%4*179,detail));lod.addLevel(templates.get(key)!.clone(true),[0,45,105][detail]);}
 lod.name='vegetation-'+kind;return lod;
}
export function grassClump(){
 const parts:T.BufferGeometry[]=[];const rand=seeded(61);
 for(let i=0;i<7;i++){const g=leafGeometry(.22+rand()*.34,.012+rand()*.012,.075);g.rotateX(-.9-rand()*.45);g.rotateY(rand()*Math.PI*2);g.translate((rand()-.5)*.22,.012,(rand()-.5)*.22);parts.push(g);}
 const combined=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());return combined;
}
