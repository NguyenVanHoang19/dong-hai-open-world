import type {Point} from './content';
export type Road={id:string;name:string;points:Point[];width:number;source:string;oneway?:boolean};
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
export function nearestOnSegment(p:Point,a:Point,b:Point):Point{const dx=b.x-a.x,dz=b.z-a.z;const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return {x:a.x+dx*t,z:a.z+dz*t};}
export function nearestRoad(p:Point,roads:Road[]):Point{let best=p,d=Infinity;for(const r of roads)for(let i=1;i<r.points.length;i++){const q=nearestOnSegment(p,r.points[i-1],r.points[i]);const k=distance(p,q);if(k<d){d=k;best=q;}}return best;}
export function route(start:Point,end:Point,roads:Road[]):Point[]{
 const nodes:Point[]=[],adj=new Map<number,Map<number,number>>(),index=new Map<string,number>();
 const get=(p:Point)=>{const key=p.x.toFixed(2)+','+p.z.toFixed(2);if(!index.has(key)){index.set(key,nodes.length);nodes.push(p);}return index.get(key)!};
 for(const r of roads)for(let i=1;i<r.points.length;i++){const a=get(r.points[i-1]),b=get(r.points[i]);if(!adj.has(a))adj.set(a,new Map());if(!adj.has(b))adj.set(b,new Map());adj.get(a)!.set(b,distance(nodes[a],nodes[b]));if(!r.oneway)adj.get(b)!.set(a,distance(nodes[a],nodes[b]));}
 if(!nodes.length)return [];
 const nearest=(p:Point)=>nodes.reduce((best,q,i)=>distance(p,q)<distance(p,nodes[best])?i:best,0);
 const a=nearest(start),b=nearest(end),open=new Set([a]),cost=new Map([[a,0]]),prev=new Map<number,number>();
 while(open.size){let u=-1,v=Infinity;for(const n of open){const f=cost.get(n)!+distance(nodes[n],nodes[b]);if(f<v){v=f;u=n}}if(u===b){const path=[nodes[b]];while(prev.has(u)){u=prev.get(u)!;path.unshift(nodes[u]);}return [start,...path,end];}open.delete(u);for(const [n,w]of adj.get(u)||[]){const g=cost.get(u)!+w;if(g<(cost.get(n)??Infinity)){cost.set(n,g);prev.set(n,u);open.add(n);}}}
 return [];
}
