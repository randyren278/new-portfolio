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
    constructor(host,{reduced=false}={}) {
      this.host=host;this.reduced=reduced;this.alive=true;this.count=0;
      this.canvas=document.createElement('canvas');this.canvas.className='fish-layer';this.canvas.setAttribute('aria-hidden','true');host.append(this.canvas);this.ctx=this.canvas.getContext('2d');
      this.resize=()=>{const interrupted=!!this.active;cancelAnimationFrame(this.raf);this.w=host.clientWidth;this.h=host.clientHeight;this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=this.w*this.dpr;this.canvas.height=this.h*this.dpr;this.canvas.style.width=this.w+'px';this.canvas.style.height=this.h+'px';this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);this.ctx.imageSmoothingEnabled=false;this.active=null;if(interrupted)this.schedule();};
      this.resize();this.observer=new ResizeObserver(this.resize);this.observer.observe(host);
      this.visibility=()=>{if(document.hidden){this.clear();clearTimeout(this.timer)}else this.schedule()};document.addEventListener('visibilitychange',this.visibility);
      this.schedule(8000+Math.random()*10000);
    }
    schedule(delay=12000+Math.random()*13000){clearTimeout(this.timer);if(this.reduced||!this.alive||document.hidden)return;this.timer=setTimeout(()=>this.jump(),delay)}
    jump(){
      if(!this.alive||this.reduced||document.hidden||this.active)return false;
      clearTimeout(this.timer);const w=this.w,h=this.h,side=Math.random()<.5?-1:1;this.count++;
      // Keep each arc beside Puff, below the title and above the invitation.
      const distance=Math.min(68,w*.12),center=w*(side<0?.18+Math.random()*.13:.69+Math.random()*.13);
      const dir=Math.random()<.5?-1:1;
      this.active={x:center-dir*distance/2,y:h*(.60+Math.random()*.09),dx:dir*distance,height:Math.min(42,h*.052),dir,start:performance.now(),duration:1450};
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
        c.drawImage(pixels,-6,-3,13,7);
        if(Math.floor(t*16)%2){c.fillStyle='#8fb6cd';c.fillRect(-6,-2,1,1)}
        c.restore();
      }
      this.ripple(a.x+a.dx,a.y,(t-1)/.72);this.splash(a.x+a.dx,a.y,(t-1)/.47,a.dir);c.globalAlpha=1;
    }
    setReduced(value){this.reduced=value;this.clear();clearTimeout(this.timer);if(!value)this.schedule()}
    stop(){this.alive=false;this.clear();clearTimeout(this.timer);this.observer.disconnect();document.removeEventListener('visibilitychange',this.visibility);this.canvas.remove()}
  }
  window.PoolFish=PoolFish;window.poolFishArt={sprite,palette};
})();
