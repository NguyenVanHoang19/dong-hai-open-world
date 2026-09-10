import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import ts from 'typescript';
import * as T from 'three';
const dir=mkdtempSync(new URL('./.scene-test-',import.meta.url).pathname);
for(const file of ['surfaces','models','landscape','avatar','navigation','content','engine','roads','visual-qa','organic','vegetation','vehicles','architecture','animals']){
 const source=readFileSync(new URL('../game/'+file+'.ts',import.meta.url),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '(\.\/[^']+)'/g,"from '$1.mjs'");writeFileSync(join(dir,file+'.mjs'),js);
}
process.on('exit',()=>rmSync(dir,{recursive:true,force:true}));
const {traveller}=await import(join(dir,'avatar.mjs'));
const {house,tree,batchStatic}=await import(join(dir,'models.mjs'));
const {hills,roadsidePlanting,garden}=await import(join(dir,'landscape.mjs'));
const {damp,turn}=await import(join(dir,'surfaces.mjs'));
test('locomotion converges smoothly and consistently at 30/60/120 Hz',()=>{const results=[];for(const fps of [30,60,120]){let speed=0;for(let i=0;i<fps;i++)speed=damp(speed,6,10,1/fps);results.push(speed);assert.ok(speed>5.99&&speed<=6);for(let i=0;i<fps/2;i++)speed=damp(speed,0,16,1/fps);assert.ok(speed<.003)}assert.ok(Math.max(...results)-Math.min(...results)<1e-10)});
test('turning crosses the -PI/PI seam via the short arc',()=>{const value=turn(Math.PI-.01,-Math.PI+.01,12,1/60);assert.ok(value>Math.PI-.01&&value<Math.PI+.01)});
test('skinned player has bones and all animated transforms stay finite',()=>{const g=traveller(),mesh=g.children[0];assert.ok(mesh.isSkinnedMesh);assert.equal(mesh.skeleton.bones.length,12);for(const [speed,ride,air] of [[0,false,false],[2,false,false],[6,false,false],[0,true,false],[3,false,true]]){for(let i=0;i<120;i++)g.userData.update(1/60,speed,ride,air);g.updateMatrixWorld(true);for(const bone of mesh.skeleton.bones)assert.ok(bone.matrixWorld.elements.every(Number.isFinite))}assert.ok(mesh.geometry.attributes.position.count<30000);g.userData.dispose()});
test('detailed house preserves finite geometry and batches draw calls',()=>{const g=house(7,7,6.6,'#cfc6b0');garden(g,7,7,1);let before=0;g.traverse(o=>{if(o.isMesh)before++});batchStatic(g);let after=0;g.traverse(o=>{if(o.isMesh){after++;assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite))}});assert.ok(after<before/3,`${before} -> ${after}`)});
test('tree has three decreasing LOD levels and finite distant hills',()=>{const tr=tree();assert.ok(tr.isLOD);assert.equal(tr.levels.length,3);const counts=tr.levels.map(l=>l.object.children.find(o=>o.isInstancedMesh).count);assert.ok(counts[0]>counts[1]&&counts[1]>counts[2]);const s=new T.Scene();hills(s);const geo=s.children[0].geometry;assert.ok(Array.from(geo.attributes.normal.array).every(Number.isFinite))});
test('OSM planting highest-detail active instances stay within budget',()=>{const s=new T.Scene(),roads=JSON.parse(readFileSync(new URL('../public/data/roads.json',import.meta.url)));roadsidePlanting(s,roads);const count=o=>o.isLOD?count(o.levels[0].object):(o.isInstancedMesh?o.count:0)+o.children.reduce((sum,c)=>sum+count(c),0);const blades=count(s);assert.ok(blades>0&&blades<30000,`instances=${blades}`)});

test('full village build keeps houses bounded and creates matching colliders',async()=>{const R=(await import('@dimforge/rapier3d-compat')).default;await R.init();const {Game}=await import(join(dir,'engine.mjs'));const g=Object.create(Game.prototype);g.scene=new T.Scene();g.roads=JSON.parse(readFileSync(new URL('../public/data/roads.json',import.meta.url)));g.chunks=[];g.solids=[];g.world=new R.World({x:0,y:-18,z:0});try{g.createBuildings();assert.ok(g.chunks.length>20&&g.chunks.length<=105,`houses=${g.chunks.length}`);for(const c of g.chunks){assert.ok(c.colliders.length>=7);assert.ok(c.center.x>=680&&c.center.x<=1450)}console.log('Village fixture:',g.chunks.length,'houses with colliders');}finally{g.world.free()}});

test('crowned road has upward normals, joined stations and finite geometry',async()=>{const {roadGeometry}=await import(join(dir,'roads.mjs'));const road={id:'curve',width:5,points:[{x:0,z:0},{x:10,z:1},{x:19,z:5}]};const geo=roadGeometry(road);assert.equal(geo.attributes.position.count,15);for(let i=0;i<geo.attributes.normal.count;i++)assert.ok(geo.attributes.normal.getY(i)>.9);assert.ok(geo.attributes.position.getY(2)>geo.attributes.position.getY(0));assert.ok(Array.from(geo.attributes.position.array).every(Number.isFinite))});
test('road strips preserve provided OSM points at center and support duplicate nodes',async()=>{const {roadGeometry}=await import(join(dir,'roads.mjs'));const g=roadGeometry({id:'r',width:4,points:[{x:0,z:0},{x:0,z:0},{x:10,z:3}]});assert.equal(g.attributes.position.count,10);assert.equal(g.attributes.position.getX(7),10);assert.equal(g.attributes.position.getZ(7),3)});
test('five review camera definitions are deterministic and include vehicle view',async()=>{const {visualShots}=await import(join(dir,'visual-qa.mjs'));const roads=JSON.parse(readFileSync(new URL('../public/data/roads.json',import.meta.url)));const a=visualShots(roads),b=visualShots(roads);assert.deepEqual(a,b);assert.equal(a.length,5);assert.equal(a[4].bike,true)});

test('road physics supports a capsule crossing the road crown',async()=>{
 const R=(await import('@dimforge/rapier3d-compat')).default;await R.init();
 const {createRoadMeshes}=await import(join(dir,'roads.mjs'));
 const built=createRoadMeshes([{id:'test-road',width:5,points:[{x:-20,z:0},{x:20,z:0}]}]);
 const world=new R.World({x:0,y:-18,z:0});
 try{
  world.createCollider(R.ColliderDesc.cuboid(25,.3,15).setTranslation(0,-.35,0));
  for(const mesh of built.collision)world.createCollider(R.ColliderDesc.trimesh(mesh.vertices,mesh.indices));
  const body=world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(0,1,-4));
  const collider=world.createCollider(R.ColliderDesc.capsule(.52,.26),body);
  const controller=world.createCharacterController(.025);controller.enableSnapToGround(.3);controller.enableAutostep(.35,.3,true);
  world.step();let maximumHeight=0;
  for(let i=0;i<160;i++){
   controller.computeColliderMovement(collider,{x:0,y:-.1,z:.05});
   const p=body.translation(),d=controller.computedMovement();
   body.setNextKinematicTranslation({x:p.x+d.x,y:p.y+d.y,z:p.z+d.z});world.step();
   assert.ok(body.translation().y>.7,'capsule must remain above the road and ground');
   if(Math.abs(body.translation().z)<.25)maximumHeight=Math.max(maximumHeight,body.translation().y);
  }
  console.log('Road crossing endpoint',body.translation(),'crown height',maximumHeight);assert.ok(body.translation().z>3.8,'capsule crosses both shoulders without a snag');
  assert.ok(maximumHeight>.85,'road collider raises capsule over the crown');
 }finally{world.free()}
});

test('review shot switching resets pending physics targets and bike lean',async()=>{
 const R=(await import('@dimforge/rapier3d-compat')).default;await R.init();
 const {Game}=await import(join(dir,'engine.mjs'));
 const g=Object.create(Game.prototype);Object.assign(g,{ready:true,qaMode:true,roads:JSON.parse(readFileSync(new URL('../public/data/roads.json',import.meta.url))),world:new R.World({x:0,y:-18,z:0}),keys:new Set(['w']),velocity:new T.Vector2(5,5),visualCurrent:new T.Vector3(),visualPrevious:new T.Vector3(),player:traveller(),bay:new T.Group(),chunks:[],changeQuality(){},changeTime(){},emit(){}});
 try{
  g.body=g.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased());g.collider=g.world.createCollider(R.ColliderDesc.capsule(.52,.26),g.body);
  g.vehicles=['bike','car'].map(type=>({type,mesh:new T.Group(),body:g.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased()),previous:new T.Vector3(),angle:0,previousAngle:0,speed:9}));
  g.selectVisualShot(4);const first=g.body.translation();
  g.vehicles[0].mesh.rotation.z=.3;g.body.setNextKinematicTranslation({x:500,y:10,z:100});
  g.selectVisualShot(0);assert.equal(g.driving,null);assert.equal(g.collider.isEnabled(),true);
  g.selectVisualShot(4);const again=g.body.translation();assert.deepEqual(again,first);assert.equal(g.vehicles[0].mesh.rotation.z,0);assert.equal(g.keys.size,0);assert.equal(g.previousAngle,g.angle);assert.equal(g.collider.isEnabled(),false);
 }finally{g.player.userData.dispose();g.world.free()}
});

test('batching mixed indexed/extruded meshes preserves all triangles and LOD',()=>{
 const group=new T.Group(),m=new T.MeshStandardMaterial(),shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(1,0);shape.lineTo(.5,1);shape.closePath();
 group.add(new T.Mesh(new T.BoxGeometry(1,1,1),m),new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.2,bevelEnabled:false}),m));
 const triangles=g=>{let n=0;g.traverse(o=>{if(o.isMesh)n+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3});return n};
 const expected=triangles(group);batchStatic(group);assert.equal(triangles(group),expected);
 const tr=tree();group.add(tr);batchStatic(group);assert.equal(tr.levels.length,3);for(const l of tr.levels)assert.ok(l.object.children.some(o=>o.isMesh&&!o.isInstancedMesh));
});
test('vehicle wheel rotation, steering damping and resets work for both models',async()=>{
 const {motorbike,villageCar}=await import(join(dir,'vehicles.mjs'));
 for(const make of [motorbike,villageCar]){const g=make();g.userData.update(1/60,5,1);const wheels=g.userData.wheels;assert.ok(wheels.every(w=>w.rotation.x>0));for(let i=0;i<60;i++)g.userData.update(1/60,5,1);const turn=g.userData.steering?.rotation.y??wheels[1].rotation.y;assert.ok(turn>.2&&turn<=.321);g.userData.reset();assert.ok(wheels.every(w=>w.rotation.x===0));assert.equal(g.rotation.z,0);}
});
test('twenty residential arrangements keep driveway open and bound colliders',async()=>{
 const {furnishLot}=await import(join(dir,'architecture.mjs'));
 for(let v=0;v<20;v++){const g=house(7,7,v%4?3.9:6.6,'#c5c0b1',false,v),colliders=furnishLot(g,7,7,3.9,v);assert.equal(g.userData.variant,v);assert.ok(colliders.length>=6);for(const c of colliders){assert.ok([c.x,c.y,c.z,c.w,c.h,c.d].every(Number.isFinite));const blocksDrive=Math.abs(c.x)<1&&c.z>4;assert.equal(blocksDrive,false,'central driveway must remain open');}}
});
test('dog and chicken motion is finite, bounded and continuous in the yard',async()=>{
 const {animal,updateAnimals}=await import(join(dir,'animals.mjs'));
 for(const kind of ['dog','chicken']){const mesh=animal(kind),entries=[{mesh,origin:{x:0,z:0},phase:0,kind}];let prev=mesh.position.clone();for(let i=0;i<1000;i++){updateAnimals(entries,{x:0,z:0},i/60);assert.ok(mesh.position.distanceTo(prev)<.01);assert.ok(Math.abs(mesh.position.x)<=.45);mesh.updateMatrixWorld(true);mesh.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));prev.copy(mesh.position);}updateAnimals(entries,{x:200,z:0},0);assert.equal(mesh.visible,false);}
});
