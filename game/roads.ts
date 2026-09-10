import * as T from 'three';
import {surface} from './surfaces';
import type {Road} from './navigation';
export const ROAD_CROWN=.045;
/** Joined road ribbon; the OSM centerline is not straightened or resampled away. */
export function roadGeometry(road:Road,shoulder=false){
 const points=road.points.filter((p,i,all)=>i===0||Math.hypot(p.x-all[i-1].x,p.z-all[i-1].z)>.001);
 const positions:number[]=[],uv:number[]=[],indices:number[]=[];let along=0;
 for(let i=0;i<points.length;i++){
  const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
  if(i)along+=Math.hypot(p.x-a.x,p.z-a.z);
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1,nx=-dz/len,nz=dx/len,w=Math.max(2.4,road.width)/2;
  const offsets=shoulder?[-w-1.1,-w,w,w+1.1]:[-w,-w*.48,0,w*.48,w];
  offsets.forEach((offset,j)=>{const y=shoulder?(j===0||j===3?-.035:.012):.018+ROAD_CROWN*(1-(offset/w)**2);positions.push(p.x+nx*offset,y,p.z+nz*offset);uv.push(offset/(2*w)+.5,along/5)});
  if(i){const stride=offsets.length;for(let j=0;j<stride-1;j++){if(shoulder&&j===1)continue;const A=(i-1)*stride+j,B=i*stride+j;indices.push(A,B+1,B,A,A+1,B+1);}}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();return geo;
}
export function createRoadMeshes(roads:Road[]){const group=new T.Group(),collision:{vertices:Float32Array;indices:Uint32Array}[]=[];
 const asphalt=surface('road','#565955'),gravel=surface('earth','#a18e72');asphalt.polygonOffset=true;asphalt.polygonOffsetFactor=-1;asphalt.polygonOffsetUnits=-1;
 for(const road of roads){if(road.points.length<2)continue;const geo=roadGeometry(road);const mesh=new T.Mesh(geo,asphalt);mesh.name='road-'+road.id;mesh.receiveShadow=true;group.add(mesh);collision.push({vertices:new Float32Array(geo.attributes.position.array),indices:new Uint32Array(geo.index!.array)});
  const shoulderGeometry=roadGeometry(road,true);const shoulder=new T.Mesh(shoulderGeometry,gravel);shoulder.name='shoulder-'+road.id;shoulder.receiveShadow=true;group.add(shoulder);collision.push({vertices:new Float32Array(shoulderGeometry.attributes.position.array),indices:new Uint32Array(shoulderGeometry.index!.array)});
 }return {group,collision};
}
