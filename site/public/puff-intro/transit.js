/* Authored, scene-specific one-shot transitions. Owns its RAF, canvas and card animations. */
(() => {
  const ease=t=>1-(1-t)**3, clamp=t=>Math.max(0,Math.min(1,t)), smooth=t=>t*t*t*(t*(t*6-15)+10);
  const hash=n=>{n=Math.imul(n^8791,1597334677);return((n^(n>>>15))>>>0)/4294967295};
  const copy=source=>{if(!source)return null;const c=document.createElement('canvas');c.width=source.width;c.height=source.height;c.style.cssText=source.style.cssText;c.getContext('2d').drawImage(source,0,0);return c};
  class SpaceTransit {
    play({scene,entrance,portfolio,onfinish}) {
      this.cancel();this.active=true;this.animations=[];this.finished=false;this.mode=scene.mode;const mode=this.mode;const duration=mode==='kite'?1850:mode==='pool'?1750:1490;this.duration=duration*1.65;const w=innerWidth,h=innerHeight,cx=w*.5,cy=h*.46;
      const field=copy(scene.field.querySelector('canvas')),actor=copy(scene.layer.querySelector('canvas'));
      scene.dispose();if(field)scene.field.append(field);if(actor)scene.layer.append(actor);
      // Find the actual sprite pixels, including the kite/float, rather than a fixed box.
      let sprite,origin;
      if(actor){const ctx=actor.getContext('2d'),data=ctx.getImageData(0,0,actor.width,actor.height).data;let x0=actor.width,y0=actor.height,x1=0,y1=0;for(let y=0;y<actor.height;y+=2)for(let x=0;x<actor.width;x+=2)if(data[(y*actor.width+x)*4+3]>30){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}if(x1>x0){sprite=document.createElement('canvas');sprite.width=x1-x0+3;sprite.height=y1-y0+3;sprite.getContext('2d').drawImage(actor,x0,y0,sprite.width,sprite.height,0,0,sprite.width,sprite.height);const r=scene.layer.getBoundingClientRect();origin={x:r.left+(x0+sprite.width/2)/actor.width*r.width,y:r.top+(y0+sprite.height/2)/actor.height*r.height,width:sprite.width/actor.width*r.width,height:sprite.height/actor.height*r.height}}}
      if(mode==='ride'&&field){
        const ctx=field.getContext('2d'),data=ctx.getImageData(0,0,field.width,field.height).data;
        const colors=PuffPixels.palette.map(hex=>{const n=parseInt(hex.slice(1),16);return[n>>16,n>>8&255,n&255]});let x0=field.width,y0=field.height,x1=0,y1=0;
        for(let y=0;y<field.height;y++)for(let x=0;x<field.width;x++){const i=(y*field.width+x)*4;if(data[i+3]>180&&colors.some(c=>Math.abs(c[0]-data[i])+Math.abs(c[1]-data[i+1])+Math.abs(c[2]-data[i+2])<5)){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}}
        if(x1>x0){sprite=document.createElement('canvas');sprite.width=x1-x0+3;sprite.height=y1-y0+3;sprite.getContext('2d').drawImage(field,x0,y0,sprite.width,sprite.height,0,0,sprite.width,sprite.height);origin={x:(x0+sprite.width/2)/field.width*w,y:(y0+sprite.height/2)/field.height*h,width:sprite.width/field.width*w,height:sprite.height/field.height*h};ctx.clearRect(x0-2,y0-2,sprite.width+4,sprite.height+4);const backdrop=document.querySelector('#bento-space');if(backdrop)backdrop.getContext('2d').clearRect(x0-2,y0-2,sprite.width+4,sprite.height+4)}
      }
      if(!sprite){sprite=document.createElement('canvas');PuffPixels.draw(sprite,'space',40,2);origin={x:w*.38,y:h*.65,width:98,height:84}}
      this.canvas=document.createElement('canvas');this.canvas.className='warp-canvas';this.canvas.dataset.transition=mode;this.canvas.setAttribute('aria-hidden','true');const dpr=Math.min(2,devicePixelRatio||1);this.canvas.width=w*dpr;this.canvas.height=h*dpr;document.body.append(this.canvas);const ctx=this.canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
      document.body.classList.add('warping');entrance.classList.add('warp-departure');portfolio.classList.add('warp-arrival');
      const animate=(el,frames,options)=>{const a=el.animate(frames,{fill:'both',...options,duration:options.duration*1.65,delay:(options.delay||0)*1.65});this.animations.push(a);return a};
      [entrance.querySelector('.arrival'),entrance.querySelector('.entrance-top'),entrance.querySelector('.entrance-bottom'),entrance.querySelector('.scene-switcher'),entrance.querySelector('.vehicle-switcher')].filter(Boolean).forEach(el=>animate(el,[{opacity:1,transform:getComputedStyle(el).transform},{opacity:0,transform:getComputedStyle(el).transform}],{duration:200,easing:'ease-out'}));
      if(mode==='space')animate(scene.field,[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(2.8)'}],{duration:820,easing:'cubic-bezier(.55,0,.8,.45)'});
      else if(mode==='pool'){scene.field.style.transformOrigin=`${origin.x}px ${origin.y}px`;animate(scene.field,[{opacity:1,transform:'scale(1)'},{opacity:.65,transform:'scale(2.4)'}],{duration:1550,easing:'cubic-bezier(.45,0,.2,1)'})}
      else if(mode==='kite')animate(scene.field,[{opacity:1,transform:'translate(0,0)'},{opacity:.6,transform:'translate(-28px,-12px)'}],{duration:1050,easing:'ease-in-out'});
      else animate(scene.field,[{opacity:1,transform:'translateX(0)'},{opacity:.75,transform:`translateX(${-w*.65}px)`}],{duration:1000,easing:'cubic-bezier(.5,0,.7,1)'});
      scene.layer.style.opacity='0';
      if(mode==='space')animate(entrance,[{opacity:1,offset:0},{opacity:1,offset:.25},{opacity:0,offset:1}],{duration:1050,easing:'cubic-bezier(.3,0,.3,1)'});
      else if(mode==='pool')animate(entrance,[{opacity:1,offset:0},{opacity:1,offset:.62},{opacity:0,offset:1}],{duration:1650,easing:'cubic-bezier(.4,0,.35,1)'});
      else animate(entrance,[{opacity:1,offset:0},{opacity:1,offset:.7},{opacity:0,offset:1}],{duration:1780,easing:'linear'});
      const cards=[...portfolio.querySelectorAll('.blank-bento .bento-cell')].map(el=>({el,rect:el.getBoundingClientRect()})).sort((a,b)=>Math.hypot(a.rect.x+a.rect.width/2-cx,a.rect.y+a.rect.height/2-cy)-Math.hypot(b.rect.x+b.rect.width/2-cx,b.rect.y+b.rect.height/2-cy));
      if(mode==='kite'||mode==='ride')cards.sort((a,b)=>a.rect.x-b.rect.x||a.rect.y-b.rect.y);
      cards.forEach(({el,rect},i)=>{const dx=(cx-rect.x-rect.width/2)*.035,dy=(cy-rect.y-rect.height/2)*.035;animate(el,[{opacity:0,transform:mode==='pool'?'translateY(24px) scale(.98)':mode==='kite'?'translate(-22px,14px) scale(.99)':mode==='ride'?'translateX(42px)':`translate(${dx}px,${dy+18}px) scale(.94)`},{opacity:1,transform:'translate(0,0) scale(1)'}],{duration:mode==='pool'?900:mode==='kite'?750:510,delay:(mode==='pool'?500:mode==='kite'?950:780)+Math.min(i,5)*40,easing:'cubic-bezier(.16,1,.3,1)'})});
      animate(portfolio.querySelector('.blank-header'),[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:420,delay:970,easing:'ease-out'});
      animate(portfolio.querySelector('.blank-footer'),[{opacity:0},{opacity:1}],{duration:320,delay:1100,easing:'ease-out'});
      let rideFrame=-1;const rideSprite=mode==='ride'?document.createElement('canvas'):null;
      const stars=Array.from({length:w<700?125:220},(_,i)=>({angle:hash(i*17+8)*Math.PI*2,z:hash(i*29+3),color:i%19===0?'#bc8e76':i%23===0?'#a6b6a0':'#ddd5bd',size:i%7===0?1.8:1.1}));
      const began=performance.now();this.onfinish=onfinish;this.scene=scene;
      const tick=now=>{
        if(!this.active)return;const elapsed=(now-began)/1.65,p=clamp(elapsed/duration),flight=clamp((elapsed-60)/650),speed=ease(clamp((elapsed-120)/850));ctx.clearRect(0,0,w,h);
        if(mode==='space'){
        const veil=Math.sin(Math.PI*clamp((elapsed-40)/1250))*.28;ctx.fillStyle=`rgba(20,20,19,${veil})`;ctx.fillRect(0,0,w,h);
        const intensity=clamp((elapsed-100)/170)*(1-ease(clamp((elapsed-850)/640)));
        for(const s of stars){const z=(s.z-speed*.85+1)%1,r=.11/(z+.035),tail=.018+speed*.075;const x=cx+Math.cos(s.angle)*r*w*.8,y=cy+Math.sin(s.angle)*r*h;const r0=.11/(z+tail+.035),tx=cx+Math.cos(s.angle)*r0*w*.8,ty=cy+Math.sin(s.angle)*r0*h;if(x< -80||x>w+80||y< -80||y>h+80)continue;const len=Math.hypot(x-tx,y-ty),count=Math.min(26,Math.max(1,Math.ceil(len/5)));ctx.fillStyle=s.color;for(let j=0;j<count;j++){const q=j/count;ctx.globalAlpha=intensity*(1-q)*(.35+(1-z)*.55);const size=s.size*(1-q*.4);ctx.fillRect(Math.round(x+(tx-x)*q),Math.round(y+(ty-y)*q),size,size)}}
        if(flight<1){const go=ease(flight),scale=1-go*.84;ctx.globalAlpha=1-clamp((flight-.65)/.35);ctx.imageSmoothingEnabled=false;const x=origin.x+(cx-origin.x)*go,y=origin.y+(cy-origin.y)*go;ctx.drawImage(sprite,x-origin.width*scale/2,y-origin.height*scale/2,origin.width*scale,origin.height*scale)}
        // One warm, dotted shockwave, no flash or persistent particle storm.
        const ring=clamp((elapsed-470)/560);if(ring>0&&ring<1){const radius=24+ease(ring)*Math.hypot(w,h)*.64;ctx.fillStyle='#b9ab8b';for(let a=0;a<Math.PI*2;a+=9/Math.max(24,radius)){ctx.globalAlpha=(1-ring)*.28;ctx.fillRect(Math.round(cx+Math.cos(a)*radius),Math.round(cy+Math.sin(a)*radius),1.5,1.5)}}
        } else {
          const reveal=smooth(clamp((elapsed-280)/1400)),fade=1-ease(clamp((elapsed-1350)/450));ctx.imageSmoothingEnabled=false;
          if(mode==='pool'){
            // A dive opens a soft elliptical aperture through the dotted water.
            const ox=origin.x,oy=origin.y+origin.height*.23;
            const dive=smooth(clamp(elapsed/680));
            const opening=smooth(clamp((elapsed-320)/1200));
            const radius=12+opening*Math.hypot(w,h)*1.22;
            const feather=Math.min(32,radius*.3);
            const mask=`radial-gradient(ellipse ${radius}px ${radius*.72}px at ${ox}px ${oy}px,transparent ${Math.max(0,radius-feather)}px,#000 ${radius}px)`;
            entrance.style.maskImage=mask;entrance.style.webkitMaskImage=mask;
            for(let ring=0;ring<4;ring++){
              const r=Math.max(2,radius-ring*(10+opening*18));
              ctx.fillStyle=['#c1d9ef','#8fb6cd','#699acb','#87867f'][ring];
              const alpha=Math.sin(clamp(elapsed/1700)*Math.PI)*(.55-ring*.09);
              for(let angle=0;angle<Math.PI*2;angle+=6/Math.max(12,r)){
                const wave=Math.sin(angle*7-elapsed*.006)*Math.min(8,r*.035);
                ctx.globalAlpha=alpha*(.65+.35*Math.sin(angle*3+elapsed*.003)**2);
                ctx.fillRect(Math.round(ox+Math.cos(angle)*(r+wave)),Math.round(oy+Math.sin(angle)*(r*.72+wave)),ring?1.6:2.3,ring?1.6:2.3);
              }
            }
            // Helmet remains intact as Puff dips below the rim; small bubbles rise past us.
            ctx.save();ctx.globalAlpha=1-smooth(clamp((elapsed-300)/430));ctx.translate(origin.x,origin.y+dive*48);ctx.rotate(Math.sin(dive*Math.PI)*.08);
            const scale=1-dive*.24;ctx.drawImage(sprite,-origin.width*scale/2,-origin.height*scale/2,origin.width*scale,origin.height*scale);ctx.restore();
            for(let i=0;i<25;i++){
              const t=clamp((elapsed-180-i*17)/1150),spread=24+smooth(t)*w*.55;
              const bx=ox+(hash(i+28)-.5)*spread*2,by=oy-t*(h*.65+hash(i+7)*100);
              ctx.globalAlpha=Math.sin(t*Math.PI)*.55;ctx.fillStyle=i%3?'#699acb':'#c1d9ef';
              const size=1.5+hash(i+35)*2.5;ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=1;
              if(i%4===0)ctx.strokeRect(Math.round(bx),Math.round(by),size+2,size+2);else ctx.fillRect(Math.round(bx),Math.round(by),size,size);
            }
          } else if(mode==='kite'){
            const edge=-h*.35+reveal*(w+h*.7);entrance.style.clipPath=`polygon(${edge-h*.35}px 0, ${w}px 0, ${w}px ${h}px, ${edge+h*.35}px ${h}px)`;
            // Curving wind ribbons follow the diagonal wipe, with a handful of kite-tail bows.
            for(let ribbon=0;ribbon<9;ribbon++){const y0=h*(.08+ribbon*.105);ctx.fillStyle=ribbon%3===0?'#b8c5a6':'#c6b99d';for(let x=Math.max(0,edge-w*.3);x<Math.min(w,edge+w*.38);x+=7){const y=y0+Math.sin(x/w*5+elapsed*.004+ribbon)*11;ctx.globalAlpha=fade*.38*Math.sin(clamp((x-edge+w*.3)/(w*.68))*Math.PI);ctx.fillRect(Math.round(x),Math.round(y),1.6,1.6)}}
            const liftTime=clamp((elapsed-40)/1560),lift=smooth(liftTime);ctx.save();ctx.globalAlpha=1-smooth(clamp((liftTime-.75)/.25));ctx.translate(origin.x+lift*w*.34,origin.y-lift*(h+origin.height*.5));ctx.rotate(Math.sin(liftTime*Math.PI)*.08);ctx.drawImage(sprite,-origin.width/2,-origin.height/2,origin.width,origin.height);ctx.restore();
            for(let i=0;i<12;i++){const a=clamp((elapsed-i*25)/1500),x=origin.x+a*w*.9+(hash(i+18)-.5)*80,y=origin.y-a*h*.8+(hash(i+9)-.5)*110;ctx.globalAlpha=Math.sin(a*Math.PI)*.6;ctx.fillStyle=i%3===0?'#d97757':i%3===1?'#b8c5a6':'#c9c5b9';ctx.fillRect(Math.round(x),Math.round(y),4,2);ctx.fillRect(Math.round(x+4),Math.round(y-2),2,5)}
          } else {
            entrance.style.clipPath=`inset(0 0 0 ${reveal*100}%)`;
            const drive=clamp((elapsed-50)/820),accel=drive*drive,sheet=PuffPixels.sprites[scene.vehicle],step=Math.floor(elapsed/1000*sheet.fps);if(step!==rideFrame){PuffPixels.draw(rideSprite,scene.vehicle,12+step%(sheet.frames.length-12),1);rideFrame=step}const rw=sheet.w*1.75,rh=sheet.h*1.75,grid=h%9/2,groundY=Math.round(grid+Math.ceil((.7*h-grid)/9+1e-4)*9-.8*1.35-1);ctx.globalAlpha=1-clamp((drive-.92)/.08);ctx.drawImage(rideSprite,w*.38+accel*(w+rw)-rw/2,groundY-rh,rw,rh);
            // Road dashes follow the vehicle's ground plane, then coast to a stop.
            const ground=origin.y+origin.height/2+5,travel=ease(clamp(elapsed/1100))*w*1.7;
            for(let row=0;row<4;row++){ctx.fillStyle=row===0?'#b8c5a6':'#87867f';ctx.globalAlpha=fade*(.36-row*.075);const y=ground+row*13;for(let x=-travel%67;x<w;x+=67)for(let k=0;k<5;k++)ctx.fillRect(Math.round(x+k*5),Math.round(y),2,1.5)}
            for(let i=0;i<18;i++){const a=clamp((elapsed-i*10)/750);ctx.globalAlpha=Math.sin(a*Math.PI)*.36;ctx.fillStyle='#b9ab8b';ctx.fillRect(Math.round(origin.x-a*(60+hash(i+4)*120)),Math.round(ground-4-Math.sin(a*Math.PI)*(8+hash(i+12)*18)),1.5,1.5)}
          }
        }
        ctx.globalAlpha=1;if(p>=1){this.complete();return}this.raf=requestAnimationFrame(tick);
      };this.raf=requestAnimationFrame(tick);this.timeout=setTimeout(()=>this.complete(),duration*1.65+220);
      this.escape=e=>{if(e.key==='Escape'){e.preventDefault();this.complete()}};document.addEventListener('keydown',this.escape);
      this.visibility=()=>{if(document.hidden)this.complete()};document.addEventListener('visibilitychange',this.visibility);
    }
    complete(){if(!this.active||this.finished)return;this.finished=true;const finish=this.onfinish;this.cancel();finish?.()}
    cancel(){this.active=false;cancelAnimationFrame(this.raf);clearTimeout(this.timeout);this.canvas?.remove();this.canvas=null;this.animations?.splice(0).forEach(a=>a.cancel());document.body.classList.remove('warping');document.querySelector('#entrance')?.classList.remove('warp-departure');document.querySelector('#portfolio')?.classList.remove('warp-arrival');if(this.scene){this.scene.layer.style.opacity='';this.scene.element.style.clipPath='';this.scene.element.style.maskImage='';this.scene.element.style.webkitMaskImage='';this.scene.field.style.transformOrigin=''}if(this.escape)document.removeEventListener('keydown',this.escape);if(this.visibility)document.removeEventListener('visibilitychange',this.visibility);this.onfinish=null}
  }
  window.SpaceTransit=SpaceTransit;
})();
