const countDescriptors = array => {
  let getters=0, values=0, missing=0;
  for(let i=0;i<array.length;i++){
    const d=Object.getOwnPropertyDescriptor(array,String(i));
    if(!d)missing++;else if(typeof d.get==='function')getters++;else if('value' in d)values++;
  }
  return {length:array.length,getters,values,missing};
};
const sceneWasRunning=!!window.spaceScene?.running;
window.spaceScene?.stop();
const p=window.PuffPixels;
if(!p)throw new Error('PuffPixels missing');
const before={sprites:Object.fromEntries(Object.entries(p.sprites).map(([name,s])=>[name,countDescriptors(s.frames)])),kiteBody:countDescriptors(p.kiteParts.body),kiteSail:Object.getOwnPropertyDescriptor(p.kiteParts,'sail').get?'getter':'value'};
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
const canvasBytes=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
// Follow scene.hello's exact slice/map/cache-clear/restore sequence.
const s=p.sprites.space, initial=s.frames;
const saved=s.frames.slice();
s.canvases.clear();
s.frames=s.frames.map((f,i)=>i>=30&&i<98?saved[90+(i%6)]:f);
const hello={savedIsArray:Array.isArray(saved),mappedIsArray:Array.isArray(s.frames),savedLength:saved.length,mappedLength:s.frames.length,allMappedReferencesCorrect:s.frames.every((f,i)=>f===(i>=30&&i<98?saved[90+(i%6)]:saved[i]))};
s.frames=saved.slice();s.canvases.clear();
hello.restoredReferencesCorrect=s.frames.every((f,i)=>f===saved[i]);
hello.initialArrayStayedIntact=initial.every((f,i)=>f===saved[i]);
const sprites={};
for(const [name,sheet] of Object.entries(p.sprites)){
 const frames=[];
 for(let i=0;i<sheet.frames.length;i++)frames.push(await digest(sheet.frames[i]));
 sprites[name]={w:sheet.w,h:sheet.h,fps:sheet.fps,palette:sheet.palette,launch:sheet.launch??null,loop:sheet.loop??null,loopLen:sheet.loopLen??null,rest:sheet.rest??null,loopFrom:sheet.loopFrom??null,speed:sheet.speed??null,frames};
}
const body=[];
for(let i=0;i<p.kiteParts.body.length;i++)body.push(await digest(canvasBytes(p.kiteParts.body[i])));
const sail=await digest(canvasBytes(p.kiteParts.sail));
const variants={};
for(let i=0;i<48;i++)for(const blink of [false,true])for(const look of [-1,0,1]){
 const canvas=p.kiteParts.bodyFor(i,blink,look),again=p.kiteParts.bodyFor(i,blink,look);
 if(canvas!==again)throw new Error('bodyFor identity changed');
 variants[`${i}:${blink}:${look}`]=await digest(canvasBytes(canvas));
}
const after={sprites:Object.fromEntries(Object.entries(p.sprites).map(([name,s])=>[name,countDescriptors(s.frames)])),kiteBody:countDescriptors(p.kiteParts.body),kiteSail:Object.getOwnPropertyDescriptor(p.kiteParts,'sail').get?'getter':'value'};
const source=await fetch('puff-pixels.js',{cache:'no-store'}).then(r=>r.text());
return {url:location.href,createdAt:new Date().toISOString(),sceneWasRunning,sourceSha256:await digest(new TextEncoder().encode(source)),before,hello,sprites,kiteParts:{body,sail,variants},after};
