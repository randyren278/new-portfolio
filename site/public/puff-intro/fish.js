/* Original 13 × 7 pixel fish. Ambient Pool visitor; owned and disposed by OrbitalScene. */
(() => {
  const palette = {b:'#8fb6cd', l:'#c1d9ef', d:'#476c91', e:'#222e35', f:'#699acb'};
  const sprite = [
    '.......f.....',
    'd.....bbbl...',
    'dd..bbblllb..',
    'ddddbbbllebb.',
    'dd..bbbbbbb..',
    'd.....dddf...',
    '.......f.....',
  ];
  const pixels=document.createElement('canvas');pixels.width=13;pixels.height=7;
  const pen=pixels.getContext('2d');sprite.forEach((row,y)=>[...row].forEach((c,x)=>{if(palette[c]){pen.fillStyle=palette[c];pen.fillRect(x,y,1,1)}}));
  class PoolFish {
    constructor(host,{reduced=false,history={direction:0,streak:0}}={}) {
      this.host=host;this.history=history;this.reduced=reduced;this.alive=true;this.count=0;
      this.canvas=document.createElement('canvas');this.canvas.className='fish-layer';this.canvas.setAttribute('aria-hidden','true');host.append(this.canvas);this.ctx=this.canvas.getContext('2d');
      this.resize=()=>{const interrupted=!!this.active;cancelAnimationFrame(this.raf);this.w=host.clientWidth;this.h=host.clientHeight;this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=this.w*this.dpr;this.canvas.height=this.h*this.dpr;this.canvas.style.width=this.w+'px';this.canvas.style.height=this.h+'px';this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);this.ctx.imageSmoothingEnabled=false;this.active=null;if(interrupted)this.schedule();};
      this.resize();this.observer=new ResizeObserver(this.resize);this.observer.observe(host);
      this.visibility=()=>{if(document.hidden){this.clear();clearTimeout(this.timer)}else this.schedule()};document.addEventListener('visibilitychange',this.visibility);
      this.schedule(6000+Math.random()*8000);
    }
    schedule(delay=10000+Math.random()*10000){clearTimeout(this.timer);if(this.reduced||!this.alive||document.hidden)return;this.timer=setTimeout(()=>this.jump(),delay)}
    onRipple(point){if(Math.random()<.25)this.jump(point)}
    placement(dir,point){
      const margin=18,distance=Math.min(68,this.w*.12),rise=Math.min(42,this.h*.052);
      const host=this.host.getBoundingClientRect(),puff=this.host.querySelector('#entrance-puff-button')?.getBoundingClientRect();
      const blocked=puff?{left:puff.left-host.left-12,right:puff.right-host.left+12,top:puff.top-host.top-12,bottom:puff.bottom-host.top+12}:null;
      const fit=(x,y)=>{
        x=Math.max(margin+(dir<0?distance:0),Math.min(this.w-margin-(dir>0?distance:0),x));
        y=Math.max(margin,Math.min(this.h-margin,y));
        const height=Math.min(rise,y-margin),left=Math.min(x,x+dir*distance)-margin,right=Math.max(x,x+dir*distance)+margin;
        if(blocked&&left<blocked.right&&right>blocked.left&&y+margin>blocked.top&&y-height-margin<blocked.bottom)return null;
        return {x,y,dx:dir*distance,height};
      };
      if(point){
        // Search outwards from the gesture, rather than falling back to a distant random spot.
        for(let radius=0;radius<=Math.max(this.w,this.h);radius+=20){
          const offset=Math.random()*Math.PI*2;
          for(let i=0;i<16;i++){const angle=offset+i*Math.PI/8,candidate=fit(point.x+Math.cos(angle)*radius,point.y+Math.sin(angle)*radius);if(candidate)return candidate;}
        }
      }else{
        for(let i=0;i<40;i++){const candidate=fit(Math.random()*this.w,Math.random()*this.h);if(candidate)return candidate;}
        for(let y=margin;y<this.h;y+=40)for(let x=margin;x<this.w;x+=40){const candidate=fit(x,y);if(candidate)return candidate;}
      }
      return null;
    }
    jump(point){
      if(!this.alive||this.reduced||document.hidden||this.active)return false;
      const history=this.history;
      const dir=history.streak>=2?-history.direction:(Math.random()<.5?-1:1);
      const placement=this.placement(dir,point);
      if(!placement){this.schedule();return false;}
      clearTimeout(this.timer);this.count++;
      history.streak=dir===history.direction?history.streak+1:1;history.direction=dir;
      this.active={...placement,dir,start:performance.now(),duration:1450};
      const tick=now=>{if(!this.active||!this.alive)return;const t=(now-this.active.start)/this.active.duration;this.draw(t);if(t<1.72)this.raf=requestAnimationFrame(tick);else{this.clear();this.schedule()}};
      this.raf=requestAnimationFrame(tick);return true;
    }
    clear(){cancelAnimationFrame(this.raf);this.active=null;this.ctx.clearRect(0,0,this.w,this.h)}
    ripple(x,y,t){if(t<0||t>1)return;const c=this.ctx;c.fillStyle='#8fb6cd';for(let ring=0;ring<2;ring++){const r=2+t*14-ring*3;if(r<1)continue;c.globalAlpha=(1-t)*(.55-ring*.18);for(let a=0;a<Math.PI*2;a+=.38)c.fillRect(Math.round(x+Math.cos(a)*r),Math.round(y+Math.sin(a)*r*.24),1,1)}}
    splash(x,y,t,dir){if(t<0||t>1)return;const c=this.ctx;for(let i=0;i<3;i++){c.globalAlpha=(1-t)*.8;c.fillStyle=i%2?'#699acb':'#c1d9ef';const dx=(i-1)*7*t+dir*t*3,dy=-Math.sin(t*Math.PI)*(6+i*3);c.fillRect(Math.round(x+dx),Math.round(y+dy),1,1)}}
    draw(t){
      const c=this.ctx,a=this.active;if(!a)return;c.clearRect(0,0,this.w,this.h);
      this.ripple(a.x,a.y,t*1.5);this.splash(a.x,a.y,t*2,a.dir);
      if(t>=0&&t<1){
        const x=a.x+a.dx*t,y=a.y-4*a.height*t*(1-t);
        const angle=Math.atan2(-4*a.height*(1-2*t),Math.abs(a.dx));
        c.save();c.beginPath();c.rect(0,0,this.w,a.y+1);c.clip();
        c.translate(x,y);c.scale(a.dir,1);c.rotate(angle);c.globalAlpha=1;
        // Whole-pixel sprite, with a tiny tail flick rather than a squash/stretch.
        c.drawImage(pixels,-13,-7,26,14);
        if(Math.floor(t*16)%2){c.fillStyle='#8fb6cd';c.fillRect(-13,-4,2,2)}
        c.restore();
      }
      this.ripple(a.x+a.dx,a.y,(t-1)/.72);this.splash(a.x+a.dx,a.y,(t-1)/.47,a.dir);c.globalAlpha=1;
    }
    setReduced(value){this.reduced=value;this.clear();clearTimeout(this.timer);if(!value)this.schedule()}
    stop(){this.alive=false;this.clear();clearTimeout(this.timer);this.observer.disconnect();document.removeEventListener('visibilitychange',this.visibility);this.canvas.remove()}
  }
  window.PoolFish=PoolFish;window.poolFishArt={sprite,palette};
})();
