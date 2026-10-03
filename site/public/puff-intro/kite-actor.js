/* Kite-only motion: independent masses, a tensioned line and a trailing tail. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  class KiteActor {
    constructor(host,{reduced=false,onMove,initial}={}) {
      this.host=host;this.onMove=onMove;this.reduced=reduced;this.canvas=document.createElement('canvas');this.canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';this.canvas.setAttribute('aria-hidden','true');host.append(this.canvas);this.ctx=this.canvas.getContext('2d');this.time=initial?.time||0;this.age=initial?.age??99;this.direction=initial?.direction||1;this.steps=initial?.steps||0;this.resize(initial);this.draw();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);if(!reduced)this.raf=requestAnimationFrame(t=>this.tick(t));
    }
    resize(initial){if(this.stopped)return;const r=this.host.getBoundingClientRect(),oldW=this.w,oldGround=this.ground;this.scale=r.height<520?.72:r.height<650?.88:1;this.w=r.width/this.scale;this.h=r.height/this.scale;this.baseGround=this.h*(r.height<500?.68:.65);this.ground=this.baseGround;this.homeX=this.w*(r.height<500&&r.width>=500?.68:.5);const dpr=Math.min(2,devicePixelRatio||1);this.canvas.width=r.width*dpr;this.canvas.height=r.height*dpr;this.ctx.setTransform(dpr*this.scale,0,0,dpr*this.scale,0,0);this.ctx.imageSmoothingEnabled=false;
      if(!this.p){this.p=initial?.p?{...initial.p}:{x:this.homeX,y:this.ground,vx:0,vy:0,angle:0};this.k=initial?.k?{...initial.k}:{x:this.homeX+30,y:this.ground-151,vx:0,vy:0,angle:0};this.tail=initial?.tail?.map(v=>({...v}))||Array.from({length:5},(_,i)=>({x:this.k.x,y:this.k.y+20+i*9}));if(initial?.w){const dx=this.homeX-(initial.homeX??initial.w/2),dy=this.ground-initial.ground;this.p.x+=dx;this.p.y+=dy;this.k.x+=dx;this.k.y+=dy;this.tail.forEach(v=>{v.x+=dx;v.y+=dy})}}
      else if(oldW){const dx=this.homeX-(this.oldHomeX??oldW*.5),dy=this.ground-oldGround;this.p.x+=dx;this.p.y+=dy;this.k.x+=dx;this.k.y+=dy;this.tail.forEach(v=>{v.x+=dx;v.y+=dy})}this.oldHomeX=this.homeX;this.draw();
    }
    hand(){const a=this.p.angle;return{x:this.p.x+27.2*Math.cos(a)+24*Math.sin(a),y:this.p.y+27.2*Math.sin(a)-24*Math.cos(a)}}
    gust(direction){if(this.reduced)return;this.age=0;this.direction=direction===1||direction===-1?direction:this.p.x>this.w*.58?-1:1;}
    step(dt){this.time+=dt;this.age+=dt;this.ground=this.baseGround+2*Math.sin(this.time*.5)+Math.sin(this.time*.21);const pulse=this.age<1.55?Math.sin(Math.PI*this.age/1.55)**2:0,dir=this.direction;
      const home=this.homeX+18*Math.sin(this.time*.2)+8*Math.sin(this.time*.47),range=Math.min(110,this.w*.23),tx=home+30+dir*range*pulse+Math.sin(this.time*.65)*9+Math.sin(this.time*.27)*4,ty=this.ground-151-26*pulse+Math.sin(this.time*.48)*3;
      const hand=this.hand(),dx=this.k.x-hand.x,dy=this.k.y+8-hand.y,dist=Math.hypot(dx,dy)||1,nx=dx/dist,ny=dy/dist;
      this.tension=Math.max(0,(dist-120)*35+(nx*(this.k.vx-this.p.vx)+ny*(this.k.vy-this.p.vy))*2);
      this.k.vx+=((tx-this.k.x)*30-this.k.vx*7-nx*this.tension*.09)*dt;this.k.vy+=((ty-this.k.y)*30-this.k.vy*7-ny*this.tension*.09)*dt;
      this.k.x+=this.k.vx*dt;this.k.y+=this.k.vy*dt;
      const grounded=this.p.y>=this.ground-.3,returning=this.age>1.65&&grounded;
      this.p.vx+=(nx*this.tension*.7-(returning?(this.p.x-home)*3:0)-this.p.vx*(grounded?4.4:1.5))*dt;
      this.p.vy+=(185+ny*this.tension*.7-this.p.vy*2)*dt;
      const oldX=this.p.x;this.p.x=clamp(this.p.x+this.p.vx*dt,48,this.w-48);this.p.y+=this.p.vy*dt;
      if(this.p.y>this.ground){this.p.y=this.ground;this.p.vy=0}
      // Inextensible tether: distribute positional and radial-velocity corrections.
      const grip=this.hand(),rx=this.k.x-grip.x,ry=this.k.y+8-grip.y,length=Math.hypot(rx,ry)||1;
      if(length>122){const ux=rx/length,uy=ry/length,extra=length-122;this.p.x+=ux*extra*.45;this.p.y+=uy*extra*.45;this.k.x-=ux*extra*.55;this.k.y-=uy*extra*.55;const separating=(this.k.vx-this.p.vx)*ux+(this.k.vy-this.p.vy)*uy;if(separating>0){this.p.vx+=ux*separating*.45;this.p.vy+=uy*separating*.45;this.k.vx-=ux*separating*.55;this.k.vy-=uy*separating*.55}}
      if(this.p.y>this.ground){this.p.y=this.ground;this.p.vy=0}this.p.x=clamp(this.p.x,48,this.w-48);this.steps+=Math.abs(this.p.x-oldX)/24;
      const lean=clamp(this.p.vx*.0015+nx*this.tension*.00016,-.13,.13);this.p.angle+=(lean-this.p.angle)*(1-Math.exp(-8*dt));
      const pitch=clamp(this.k.vx*.003+dir*pulse*.08,-.25,.25);this.k.angle+=(pitch-this.k.angle)*(1-Math.exp(-5*dt));
      let prev={x:this.k.x-Math.sin(this.k.angle)*19,y:this.k.y+Math.cos(this.k.angle)*19};for(let i=0;i<this.tail.length;i++){const tail=this.tail[i],targetX=prev.x+dir*pulse*(5+i)+Math.sin(this.time*2-i*.8)*1.5;tail.x+=(targetX-tail.x)*(1-Math.exp(-(12-i)*dt));tail.y+=(prev.y+9-tail.y)*(1-Math.exp(-15*dt));const dx=tail.x-prev.x,dy=tail.y-prev.y,len=Math.hypot(dx,dy)||1;tail.x=prev.x+dx/len*9;tail.y=prev.y+dy/len*9;prev=tail;}
    }
    tick(now){if(this.stopped)return;let dt=Math.min(.05,(now-(this.last||now))/1000);this.last=now;while(dt>0){const step=Math.min(dt,1/120);this.step(step);dt-=step}this.draw();this.raf=requestAnimationFrame(t=>this.tick(t))}
    draw(){if(!this.p)return;const ctx=this.ctx,p=this.p,k=this.k;ctx.clearRect(0,0,this.w,this.h);const hand=this.hand(),distance=Math.hypot(k.x-hand.x,k.y+8-hand.y),slack=Math.max(0,120-distance);
      let sag=0;const nx=-(this.k.y+8-hand.y)/Math.max(1,distance),ny=(this.k.x-hand.x)/Math.max(1,distance),midX=(hand.x+k.x)/2,midY=(hand.y+k.y+8)/2;
      if(slack>.05){let lo=0,hi=150;for(let trial=0;trial<10;trial++){const bend=(lo+hi)/2,cx=midX+nx*bend,cy=midY+ny*bend;let length=0,px=hand.x,py=hand.y;for(let n=1;n<=16;n++){const q=n/16,x=(1-q)**2*hand.x+2*(1-q)*q*cx+q*q*k.x,y=(1-q)**2*hand.y+2*(1-q)*q*cy+q*q*(k.y+8);length+=Math.hypot(x-px,y-py);px=x;py=y}if(length>120)hi=bend;else lo=bend}sag=(lo+hi)/2}
      // Slack bows with gravity; force straightens the line before Puff is pulled.
      ctx.strokeStyle='#c9c5b9';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(hand.x,hand.y);ctx.quadraticCurveTo(midX+nx*sag,midY+ny*sag,k.x,k.y+8);ctx.stroke();
      let prev={x:k.x-Math.sin(k.angle)*19,y:k.y+Math.cos(k.angle)*19};ctx.strokeStyle='#c9c5b9';for(let i=0;i<this.tail.length;i++){const t=this.tail[i];ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(t.x,t.y);ctx.stroke();if(i===1||i===4){ctx.fillStyle=i===1?'#e9be76':'#b8c5a6';ctx.fillRect(Math.round(t.x-3),Math.round(t.y-1),6,3)}prev=t}
      if(this.age<2){const u=this.age/2;for(let row=0;row<3;row++)for(let i=0;i<23;i++){const q=i/22;ctx.globalAlpha=Math.sin(u*Math.PI)*Math.sin(q*Math.PI)*.3;ctx.fillStyle='#b8c5a6';ctx.fillRect(Math.round(p.x-this.direction*(110-u*100-q*80)),Math.round(p.y-60-row*19+Math.sin(q*3+u*2+row)*6),1.4,1.4)}ctx.globalAlpha=1}
      ctx.save();ctx.translate(k.x,k.y);ctx.rotate(k.angle);ctx.drawImage(PuffPixels.kiteParts.sail,-25.6,-24,51.2,51.2);ctx.restore();
      const inAir=p.y<this.ground-1,frame=inAir?12:Math.floor(this.steps*48)%48;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.drawImage(PuffPixels.kiteParts.bodyFor(frame,this.time%6.8>6.5&&this.time%6.8<6.65,k.x<p.x?-1:1),-44.8,-64,89.6,76.8);ctx.restore();this.onMove?.(p.x*this.scale,(p.y-31)*this.scale,this.w*this.scale,this.h*this.scale);
    }
    snapshot(){return{w:this.w,ground:this.ground,scale:this.scale,homeX:this.homeX,p:{...this.p},k:{...this.k},tail:this.tail.map(v=>({...v})),time:this.time,age:this.age,direction:this.direction,steps:this.steps}}
    getRect(){return{left:Math.min(this.p.x-45,this.k.x-26)*this.scale,top:Math.min(this.p.y-64,this.k.y-25)*this.scale,w:(Math.abs(this.k.x-this.p.x)+90)*this.scale,h:(this.p.y-Math.min(this.p.y-64,this.k.y-25)+12)*this.scale}}
    stop(){this.stopped=true;cancelAnimationFrame(this.raf);this.observer.disconnect();this.canvas.remove()}
  }
  window.KiteActor=KiteActor;
})();
