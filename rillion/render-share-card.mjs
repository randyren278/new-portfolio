import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync } from 'node:fs';

const [base = 'https://rillion.randyren.org'] = process.argv.slice(2);
const exec = promisify(execFile);
const profile = `scratch-rillion-card-${process.pid}`;
const call = async (...args) => JSON.parse((await exec('umbra', ['--profile', profile, '--json', ...args], {
  timeout: 45000, maxBuffer: 4e6,
})).stdout);
try {
  await call('open', base, '--tab', 'card');
  await call('viewport', '1600', '900', '--tab', 'card');
  const { value } = await call('eval', `
    const { mountOcean } = await import('/dive/scene.mjs');
    const source = document.createElement('canvas');
    source.style.cssText = 'position:fixed;left:0;top:0;width:1600px;height:900px;z-index:9999';
    document.body.append(source);
    const ctx = source.getContext('2d', { alpha:false });
    const draw = ctx.drawImage;
    let boatDrawn = false;
    ctx.drawImage = function(image, ...args) {
      if (image.width === 176 && image.height === 115) boatDrawn = true;
      return draw.call(this, image, ...args);
    };
    const scene = mountOcean(source, { reducedMotion:true });
    try {
      await new Promise((resolve,reject) => {
        const until = performance.now() + 10000;
        function ready() {
          if (boatDrawn) resolve();
          else if (performance.now() > until) reject(new Error('Boat artwork did not render'));
          else requestAnimationFrame(ready);
        }
        ready();
      });
      const card = document.createElement('canvas');
      card.width = 1200;
      card.height = 630;
      const output = card.getContext('2d', { alpha:false });
      output.imageSmoothingEnabled = false;
      const scale = source.width / 1600;
      output.drawImage(source, 640*scale, 40*scale, 960*scale, 504*scale, 0, 0, 1200, 630);
      return card.toDataURL('image/png');
    } finally {
      scene.dispose();
      source.remove();
    }
  `, '--tab', 'card');
  const destination = new URL('../site/public/dive/share-boat-v1.png', import.meta.url);
  writeFileSync(destination, Buffer.from(value.split(',')[1], 'base64'));
  console.log(`Saved text-free 1200×630 boat card: ${destination.pathname}`);
} finally {
  await exec('umbra', ['--profile', profile, 'stop']).catch(() => {});
}
