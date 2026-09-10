import * as T from 'three';
export type Surface='plaster'|'road'|'earth'|'tile'|'stone'|'cloth'|'water';
const surfaceMaterials=new Map<string,T.MeshStandardMaterial>();
// Original analytical materials: no downloaded imagery or texture redistribution.
export function surface(kind:Surface,color:string){
 const key=kind+color;if(surfaceMaterials.has(key))return surfaceMaterials.get(key)!;
 const m=new T.MeshStandardMaterial({color,roughness:kind==='water'?.25:.94,metalness:kind==='water'?.16:0});
 m.onBeforeCompile=s=>{
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSurfacePosition; varying vec2 vSurfaceUv;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSurfacePosition=position;vSurfaceUv=uv;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
 varying vec3 vSurfacePosition; varying vec2 vSurfaceUv;
 float hashP(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float noiseP(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hashP(i),hashP(i+vec3(1,0,0)),f.x),mix(hashP(i+vec3(0,1,0)),hashP(i+vec3(1,1,0)),f.x),f.y),mix(mix(hashP(i+vec3(0,0,1)),hashP(i+vec3(1,0,1)),f.x),mix(hashP(i+vec3(0,1,1)),hashP(i+vec3(1,1,1)),f.x),f.y),f.z);}
 `);
  const code:Record<Surface,string>={
   plaster:'float n=noiseP(p*12.); float stain=noiseP(p*1.2); float dampBase=(1.-smoothstep(.05,1.2,p.y))*smoothstep(.25,.8,stain);diffuseColor.rgb*=.88+n*.09+stain*.08;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.62,.69,.55),dampBase*.55);',
   road:'float edgeFade=smoothstep(.32,.49,abs(vSurfaceUv.x-.5));float grit=noiseP(p*65.);float roadVariation=noiseP(p*.25);diffuseColor.rgb*=.77+grit*.32+roadVariation*.13;float repair=smoothstep(.68,.76,noiseP(vec3(p.x*.7,0.,p.z*.4)));diffuseColor.rgb*=1.-repair*.17;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.24,.21,.16),edgeFade*.48);',
   earth:'float n=noiseP(p*.08);float grain=noiseP(p*7.);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.24,.32,.12),smoothstep(.25,.78,n)*.68);diffuseColor.rgb*=.83+grain*.24;',
   tile:'vec2 uv=vec2(p.x*3.6,p.z*2.3);float seam=smoothstep(.025,.09,min(fract(uv.x),fract(uv.y)));float ridge=.82+.18*cos(uv.x*6.283);diffuseColor.rgb*=mix(.48,ridge,seam)*(.9+.14*hashP(vec3(floor(uv),0.)));',
   stone:'vec2 uv=p.xz*1.65;uv.x+=mod(floor(uv.y),2.)*.5;float seam=smoothstep(.012,.045,min(fract(uv.x),fract(uv.y)));diffuseColor.rgb*=mix(.5,.87+.16*noiseP(p*18.),seam);',
   cloth:'diffuseColor.rgb*=.95+.05*noiseP(p*70.);',
   water:'float ripples=sin(p.x*2.8+p.z*1.3)*sin(p.z*4.1);diffuseColor.rgb*=.93+.07*ripples;'
  };
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nvec3 p=vSurfacePosition;\n'+code[kind]);
 };
 m.customProgramCacheKey=()=>kind;surfaceMaterials.set(key,m);return m;
}
export function seeded(seed:number){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
export function damp(value:number,target:number,rate:number,dt:number){return target+(value-target)*Math.exp(-rate*dt)}
export function turn(value:number,target:number,rate:number,dt:number){return value+Math.atan2(Math.sin(target-value),Math.cos(target-value))*(1-Math.exp(-rate*dt))}
