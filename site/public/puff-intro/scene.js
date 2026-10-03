/* Scene lifecycle and controls. Original field/actor engines; original Puff artwork. */
(() => {
  const motionState={reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches};
  ReferenceModules.override(93384,motionState);
  const fields=ReferenceModules.require(98092), engines=ReferenceModules.require(82742);
  class PixelPuff{
    constructor(host){this.host=host;this.frame=0;this.canvas=document.createElement('canvas');host.replaceChildren(this.canvas);this.canvas.style.cssText='width:56px;height:48px;image-rendering:pixelated';this.render();}
    render(){PuffPixels.draw(this.canvas,'space',this.frame,2)}
    play(name,{onfinish}={}){clearTimeout(this.timer);if(name==='depart'){this.timer=setTimeout(()=>onfinish?.(),this.reduced?0:1000);return}if(name==='wave'||name==='hello'||name==='nod'){this.frame=90;this.render();this.timer=setTimeout(()=>{this.frame=40;this.render();onfinish?.()},1200)}return this}
    pause(){clearTimeout(this.timer)} setReduced(v){this.reduced=v;this.pause();this.frame=40;this.render()}
  }
  window.PixelPuff=PixelPuff;
  class OrbitalScene{
    constructor(element){this.element=element;this.mode='space';this.vehicle='skate';this.running=false;this.reduced=motionState.reducedMotion;this.resources=[];this.observers=[];this.listeners=[];
      this.field=document.createElement('div');this.field.id='pixel-field';this.layer=document.createElement('div');this.layer.id='pixel-actor';element.querySelector('#space').replaceWith(this.field);element.insertBefore(this.layer,element.firstChild);
      this.button=element.querySelector('#entrance-puff-button');this.button.replaceChildren();this.button.setAttribute('aria-label','Wave to Puff');this.button.addEventListener('click',e=>{e.stopPropagation();this.mode==='kite'?this.gust(e.detail?e.clientX:undefined):this.mode==='pool'?this.effect():this.hello()});
      this.actorRect=null;this.lastPosition=null;this.progress={p:1};this.palette=0;
      element.querySelector('#light-button').onclick=()=>{this.palette=(this.palette+1)%3;element.dataset.light=['night','ember','sage'][this.palette];document.documentElement.style.setProperty('--space-dot',['#87867f','#9a8073','#829386'][this.palette]);this.remount();this.say(['Night sky','Warm ember','Sage night'][this.palette])};
      element.querySelector('#comet-button').onclick=()=>this.effect();
      element.querySelector('#planet-button').onclick=()=>{this.setMode('space');this.effect()};
      element.querySelector('#signal-button').onclick=()=>{this.hello();this.effect()};
      document.querySelectorAll('button[data-scene]').forEach(b=>b.addEventListener('click',()=>this.setMode(b.dataset.scene)));
      element.addEventListener('click',e=>{if(this.mode==='kite'&&!e.target.closest('a,button'))this.gust(e.clientX)});
      element.querySelector('#scene-effect').onclick=()=>this.effect();
      document.addEventListener('visibilitychange',()=>{if(document.hidden)this.dispose();else if(this.running)this.mount()});
      document.fonts.ready.then(()=>this.updateClearZones());
      addEventListener('resize',()=>{this.updateClearZones();if(this.reduced&&this.running)this.remount();else{this.updateHitTarget();this.snapshot()}});
    }
    say(text){this.element.querySelector('#scene-announcement').textContent=text}
    hello(){if(this.reduced){this.say('Puff says hello');return}clearTimeout(this.helloTimer);const s=PuffPixels.sprites.space;this.savedFrames||=s.frames.slice();s.canvases.clear();s.frames=s.frames.map((f,i)=>i>=30&&i<98?this.savedFrames[90+(i%6)]:f);this.helloTimer=setTimeout(()=>{s.frames=this.savedFrames.slice();s.canvases.clear()},1400);this.say('Puff says hello')}
    setMode(mode){if(!['space','pool','kite'].includes(mode))return;if(this.mode===mode&&mode!=='ride')return;this.frozenHome=null;this.mode=mode;this.element.dataset.scene=mode;document.querySelectorAll('button[data-scene]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.scene===mode))});document.querySelectorAll('[data-vehicle]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vehicle===this.vehicle)));this.remount();this.say({space:'Puff in orbit',pool:'Puff at the pool',kite:'Puff flying a kite',ride:'Puff riding a '+this.vehicle}[mode])}
    effect(silent=false){if(this.mode==='ride'){this.remount();this.say('Puff rides again');return}if(this.mode==='kite'){this.gust();return}const r=this.field.getBoundingClientRect();const target=this.mode==='pool'?this.layer:this.field;target.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+(this.mode==='pool'&&this.lastPosition?this.lastPosition.x:r.width*.7),clientY:r.top+(this.mode==='pool'&&this.lastPosition?this.lastPosition.y:r.height*.57)}));if(!silent)this.say(this.mode==='space'?'Shooting star':this.mode==='pool'?'Water ripple':'Scene refreshed')}
    gust(clientX){if(!this.running||this.element.inert)return;this.say('The breeze catches the kite and pulls Puff along');if(!this.reduced)this.actor?.gust?.(Number.isFinite(clientX)?(clientX<this.element.getBoundingClientRect().width/2?1:-1):undefined);}
    updateClearZones(){
      const host=this.element.getBoundingClientRect();if(!host.width||!host.height)return;
      const selectors=['.arrival h1','#light-button','.scene-switcher','.explore-button','.entrance-top','.entrance-bottom'];
      const rects=selectors.map(sel=>{const node=this.element.querySelector(sel);if(!node)return '';const r=node.getBoundingClientRect(),pad=sel==='.arrival h1'?14:10;return `<rect x="${r.left-host.left-pad}" y="${r.top-host.top-pad}" width="${r.width+pad*2}" height="${r.height+pad*2}" rx="12" fill="black"/>`}).join('');
      const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${host.width}" height="${host.height}"><defs><filter id="soft"><feGaussianBlur stdDeviation="9"/></filter><mask id="clear"><rect width="100%" height="100%" fill="white"/><g filter="url(#soft)">${rects}</g></mask></defs><rect width="100%" height="100%" fill="white" mask="url(#clear)"/></svg>`;
      const mask='url("data:image/svg+xml;base64,'+btoa(svg)+'")';this.field.style.maskImage=mask;this.field.style.webkitMaskImage=mask;
    }
    scheduleAmbient(){clearTimeout(this.ambientTimer);if(this.reduced||!this.running)return;const mode=this.mode,delay=mode==='space'?11000:mode==='pool'?6500:0;if(!delay)return;this.ambientTimer=setTimeout(()=>{if(this.running&&!this.reduced&&this.mode===mode){this.effect(true);this.scheduleAmbient()}},delay)}
    capture(create){const OriginalObserver=window.ResizeObserver,originalRAF=window.requestAnimationFrame,pending=[];
      const observers=this.observers,listeners=this.listeners,originalAdd=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(type,handler,options){const target=this||window;listeners.push({target,type,handler,options});return originalAdd.call(target,type,handler,options)};window.ResizeObserver=class extends OriginalObserver{constructor(cb){super(cb);observers.push(this)}};
      if(this.reduced)window.requestAnimationFrame=cb=>{pending.push(cb);return 0};
      try{create();if(this.reduced)pending.slice().forEach(cb=>cb(performance.now()))}finally{window.ResizeObserver=OriginalObserver;window.requestAnimationFrame=originalRAF;EventTarget.prototype.addEventListener=originalAdd}
    }
    mount(){if(!this.running||document.hidden)return;this.dispose();motionState.reducedMotion=this.reduced;this.element.dataset.scene=this.mode;
      this.capture(()=>{
        if(this.mode==='ride'){this.resources.push(engines.rideScene(this.field,{vehicle:this.vehicle,px:1.75,spacing:9,rA:1.35,rB:2.4,colorVar:'--space-dot',progressRef:this.progress}));this.button.hidden=true}
        else{this.button.hidden=false;const actor=this.mode==='kite'?new KiteActor(this.layer,{reduced:this.reduced,initial:this.kiteSnapshot,onMove:(x,y,w,h)=>{this.lastPosition={x,y,w,h};this.updateHitTarget()}}):engines.clawdActor(this.layer,{mode:this.mode==='space'?'astronaut':this.mode,px:this.mode==='kite'?1.6:1.75,home:this.frozenHome||{x:.5,y:this.mode==='pool'?.61:.56},skipIntro:true,onMove:(x,y,w,h)=>{this.lastPosition={x,y,w,h};this.updateHitTarget()}});this.actor=actor;this.resources.push(actor);const avoidRef=()=>actor.getRect();
          if(this.mode==='space')this.resources.push(fields.spaceField(this.field,{spacing:9,avoidRef,progressRef:this.progress}));
          else if(this.mode==='pool')this.resources.push(engines.poolWater(this.field,{spacing:9,rA:1.35,rB:2.4,colorVar:'--space-dot',avoidRef,clickHost:this.layer,progressRef:this.progress}));
          else this.resources.push(engines.dotSky(this.field,{spacing:9,rA:1.35,rB:2.4,colorVar:'--space-dot',smooth:true,speed:7}));
        }
      });if(!this.reduced){this.field.animate([{opacity:0},{opacity:1}],{duration:450,easing:'ease-out'});this.layer.animate([{opacity:0},{opacity:1}],{duration:450,easing:'ease-out'})}this.frozenHome=null;this.updateHint();this.updateClearZones();this.scheduleAmbient();this.snapshot();
    }
    updateHitTarget(){if(!this.lastPosition)return;const {x,y}=this.lastPosition;this.button.style.left=x+'px';this.button.style.top=y+'px';}
    updateHint(){this.button.setAttribute('aria-label',this.mode==='kite'?'Give Puff and the kite a gentle gust':this.mode==='pool'?'Make a ripple around Puff':'Wave to Puff');document.querySelector('#scene-effect').textContent=({space:'Shooting star ↗',pool:'Make a ripple ◌',kite:'A little wind ≋',ride:'Ride again ↻'})[this.mode];}
    dispose(){clearTimeout(this.ambientTimer);if(this.actor?.snapshot)this.kiteSnapshot=this.actor.snapshot();this.field.getAnimations().forEach(a=>a.cancel());this.layer.getAnimations().forEach(a=>a.cancel());this.resources.splice(0).forEach(r=>r.stop?.());this.observers.splice(0).forEach(o=>o.disconnect());this.listeners.splice(0).forEach(({target,type,handler,options})=>target.removeEventListener(type,handler,options));this.field.replaceChildren();this.layer.replaceChildren();this.actor=null;}
    remount(){if(this.running)this.mount()}
    start(){this.running=true;this.mount()}
    stop(){this.running=false;this.dispose();clearTimeout(this.helloTimer);if(this.savedFrames){PuffPixels.sprites.space.frames=this.savedFrames.slice();PuffPixels.sprites.space.canvases.clear()}}
    setReduced(v){if(this.reduced===v)return;this.reduced=v;motionState.reducedMotion=v;
      if(v&&this.running){const copies=[this.field,this.layer].map(host=>[...host.querySelectorAll('canvas')].map(source=>{const c=document.createElement('canvas');c.width=source.width;c.height=source.height;c.style.cssText=source.style.cssText;c.getContext('2d').drawImage(source,0,0);return c}));this.dispose();this.field.replaceChildren(...copies[0]);this.layer.replaceChildren(...copies[1]);this.snapshot()}
      else {if(this.lastPosition&&this.mode!=='ride'){const {x,y,w,h}=this.lastPosition;this.frozenHome={x:x/w,y:y/h}}this.remount()}}

    refresh(){this.snapshot()}
    launch(){this.snapshot();this.say('Entering portfolio')}
    snapshot(){const c=document.querySelector('#bento-space');if(!c)return;const ctx=c.getContext('2d');const src=this.field.querySelector('canvas');if(src){c.width=src.width;c.height=src.height;ctx.drawImage(src,0,0)}else if(!c.width){c.width=innerWidth;c.height=innerHeight}}
  }
  window.OrbitalScene=OrbitalScene;
})();
