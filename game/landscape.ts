import * as T from 'three';
import {Sky} from 'three/addons/objects/Sky.js';
import {surface,seeded} from './surfaces';
import {box,cyl,tree} from './models';
import {grassClump,vegetation} from './vegetation';
import {nearestRoad,distance,type Road} from './navigation';
export function atmosphere(scene:T.Scene){const sky=new Sky();sky.scale.setScalar(4500);const u=sky.material.uniforms;u.turbidity.value=3.4;u.rayleigh.value=1.5;u.mieCoefficient.value=.004;u.mieDirectionalG.value=.82;u.sunPosition.value.set(-.6,.62,.65);scene.add(sky);return sky;}
export function hills(scene:T.Scene){
 const g=new T.PlaneGeometry(2400,850,120,44);g.rotateX(-Math.PI/2);const a=g.attributes.position;
 for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i);const edge=Math.max(0,(z+425)/850);const h=(48+Math.sin(x*.009)*26+Math.cos(x*.019+z*.013)*18+Math.sin(x*.034-z*.027)*7)*Math.sin(edge*Math.PI)+90*Math.exp(-(((x+450)/420)**2))*Math.sin(edge*Math.PI);a.setY(i,Math.max(-3,h));}
 g.computeVertexNormals();const m=new T.Mesh(g,surface('earth','#727b4e'));m.position.set(630,-5,680);m.receiveShadow=true;scene.add(m);
}
// Decorative shoulder plants only, with explicit clearance from the unchanged OSM road graph.
export function roadsidePlanting(scene:T.Scene,roads:Road[]){
 const rand=seeded(6301),positions:T.Vector3[]=[];
 for(const road of roads)for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],length=distance(a,b);if(length<2)continue;
  const nx=-(b.z-a.z)/length,nz=(b.x-a.x)/length;
  for(let d=4;d<length;d+=7){const t=d/length,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;if(x< -120||x>1480||z< -550||z>180)continue;
   for(const side of [-1,1]){const q={x:x+nx*side*(road.width/2+2+rand()*3),z:z+nz*side*(road.width/2+2+rand()*3)};if(distance(q,nearestRoad(q,roads))<road.width/2+1)continue;positions.push(new T.Vector3(q.x,0,q.z));}
  }
 }
 // Group instanced grasses spatially so distant patches are culled together.
 const cells=new Map<string,T.Vector3[]>();for(const p of positions){const key=Math.floor(p.x/80)+':'+Math.floor(p.z/80);if(!cells.has(key))cells.set(key,[]);cells.get(key)!.push(p)}
 const blade=grassClump(),material=new T.MeshStandardMaterial({color:'#697451',roughness:1,side:T.DoubleSide});
 for(const ps of cells.values()){const mesh=new T.InstancedMesh(blade,material,ps.length*6);const dummy=new T.Object3D();let i=0;for(const p of ps)for(let j=0;j<6;j++){dummy.position.set(p.x+(rand()-.5)*2,-.025,p.z+(rand()-.5)*2);dummy.scale.setScalar(.65+rand()*.7);dummy.rotation.set(0,rand()*6,0);dummy.updateMatrix();mesh.setMatrixAt(i++,dummy.matrix)}mesh.computeBoundingSphere();scene.add(mesh);}
 // Existing gate corridor stays open: ponds on the left, vegetation on the hillside side.
 for(let x=18;x<420;x+=23){const q=nearestRoad({x,z:0},roads),p={x:q.x,z:q.z+13};if(distance(p,nearestRoad(p,roads))<8)continue;const tr=vegetation(x%3===0?'fruit':'shade',Math.floor(x/23)%4);tr.position.set(p.x,0,p.z);tr.scale.setScalar(.85+rand()*.55);scene.add(tr);}
}
export function garden(g:T.Group,w:number,d:number,seed:number){
 const rand=seeded(seed);const paving=box(g,w+.8,.07,2.7,0,.015,d/2+1.1,'#b0a48f');paving.material=surface('stone','#b0a48f');
 for(const side of [-1,1]){const pot=cyl(g,.24,.16,.45,side*(w/2-.4),.25,d/2+1.8,'#aa6d48',12);pot.receiveShadow=true;const plant=vegetation(seed%2?'fruit':'banana',seed%4);plant.scale.setScalar(seed%2?.22:.37);plant.position.set(side*(w/2-.4),.4,d/2+1.8);g.add(plant);}
 if(seed%3===0){const trellis=new T.Group();for(const x of [-w/2,w/2])box(trellis,.08,3.3,.08,x,1.65,d/2+.75,'#645b48');box(trellis,w+.3,.1,.1,0,3.3,d/2+.75,'#645b48');const petals=new T.InstancedMesh(new T.IcosahedronGeometry(.16,0),new T.MeshStandardMaterial({color:'#b74e79',roughness:1}),65);const o=new T.Object3D();for(let i=0;i<65;i++){o.position.set((rand()-.5)*(w+.2),3.05+rand()*.65,d/2+.75+(rand()-.5)*.7);o.scale.setScalar(.7+rand());o.updateMatrix();petals.setMatrixAt(i,o.matrix)}trellis.add(petals);g.add(trellis);}
}
