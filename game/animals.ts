import * as T from 'three';
import {loft,leafGeometry,branchBetween} from './organic';
import type {Point} from './content';
import {distance} from './navigation';
export type AnimalKind='dog'|'chicken';
const fur=new T.MeshStandardMaterial({color:'#a98c60',roughness:1});
const feathers=new T.MeshStandardMaterial({color:'#b49c76',roughness:.92});
const black=new T.MeshStandardMaterial({color:'#292d29',roughness:.76});
const red=new T.MeshStandardMaterial({color:'#a24131',roughness:.92});
const feet=new T.MeshStandardMaterial({color:'#a58a54',roughness:.9});
function add(g:T.Object3D,geo:T.BufferGeometry,m:T.Material){const mesh=new T.Mesh(geo,m);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;}
export function animal(kind:AnimalKind){const root=new T.Group(),limbs:T.Group[]=[];root.name='village-'+kind;
 if(kind==='dog'){
  const body=loft([[-.36,.075,.11],[-.27,.14,.2],[-.03,.16,.205],[.23,.16,.21],[.35,.09,.12]],16);body.rotateX(Math.PI/2);body.translate(0,.59,0);add(root,body,fur);
  add(root,loft([[.61,.1,.1,0,.3],[.79,.12,.13,0,.35],[.94,.1,.115,0,.41],[1,.055,.075,0,.41]],14),fur);
  add(root,loft([[.77,.069,.13,0,.48],[.82,.079,.16,0,.5],[.86,.065,.12,0,.47]],12),fur);
  add(root,loft([[.798,.052,.035,0,.625],[.83,.055,.035,0,.625],[.855,.037,.024,0,.62]],10),black);
  for(const side of [-1,1]){
   add(root,loft([[.92,.052,.046,side*.084,.37],[1.1,.015,.015,side*.112,.345]],10),fur);
   const eye=add(root,loft([[.902,.009,.004,side*.08,.497],[.921,.011,.005,side*.08,.494]],8),black);
   for(const z of [-.25,.25]){const leg=new T.Group();leg.position.set(side*.105,.59,z);add(leg,loft([[-.52,.034,.052,0,.045],[-.48,.035,.065,0,.045],[-.3,.027,.03,0,-.016],[-.18,.045,.047],[0,.065,.072]],12),fur);root.add(leg);limbs.push(leg);}
  }
  const tail=new T.Group();tail.position.set(0,.65,-.31);add(tail,branchBetween(new T.Vector3(),new T.Vector3(0,.28,-.3),.048,.018),fur);root.add(tail);root.userData.tail=tail;
 }else{
  add(root,loft([[.14,.052,.07],[.24,.13,.19],[.36,.14,.18],[.43,.095,.1,0,.03]],14),feathers);
  add(root,loft([[.34,.05,.064,0,.14],[.5,.039,.041,0,.14],[.59,.055,.065,0,.16],[.63,.032,.04,0,.16]],12),feathers);
  const beak=add(root,loft([[.551,.007,.006,0,.295],[.571,.021,.039,0,.246],[.584,.025,.033,0,.233]],10),feet);
  add(root,loft([[.623,.013,.035,0,.16],[.679,.007,.025,0,.155]],10),red);
  for(const side of [-1,1]){
   add(root,loft([[.583,.006,.005,side*.048,.19],[.596,.009,.006,side*.048,.19]],8),black);
   const wing=add(root,leafGeometry(.29,.11,.02),feathers);wing.position.set(side*.11,.29,.13);wing.rotation.set(Math.PI,side*.5,side*.8);
   const leg=new T.Group();leg.position.set(side*.058,.19,0);add(leg,branchBetween(new T.Vector3(),new T.Vector3(0,-.16,.01),.011,.008),feet);for(const x of [-.026,0,.026])add(leg,branchBetween(new T.Vector3(0,-.16,.01),new T.Vector3(x,-.17,.07),.006,.004),feet);root.add(leg);limbs.push(leg);
  }
  for(let i=0;i<5;i++){const tail=add(root,leafGeometry(.32,.035,.045),black);tail.position.set((i-2)*.026,.33,-.14);tail.rotation.set(-2.1,(i-2)*.18,0);}
 }
 root.userData.update=(time:number,moving:boolean)=>{for(let i=0;i<limbs.length;i++)limbs[i].rotation.x=moving?Math.sin(time*(kind==='dog'?7:10)+(i%2)*Math.PI)*.28:0;if(root.userData.tail)root.userData.tail.rotation.z=Math.sin(time*3)*.25;};
 return root;
}
export type AmbientAnimal={mesh:T.Group;origin:Point;phase:number;kind:AnimalKind};
export function updateAnimals(animals:AmbientAnimal[],player:Point,time:number){
 for(const a of animals){a.mesh.visible=distance(player,a.origin)<75;if(!a.mesh.visible)continue;const t=time*.25+a.phase,moving=Math.abs(Math.cos(t))>.15;const travel=Math.sin(t)*.45;a.mesh.position.set(a.origin.x+travel,0,a.origin.z);a.mesh.rotation.y=Math.cos(t)>0?Math.PI/2:-Math.PI/2;a.mesh.userData.update(time+a.phase,moving);}
}
