import * as T from 'three';
import {box,cyl,mat,bike} from './models';
import {vegetation} from './vegetation';
import {surface} from './surfaces';
export type LotCollider={x:number;y:number;z:number;w:number;h:number;d:number};
/** Illustrative residential modules; never a surveyed footprint or a hero landmark. */
export function furnishLot(g:T.Group,w:number,d:number,h:number,variant:number){
 const colliders:LotCollider[]=[];const v=variant%20,front=d/2+2.95,fenceColor=['#b1aaa0','#b8b7a4','#a99680','#9ca49c'][v%4];
 const wall=(x:number,y:number,z:number,width:number,height:number,depth:number)=>{box(g,width,height,depth,x,y,z,fenceColor).material=surface('plaster',fenceColor);colliders.push({x,y,z,w:width,h:height,d:depth});};
 // Low courtyard walls, open central driveway. No wall crosses the road.
 for(const side of [-1,1]){
  wall(side*(w/2+.55),.34,d/2+1.3,.14,.68,3.15);
  const length=(w+1.1-3)/2;wall(side*(1.5+length/2),.34,front,length,.68,.15);
  wall(side*1.5,.76,front,.24,1.52,.24);
  if(v%3!==1){for(let z=d/2-.1;z<front;z+=.23)box(g,.026,.45,.026,side*(w/2+.55),.9,z,'#657069');box(g,.05,.04,3.15,side*(w/2+.55),1.13,d/2+1.3,'#657069');}
 }
 // Shallow drainage grate in the courtyard, wholly above the ground collider.
 box(g,1.2,.025,.24,-w*.32,.016,front-.25,'#666c61');for(let i=0;i<8;i++)box(g,.04,.012,.24,-w*.32-.52+i*.15,.038,front-.25,'#a2a292');
 // Household objects arranged beside doors instead of scattered over the terrain.
 if(v%3===0){box(g,1.15,.08,.32,-w*.31,.47,d/2+.8,'#846951');for(const x of [-w*.31-.45,-w*.31+.45])box(g,.07,.43,.24,x,.23,d/2+.8,'#665d4d');}
 if(v%3===1){const table=cyl(g,.42,.42,.06,w*.32,.65,d/2+1.1,'#969b91',16);box(g,.06,.62,.06,table.position.x,.31,table.position.z,'#69736d');for(const z of [d/2+.5,d/2+1.65]){box(g,.29,.04,.29,w*.32,.33,z,'#65796f');for(const x of [-.1,.1])box(g,.035,.3,.035,w*.32+x,.15,z,'#65796f');}}
 if(v%4===2){for(let i=0;i<3;i++){const x=w*.31+i*.23;box(g,.22,.3+i*.035,.32,x,.15,d/2+.6,'#a18d64');for(let j=0;j<4;j++)box(g,.235,.014,.335,x,.05+j*.07,d/2+.6,'#756a53');}}
 if(v%4===1){
  for(const x of [-w*.3,w*.3])cyl(g,.017,.017,2.25,x,1.125,-d/2-.75,'#85867a',8);
  box(g,w*.6,.015,.015,0,2.13,-d/2-.75,'#8e9383');
  for(let i=0;i<4;i++){const geo=new T.PlaneGeometry(.44,.68,4,5),p=geo.attributes.position;for(let j=0;j<p.count;j++)p.setZ(j,Math.sin(p.getX(j)*30+i)*.036);geo.computeVertexNormals();const m=new T.Mesh(geo,new T.MeshStandardMaterial({color:['#c7c3ad','#7f9da5','#b19380','#80918a'][i],roughness:1,side:T.DoubleSide}));m.position.set(-w*.2+i*.62,1.78,-d/2-.75);m.castShadow=true;g.add(m);}
 }
 if(v%5===3){const tank=cyl(g,.47,.47,.9,w*.22,h+.6,-d*.28,'#a8b1ac',16);tank.material=mat('#a8b1ac',.38);for(const y of [h+.25,h+.55,h+.85]){const ring=new T.Mesh(new T.TorusGeometry(.475,.014,5,20),mat('#707d79'));ring.rotation.x=Math.PI/2;ring.position.set(w*.22,y,-d*.28);g.add(ring);}}
 const rear=vegetation(v%3===0?'banana':v%3===1?'fruit':'shade',v%4);rear.position.set((v%2?1:-1)*w*.34,0,-d/2-1.7);rear.scale.setScalar(v%3===2?.7:1);g.add(rear);
 if(v%8===0){const parked=bike();parked.scale.setScalar(.92);parked.position.set(-w*.3,.03,d/2+1.55);parked.rotation.set(0,1.2,-.12);g.add(parked);colliders.push({x:-w*.3,y:.5,z:d/2+1.55,w:1.7,h:1,d:.65});}
 return colliders;
}
