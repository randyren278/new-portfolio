import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
const exec = promisify(execFile),
  profile = `scratch-dive-pixels-${process.pid}`;
const [base = 'http://127.0.0.1:4318', out = '/tmp/dive-pixels', mode = 'verify'] =
  process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const call = async (...args) =>
  JSON.parse(
    (
      await exec('umbra', ['--profile', profile, '--json', ...args], {
        timeout: 45000,
        maxBuffer: 4e6,
      })
    ).stdout,
  );
const all = [];
try {
  await call('open', base + '/dive', '--tab', 'pixels');
  await call('wait', '--selector', '#begin', '--tab', 'pixels');
  for (const [w, h] of [
    [1440, 1000],
    [390, 844],
    [320, 568],
    [844, 390],
    [2560, 1440],
  ]) {
    await call('viewport', String(w), String(h), '--tab', 'pixels');
    const result = (
      await call(
        'eval',
        `const ctx=document.querySelector('#ocean').getContext('2d'),draw=ctx.drawImage;let boat=null,puff=null;ctx.drawImage=function(img,x,y,w,h,...rest){if(img.getContext&&img.width>60&&img.height>35&&!(img.width===112&&img.height===96)){boat={source:[img.width,img.height],target:[w,h],unit:w/img.width,unitY:h/img.height,smoothing:this.imageSmoothingEnabled};}if(img.width===112&&img.height===96)puff={source:[img.width,img.height],target:[w,h],unit:w/56,unitY:h/48,smoothing:this.imageSmoothingEnabled};return draw.call(this,img,x,y,w,h,...rest)};await new Promise(r=>setTimeout(r,250));ctx.drawImage=draw;return{viewport:[innerWidth,innerHeight],boat,puff,ratio:boat&&puff?boat.unit/puff.unit:null}`,
        '--tab',
        'pixels',
      )
    ).value;
    all.push(result);
    console.log(JSON.stringify(result));
    await call('screenshot', `${out}/${w}.png`, '--tab', 'pixels');
  }
  const ref = (
    await call(
      'eval',
      `const{renderPuff}=await import('/puff-up/game/puff-motion.js');const c=document.createElement('canvas');c.width=56;c.height=48;renderPuff(c.getContext('2d'),{animation:'turn',timeMs:0,scale:1,direction:'left'});return c.toDataURL('image/png')`,
      '--tab',
      'pixels',
    )
  ).value;
  fs.writeFileSync(out + '/puff-native.png', Buffer.from(ref.split(',')[1], 'base64'));
  fs.writeFileSync(out + '/receipt.json', JSON.stringify(all, null, 2));
  if (
    mode === 'verify' &&
    all.some(
      (r) =>
        !r.boat ||
        !r.puff ||
        r.boat.smoothing ||
        r.puff.smoothing ||
        Math.abs(r.ratio - 1) > 0.001 ||
        Math.abs(r.boat.unitY / r.puff.unitY - 1) > 0.001,
    )
  )
    throw Error('Boat and Puff do not share one logical pixel size');
} finally {
  await exec('umbra', ['--profile', profile, 'stop']);
}
