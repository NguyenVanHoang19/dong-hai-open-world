export type Point = { x:number; z:number };
export const ORIGIN = {lat:12.570061,lon:109.222798};
export function local(lat:number,lon:number):Point { return {x:(lon-ORIGIN.lon)*108650,z:-(lat-ORIGIN.lat)*110620}; }
export const places = [
 {id:'gate',name:'Cổng Đông Hải',kind:'landmark',...local(12.570061,109.222798)},
 {id:'coast',name:'Bờ biển Đông Hải',kind:'coast',...local(12.571843,109.235587)},
 {id:'village-bend',name:'Đường cong trong làng',kind:'landmark',...local(12.5735152,109.2328117)},
 {id:'garden',name:'Khu nhà vườn',kind:'landmark',...local(12.5735468,109.2315944)},
 {id:'flowers',name:'Ngõ hoa giấy',kind:'landmark',...local(12.5730552,109.2340502)},
 {id:'shop',name:'Cửa hàng phụ tùng',kind:'shop',...local(12.5725981,109.2342695)},
 {id:'residential',name:'Đường khu dân cư',kind:'landmark',...local(12.5700506,109.2337406)},
 {id:'seawall',name:'Bờ kè phía nam',kind:'coast',...local(12.5696339,109.2346947)},
] as const;
export const items = [
 {id:'engine-part',name:'Phụ tùng thuyền',price:200000,description:'Bộ phận Chú Bảy đang cần.',icon:'wrench'},
 {id:'water',name:'Nước uống',price:10000,description:'Một chai nước mát cho chuyến đi.',icon:'bottle'},
 {id:'food',name:'Bánh mì',price:15000,description:'Bữa nhẹ trong làng.',icon:'food'},
] as const;
export const mission = {id:'uncle-bay-boat',title:'Giúp Chú Bảy sửa thuyền',reward:250000,xp:150,stages:[
 {id:'meet',type:'TALK',target:'bay',text:'Gặp Chú Bảy ở cổng Đông Hải',poi:'gate'},
 {id:'part',type:'BUY',target:'engine-part',text:'Đến cửa hàng mua phụ tùng',poi:'shop'},
 {id:'ride',type:'ENTER_VEHICLE',target:'any',text:'Lên xe và mang phụ tùng ra biển',poi:'coast'},
 {id:'deliver',type:'DELIVER',target:'bay',text:'Giao phụ tùng cho Chú Bảy ở bờ biển',poi:'coast'},
]};
export type Save = {version:1;position:Point;angle:number;money:number;xp:number;inventory:Record<string,number>;stage:number;discovered:string[];vehiclePositions:Record<string,Point & {angle:number}>};
export const newSave=():Save=>({version:1,position:{x:-12,z:0},angle:Math.PI/2,money:500000,xp:0,inventory:{},stage:0,discovered:[],vehiclePositions:{}});
export type GameEvent = {type:'TALK'|'BUY'|'ENTER_VEHICLE'|'DELIVER';target:string};
export function advanceMission(s:Save,event:GameEvent):Save {
 const stage=mission.stages[s.stage];
 if(!stage||stage.type!==event.type||(stage.target!=='any'&&stage.target!==event.target))return s;
 if(event.type==='DELIVER'&&!(s.inventory['engine-part']>0))return s;
 const n={...s,stage:s.stage+1,inventory:{...s.inventory}};
 if(n.stage===1 && n.inventory['engine-part']>0)n.stage=2;
 if(event.type==='DELIVER'){n.inventory['engine-part']--;n.money+=mission.reward;n.xp+=mission.xp;}
 return n;
}
export function purchase(s:Save,id:string):Save {
 const item=items.find(i=>i.id===id);if(!item||s.money<item.price)return s;
 const n={...s,money:s.money-item.price,inventory:{...s.inventory,[id]:(s.inventory[id]||0)+1}};
 return advanceMission(n,{type:'BUY',target:id});
}
export function validateSave(input:unknown):Save|null {
 if(!input||typeof input!=='object')return null;const s=input as Save;
 if(s.version!==1||!Number.isFinite(s.position?.x)||!Number.isFinite(s.position?.z)||Math.abs(s.position.x)>3000||Math.abs(s.position.z)>2000||!Number.isFinite(s.angle)||!Number.isFinite(s.money)||s.money<0||!Number.isFinite(s.xp)||s.xp<0||!Number.isInteger(s.stage)||s.stage<0||s.stage>4||!Array.isArray(s.discovered)||!s.discovered.every(x=>typeof x==='string')||!s.inventory||typeof s.inventory!=='object'||Array.isArray(s.inventory))return null;
 if(!Object.entries(s.inventory).every(([k,v])=>items.some(i=>i.id===k)&&Number.isInteger(v)&&v>=0))return null;
 const vehicles:Save['vehiclePositions']={};
 for(const [id,p] of Object.entries(s.vehiclePositions||{})){
  if((id==='bike'||id==='car')&&p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Number.isFinite(p.angle)&&p.x>=-180&&p.x<=1518&&p.z>=-590&&p.z<=190)vehicles[id]={x:p.x,z:p.z,angle:p.angle};
 }
 return {...s,vehiclePositions:vehicles};
}
