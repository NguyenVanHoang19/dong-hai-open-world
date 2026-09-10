import * as T from 'three';
/** Cross-section modelling in metres. Rings: y, half-width, half-depth, centreX, centreZ. */
export type Ring=[number,number,number,number?,number?];
export function loft(rings:Ring[],sides=16){
 const p:number[]=[],uv:number[]=[],idx:number[]=[];
 rings.forEach(([y,rx,rz,x=0,z=0],j)=>{for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2;p.push(x+Math.cos(a)*rx,y,z+Math.sin(a)*rz);uv.push(i/sides,j/(rings.length-1));}});
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;idx.push(a,b,a+1,a+1,b,b+1);}
 // Close both ends; radial normals on body stay smooth.
 for(const [j,flip] of [[0,true],[rings.length-1,false]] as const){const r=rings[j],c=p.length/3;p.push(r[3]||0,r[0],r[4]||0);uv.push(.5,.5);for(let i=0;i<sides;i++){const a=j*(sides+1)+i;idx.push(c,flip?a:a+1,flip?a+1:a);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
/** Thin curved leaf with a folded midrib; not a solid sphere or cone. */
export function leafGeometry(length=1,width=.35,bend=.18,segments=7){
 const p:number[]=[],uv:number[]=[],idx:number[]=[];
 for(let j=0;j<=segments;j++){const t=j/segments,w=Math.pow(Math.sin(Math.PI*t),.8)*width;for(const side of [-1,0,1]){p.push(side*w,Math.sin(t*Math.PI)*bend-(side===0?0:w*.15),t*length);uv.push((side+1)/2,t);}}
 for(let j=0;j<segments;j++)for(let i=0;i<2;i++){const a=j*3+i,b=a+3;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function branchBetween(a:T.Vector3,b:T.Vector3,r1:number,r2:number){const delta=b.clone().sub(a),g=new T.CylinderGeometry(r2,r1,delta.length(),7,1);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());return g;}
