import * as T from 'three';
import {surface,seeded} from './surfaces';
import {vegetation} from './vegetation';
import {traveller} from './avatar';
import {motorbike,villageCar} from './vehicles';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const materials=new Map<string,T.MeshStandardMaterial>();
export const mat=(color:string,roughness=.85)=>{const key=color+roughness;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness}));return materials.get(key)!};
export function box(g:T.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,c:string){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
export function cyl(g:T.Object3D,rt:number,rb:number,h:number,x:number,y:number,z:number,c:string,n=10){const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,n),mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
export function ball(g:T.Object3D,r:number,x:number,y:number,z:number,c:string){const m=new T.Mesh(new T.SphereGeometry(r,12,8),mat(c));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;}
export function label(text:string,w=512,h=96,bg='#154d49',fg='#f4edd8'){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${Math.floor(h*.48)}px Arial`;ctx.fillText(text,w/2,h/2,w-24);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return new T.MeshBasicMaterial({map:tx,side:T.DoubleSide});}
export function sign(g:T.Object3D,text:string,w:number,h:number,x:number,y:number,z:number,bg?:string){const m=new T.Mesh(new T.PlaneGeometry(w,h),label(text,1024,Math.max(80,Math.floor(1024*h/w)),bg));m.position.set(x,y,z);g.add(m);return m;}
export function person(shirt='#7b8884',hat=false){return traveller({shirt,hat,variant:hat?1:2});}
export function animatePerson(g:T.Group,time:number,speed:number,seated=false){g.userData.update?.(1/60,speed,seated,false);}
export function bike(){return motorbike();}
export function car(){return villageCar();}
export function roof(g:T.Object3D,w:number,d:number,y:number,kind='tile'){
 if(kind==='flat'){box(g,w,.16,d,0,y+.07,0,'#9b9f95');for(const side of [-1,1]){box(g,.14,.45,d,side*(w/2-.07),y+.28,0,'#c1bfb0');box(g,w,.45,.14,0,y+.28,side*(d/2-.07),'#c1bfb0');}return;}
 if(kind==='metal'){const cover=box(g,w,.07,d,0,y+.18,0,'#949d97');cover.rotation.z=.08;for(let x=-w/2;x<w/2;x+=.23)box(g,.028,.035,d,x,y+.24+x*.08,0,'#717f79');return;}
 const verts=new Float32Array([-w/2,y,-d/2,w/2,y,-d/2,w/2,y,d/2,-w/2,y,d/2,0,y+1.3,-d/2,0,y+1.3,d/2]);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(verts,3));geo.setIndex([0,4,5,0,5,3,4,1,2,4,2,5,0,1,4,3,5,2]);geo.computeVertexNormals();const material=surface('tile','#b16b4e');material.side=T.DoubleSide;const m=new T.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;g.add(m);
 box(g,.18,.16,d+.2,0,y+1.34,0,'#b16b4e');for(const x of [-w/2,w/2])box(g,.12,.12,d,x,y,0,'#6c5140');
}
export function gate(){const g=new T.Group();for(const s of [-1,1]){box(g,1.04,5.7,1.02,s*4.4,2.85,0,'#e9dfc4');box(g,1.13,.8,1.11,s*4.4,.4,0,'#83847c');box(g,.75,4.4,.06,s*4.4,3.05,-.55,'#c47f67');box(g,.58,4.22,.07,s*4.4,3.05,-.59,'#f1e8d0');for(let y=1.5;y<5;y+=.7){const ring=new T.Mesh(new T.TorusGeometry(.17,.025,6,10),mat('#963d39'));ring.position.set(s*4.4,y,-.65);g.add(ring);}box(g,.5,3.4,.5,s*7,1.7,0,'#e9dfc4');box(g,3.3,.2,1.9,s*5.8,3.55,0,'#b55d40');}box(g,10.4,1.25,1.0,0,5.72,0,'#e7dfc6');sign(g,'TỔ DÂN PHỐ 1&2 ĐÔNG HẢI',8.25,.85,0,5.71,-.53).rotation.y=Math.PI;box(g,11.1,.23,2.15,0,6.4,0,'#a85437');box(g,7.9,.48,.8,0,6.75,0,'#e3dac1');box(g,8.8,.2,1.9,0,7.08,0,'#ac583c');for(let x=-5.5;x<5.5;x+=.28){box(g,.1,.055,2.17,x,6.55,0,'#c77250');}g.rotation.y=Math.PI/2;return g;}
export function house(w:number,d:number,h:number,color:string,shop=false,variant=0){
 const g=new T.Group();box(g,w,h,d,0,h/2,0,color).material=surface('plaster',color);box(g,w+.3,.25,d+.3,0,.1,0,'#969389').material=surface('stone','#969389');roof(g,w+1,d+.6,h,variant%5===1?'metal':variant%5===3?'flat':'tile');g.userData.variant=variant%20;
 const floors=h>5?2:1,level=h/floors;
 for(let f=0;f<floors;f++){const base=f*level;
  box(g,w+.15,.12,d+.15,0,base+level-.18,0,'#e0d8bf');
  for(const x of [-w*.31,w*.31]){box(g,w*.19,1.35,.14,x,base+1.9,d/2+.08,'#314c4e');box(g,w*.23,.12,.32,x,base+1.17,d/2+.1,'#d0c9ac');for(const side of [-1,1]){const shutter=box(g,w*.1,1.45,.08,x+side*w*.14,base+1.9,d/2+.13,'#59766b');shutter.rotation.y=side*.22;for(let y=base+1.3;y<base+2.6;y+=.16)box(g,w*.095,.025,.1,x+side*w*.14,y,d/2+.2,'#8a9b81');}}
  // Side windows keep oblique street views from exposing blank boxes.
  for(const side of [-1,1])for(const z of [-d*.23,d*.23])box(g,.12,1.3,1.1,side*(w/2+.04),base+1.9,z,'#52706e');
 }
 box(g,1.35,2.4,.13,0,1.2,d/2+.09,'#465c50');for(const x of [-.68,0,.68])box(g,.055,2.45,.16,x,1.22,d/2+.15,'#a8af92');box(g,.05,.12,.07,.45,1.1,d/2+.22,'#c1aa66');
 box(g,2.1,.15,.6,0,.075,d/2+.4,'#afab9c');box(g,2.5,.1,.5,0,.01,d/2+.85,'#9b998c');
 if(floors===2&&variant%3!==1){box(g,w*.65,.16,1.15,0,level+.04,d/2+.4,'#c5c0aa');box(g,w*.65,.055,.06,0,level+1,d/2+.98,'#69766b');for(let x=-w*.31;x<=w*.31;x+=.27)box(g,.035,.9,.035,x,level+.55,d/2+.98,'#69766b');}
 const awning=box(g,w*.76,.12,1.8,0,2.8,d/2+.75,shop?'#8e6450':['#9aa59b','#698779','#b7a38a','#738f99'][variant%4]);awning.rotation.x=.12;
 for(const x of [-w*.35,w*.35])cyl(g,.035,.035,2.65,x,1.33,d/2+1.4,'#6d7167');
 if(shop){sign(g,'TẠP HÓA ĐÔNG HẢI',w*.92,.85,0,h*.92,d/2+.12);for(let i=0;i<7;i++)box(g,.38,.45,.4,-w*.35+i*.6,.55,d/2+.6,['#c4b445','#c26342','#689577'][i%3]);}return g;
}
export function tree(palm=false,variant=0){return vegetation(palm?'palm':'shade',variant);}
export function boat(){const g=new T.Group();const hull=new T.Mesh(new T.SphereGeometry(1,12,6),mat('#3b7f91'));hull.scale.set(2,.65,5);hull.position.y=.1;g.add(hull);box(g,2.7,.15,5.8,0,.53,0,'#a66943');box(g,1.5,1.4,1.6,0,1.23,-.8,'#f0dbb8');box(g,1.7,.12,1.8,0,2,-.8,'#ae5840');cyl(g,.035,.06,5.5,0,3.1,1.4,'#715e45');return g;}

export function batchStatic(g:T.Group){
 g.updateMatrixWorld(true);const inverse=g.matrixWorld.clone().invert();const batches=new Map<T.Material,T.BufferGeometry[]>();const remove:T.Mesh[]=[];
 g.traverse(o=>{let parent=o.parent;while(parent&&parent!==g){if(parent instanceof T.LOD)return;parent=parent.parent;}if(o instanceof T.Mesh&&!(o instanceof T.SkinnedMesh)&&!(o instanceof T.InstancedMesh)&&!Array.isArray(o.material)){const source=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();const geo=source.applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(!geo.getAttribute('uv'))geo.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count*2),2));if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material)!.push(geo);remove.push(o)}});
 for(const mesh of remove){mesh.removeFromParent();mesh.geometry.dispose()}
 for(const [material,geos] of batches){const combined=mergeGeometries(geos);if(combined){const m=new T.Mesh(combined,material);m.castShadow=true;m.receiveShadow=true;g.add(m)}geos.forEach(x=>x.dispose())}return g;
}
