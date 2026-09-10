import {places,type Point} from './content';
import {nearestRoad,type Road} from './navigation';
export type VisualShot={id:string;label:string;anchor:Point;offset:[number,number,number];lookHeight:number;bike?:boolean};
export function visualShots(roads:Road[]):VisualShot[]{const at=(id:string)=>nearestRoad(places.find(p=>p.id===id)!,roads);return [
 {id:'SHOT-01',label:'Spawn / starting road',anchor:{x:-12,z:0},offset:[-6,2.7,1],lookHeight:1.25},
 {id:'SHOT-02',label:'Residential road',anchor:at('residential'),offset:[-6,2.8,3],lookHeight:1.25},
 {id:'SHOT-03',label:'Gate landmark',anchor:{x:-16,z:0},offset:[-7,2.5,-2],lookHeight:2},
 {id:'SHOT-04',label:'Shop intersection',anchor:at('shop'),offset:[-6,3,4],lookHeight:1.3},
 {id:'SHOT-05',label:'Vehicle composition',anchor:at('village-bend'),offset:[-6,2.5,1],lookHeight:1.3,bike:true},
 ];}
export function downloadEvidence(name:string,data:string){const url=URL.createObjectURL(new Blob([data],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}
