import { renderPuff, samplePose } from './game/puff-motion.js';
export function mountGame(root, { portfolio, trigger, onClose }) {
  root.hidden = false;
  const $ = (id) => root.querySelector('#' + id),
    page = portfolio,
    space = $('space-layer'),
    gameWrap = $('game-wrap'),
    hero = $('hero'),
    heroArt = $('hero-art'),
    hc = heroArt.getContext('2d');
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let state = 'portfolio',
    phase = 'idle',
    ready = false,
    serial = 0,
    returnScroll = { x: 0, y: 0 },
    frame = null,
    sky = null,
    skyRAF = 0,
    skyTime = 0,
    meteorTimer = 0,
    twinkleTimer = 0,
    heroRAF = 0,
    completeHero = null,
    animations = [],
    lastHero = null,
    skyGeneration = 0;
  const events = new AbortController(),
    signal = events.signal;
  let gameLoadTimer = 0,
    cancelGameLoad = null,
    releaseTimer = 0;
  let disposed = false;
  const rect = (r) => ({ x: r.left, y: r.top, width: r.width, height: r.height });
  const clamp = (n) => Math.max(0, Math.min(1, n)),
    smooth = (n) => {
      const t = clamp(n);
      return t * t * (3 - 2 * t);
    },
    mix = (a, b, t) => a + (b - a) * t;
  const raw = document.createElement('canvas');
  raw.width = 104;
  raw.height = 112;
  renderPuff(raw.getContext('2d'), { animation: 'idle', timeMs: 0, x: 24, y: 32, scale: 1 });
  const pixels = raw.getContext('2d').getImageData(0, 0, 104, 112).data;
  let x0 = 104,
    y0 = 112,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < 112; y++)
    for (let x = 0; x < 104; x++)
      if (pixels[(y * 104 + x) * 4 + 3] > 128) {
        x0 = Math.min(x, x0);
        y0 = Math.min(y, y0);
        x1 = Math.max(x, x1);
        y1 = Math.max(y, y1);
      }
  const bounds = { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  const portrait = $('portrait');
  portrait.width = bounds.width;
  portrait.height = bounds.height;
  portrait
    .getContext('2d')
    .drawImage(raw, x0, y0, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);
  function modality(value) {
    root.dataset.modality = value;
    if (frame) frame.contentDocument.documentElement.dataset.modality = value;
  }
  const pointerModality = () => modality('pointer'),
    keyboardModality = (e) => {
      if (e.key === 'Tab') modality('keyboard');
    };
  root.addEventListener('pointerdown', pointerModality, { capture: true, signal });
  root.addEventListener('keydown', keyboardModality, { capture: true, signal });
  function update(next) {
    state = next;
    root.dataset.state = next;
  }
  ready = true;
  function invite() {
    if (disposed || state !== 'portfolio' || !ready) return;
    returnScroll = { x: window.scrollX, y: window.scrollY };
    update('invite');
    $('invite').showModal();
    $('invite-title').focus({ preventScroll: true });
  }
  function closeInvite() {
    if (disposed || state !== 'invite') return;
    $('invite').close();
    onClose();
  }
  $('close').addEventListener('click', closeInvite, { signal });
  $('decline').addEventListener('click', closeInvite, { signal });
  $('invite').addEventListener(
    'cancel',
    (e) => {
      e.preventDefault();
      closeInvite();
    },
    { signal },
  );
  async function prepareSky() {
    const generation = ++skyGeneration,
      { createSpaceScene } = await import('./space-scene.js');
    if (generation !== skyGeneration) return;
    cancelAnimationFrame(skyRAF);
    skyRAF = 0;
    skyTime = 0;
    sky?.stop();
    sky = createSpaceScene(space, sky?.directions);
  }
  function meteor() {
    if (!sky || reducedQuery.matches || state !== 'game') return;
    if (frame?.contentWindow?.puffClimb?.running && !sky.shots.length) {
      sky.shoot();
      if (!skyRAF) drawSky();
    }
    scheduleMeteor();
  }
  function scheduleMeteor() {
    clearTimeout(meteorTimer);
    meteorTimer = 0;
    if (state === 'game' && !document.hidden && !reducedQuery.matches)
      meteorTimer = setTimeout(meteor, 5000 + Math.random() * 3000);
  }
  function scheduleTwinkle() {
    clearTimeout(twinkleTimer);
    twinkleTimer = 0;
    if (state === 'game' && !document.hidden && !reducedQuery.matches)
      twinkleTimer = setTimeout(
        () => {
          twinkleTimer = 0;
          if (frame?.contentWindow?.puffClimb?.running && sky) {
            sky.twinkle();
            if (!skyRAF) drawSky();
          }
          scheduleTwinkle();
        },
        2800 + Math.random() * 2000,
      );
  }
  function drawSky(now = performance.now()) {
    skyRAF = 0;
    if (!sky || !['entering', 'game', 'returning'].includes(state) || document.hidden) return;
    const dt = skyTime ? Math.min(0.05, (now - skyTime) / 1000) : 0;
    skyTime = now;
    sky.draw(reducedQuery.matches ? 0 : dt);
    if ((sky.shots.length || sky.twinkles.length) && !reducedQuery.matches)
      skyRAF = requestAnimationFrame(drawSky);
    else skyTime = 0;
  }
  function stopSky() {
    clearTimeout(twinkleTimer);
    twinkleTimer = 0;
    clearTimeout(meteorTimer);
    meteorTimer = 0;
    cancelAnimationFrame(skyRAF);
    skyRAF = 0;
    skyTime = 0;
    sky?.stop();
  }
  function loadGame(token) {
    return new Promise((resolve, reject) => {
      frame = document.createElement('iframe');
      frame.id = 'game';
      frame.title = 'Puff climbing game';
      frame.src = '/puff-up/game/index.html';
      gameLoadTimer = setTimeout(() => reject(Error('The game took too long to load')), 12000);
      cancelGameLoad = () => {
        clearTimeout(gameLoadTimer);
        cancelGameLoad = null;
        resolve(null);
      };
      frame.onload = () => {
        clearTimeout(gameLoadTimer);
        cancelGameLoad = null;
        if (token !== serial) return resolve(null);
        const api = frame.contentWindow.puffDemoGame;
        if (!api) return reject(Error('The game did not open'));
        frame.contentDocument.documentElement.dataset.modality = root.dataset.modality;
        frame.contentDocument.body.dataset.handoff = 'true';
        const sheet = frame.contentDocument.createElement('style');
        sheet.textContent = 'body[data-handoff] .pause-label{visibility:hidden}';
        frame.contentDocument.head.append(sheet);
        resolve(api);
      };
      frame.onerror = () => {
        clearTimeout(gameLoadTimer);
        cancelGameLoad = null;
        reject(Error('The game could not load'));
      };
      gameWrap.replaceChildren(frame);
    });
  }
  function animate(el, keyframes, options) {
    const a = el.animate(keyframes, { fill: 'forwards', ...options });
    animations.push(a);
    return a.finished.catch(() => {});
  }
  function cancelMotion() {
    completeHero?.(false);
    completeHero = null;
    animations.splice(0).forEach((a) => a.cancel());
    cancelAnimationFrame(heroRAF);
    heroRAF = 0;
    hero.hidden = true;
  }
  function heroPosition(x, y, w, h) {
    hero.style.left = `${x}px`;
    hero.style.top = `${y}px`;
    hero.style.width = `${w}px`;
    hero.style.height = `${h}px`;
    heroArt.style.width = `${(104 / bounds.width) * w}px`;
    heroArt.style.height = `${(112 / bounds.height) * h}px`;
    heroArt.style.left = `${(-bounds.x / bounds.width) * w}px`;
    heroArt.style.top = `${(-bounds.y / bounds.height) * h}px`;
  }
  function drawHero(animation, time) {
    hc.clearRect(0, 0, 104, 112);
    const p = samplePose(animation, time, { direction: 'right' });
    renderPuff(hc, {
      animation,
      timeMs: time,
      x: 24 - (animation === 'boost' ? p.offsetX : 0),
      y: 32 - (animation === 'boost' ? p.offsetY : 0),
      scale: 1,
      direction: 'right',
    });
  }
  function cinematic(from, token) {
    return new Promise((resolve) => {
      completeHero = resolve;
      const began = performance.now(),
        duration = reducedQuery.matches ? 180 : 1240,
        targetWidth = Math.min(innerWidth < 700 ? 140 : 174, innerWidth * 0.4),
        targetHeight = (targetWidth * bounds.height) / bounds.width,
        cx = innerWidth / 2,
        cy = innerHeight * 0.45;
      hero.hidden = false;
      lastHero = { from, startedAt: began, targetWidth, finished: false };
      function tick(now) {
        if (token !== serial) {
          resolve(false);
          return;
        }
        const elapsed = now - began;
        let x,
          y,
          w,
          h,
          alpha = 1;
        if (reducedQuery.matches) {
          phase = 'crossfade';
          x = from.x;
          y = from.y;
          w = from.width;
          h = from.height;
          alpha = 1 - smooth(elapsed / duration);
          drawHero('idle', 0);
        } else if (elapsed < 460) {
          phase = 'push-in';
          const t = smooth(elapsed / 460);
          w = mix(from.width, targetWidth, t);
          h = mix(from.height, targetHeight, t);
          x = mix(from.x, cx - targetWidth / 2, t);
          y = mix(from.y, cy - targetHeight / 2, t);
          drawHero('idle', Math.min(100, elapsed * 0.2));
        } else {
          const t = clamp((elapsed - 460) / 680);
          phase = t < 0.18 ? 'ignition' : 'blast-off';
          w = targetWidth;
          h = targetHeight;
          x = cx - w / 2;
          y = cy - h / 2 - Math.pow(t, 2.25) * (cy + h + 80);
          drawHero('boost', Math.min(1050, (elapsed - 460) * 1.5));
          alpha = 1 - smooth((elapsed - 1080) / 140);
        }
        heroPosition(x, y, w, h);
        hero.style.opacity = String(alpha);
        lastHero = { ...lastHero, phase, current: { x, y, width: w, height: h }, elapsed };
        if (elapsed >= duration) {
          hero.hidden = true;
          lastHero.finished = true;
          phase = 'world-reveal';
          heroRAF = 0;
          completeHero = null;
          resolve(true);
        } else heroRAF = requestAnimationFrame(tick);
      }
      heroRAF = requestAnimationFrame(tick);
    });
  }
  async function enter() {
    if (disposed || state !== 'invite') return;
    const from = rect(portrait.getBoundingClientRect()),
      token = ++serial;
    $('veil').hidden = false;
    $('veil').style.opacity = '0';
    $('invite').close();
    update('entering');
    page.inert = true;
    page.style.pointerEvents = 'none';
    $('back').hidden = false;
    $('back').focus({ preventScroll: true });
    gameWrap.hidden = false;
    gameWrap.style.opacity = '0';
    gameWrap.style.pointerEvents = 'none';
    space.style.opacity = '0';
    page.style.transformOrigin = `${from.x + from.width / 2 + window.scrollX}px ${from.y + from.height / 2 + window.scrollY}px`;
    try {
      let gameIsReady = false;
      const gameReady = loadGame(token).then((api) => {
          gameIsReady = true;
          return api;
        }),
        skyReady = prepareSky();
      const motion = cinematic(from, token).then((result) => {
        if (token === serial && !gameIsReady) $('loading').hidden = false;
        return result;
      });
      const duration = reducedQuery.matches ? 180 : 1000;
      animate($('veil'), [{ opacity: 0 }, { opacity: 1 }], {
        duration: reducedQuery.matches ? 120 : 540,
        delay: reducedQuery.matches ? 0 : 160,
        easing: 'ease-in-out',
      });
      animate(
        page,
        [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 1, transform: 'scale(1.035)', offset: 0.3 },
          { opacity: 0, transform: 'scale(1.09)' },
        ],
        { duration, easing: 'cubic-bezier(.3,0,.3,1)' },
      );
      animate(space, [{ opacity: 0 }, { opacity: 1 }], {
        duration: reducedQuery.matches ? 180 : 760,
        delay: reducedQuery.matches ? 0 : 340,
        easing: 'ease-in-out',
      });
      const [api] = await Promise.all([gameReady, skyReady, motion]);
      if (token !== serial || !api) return;
      $('loading').hidden = true;
      phase = 'world-reveal';
      if (!sky) throw Error('The sky did not open');
      space.style.opacity = '1';
      page.style.opacity = '0';
      page.style.transform = 'scale(1.09)';
      frame.contentDocument.body.removeAttribute('data-handoff');
      api.start();
      await Promise.all([
        animate($('veil'), [{ opacity: 1 }, { opacity: 0 }], {
          duration: reducedQuery.matches ? 120 : 320,
          easing: 'ease-out',
        }),
        animate(
          gameWrap,
          [
            { opacity: 0, transform: 'translateY(10px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: reducedQuery.matches ? 120 : 320, easing: 'ease-out' },
        ),
      ]);
      if (token !== serial) return;
      $('veil').hidden = true;
      $('veil').style.opacity = '0';
      gameWrap.style.opacity = '1';
      gameWrap.style.pointerEvents = '';
      update('game');
      phase = 'playing';
      scheduleMeteor();
      scheduleTwinkle();
    } catch (error) {
      if (token !== serial) return;
      console.error(error.message);
      await returnToPortfolio();
    }
  }
  async function returnToPortfolio() {
    if (disposed || !['entering', 'game'].includes(state)) return;
    ++serial;
    ++skyGeneration;
    cancelGameLoad?.();
    update('returning');
    phase = 'return';
    if (frame?.contentDocument?.body) frame.contentDocument.body.dataset.handoff = 'true';
    frame?.contentWindow?.puffDemoGame?.pause();
    stopSky();
    const coverOpacity = $('veil').hidden ? 0 : Number(getComputedStyle($('veil')).opacity);
    cancelMotion();
    $('loading').hidden = true;
    $('back').hidden = true;
    gameWrap.style.pointerEvents = 'none';
    page.style.pointerEvents = 'none';
    $('veil').hidden = false;
    $('veil').style.opacity = String(coverOpacity);
    await animate($('veil'), [{ opacity: coverOpacity }, { opacity: 1 }], {
      duration: reducedQuery.matches ? 60 : 200,
      easing: 'ease-in',
    });
    if (disposed) return;
    // Swap the documents only beneath one fully opaque surface, as intro replay does.
    frame?.remove();
    frame = null;
    gameWrap.hidden = true;
    gameWrap.replaceChildren();
    gameWrap.style.opacity = '0';
    gameWrap.style.transform = '';
    space.style.opacity = '0';
    page.style.opacity = '1';
    window.scrollTo(returnScroll.x, returnScroll.y);
    const duration = reducedQuery.matches ? 100 : 500;
    const camera = animate(
      page,
      [
        { opacity: 1, transform: 'scale(1.06)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      { duration, easing: 'cubic-bezier(.16,1,.3,1)' },
    );
    const uncover = animate($('veil'), [{ opacity: 1 }, { opacity: 0 }], {
      duration,
      easing: 'cubic-bezier(.4,0,.2,1)',
    });
    releaseTimer = setTimeout(
      () => {
        if (!disposed && state === 'returning') {
          page.inert = false;
          page.style.pointerEvents = 'auto';
        }
      },
      reducedQuery.matches ? 0 : 230,
    );
    await Promise.all([camera, uncover]);
    if (disposed) return;
    cancelMotion();
    $('veil').hidden = true;
    $('veil').style.opacity = '0';
    gameWrap.style.pointerEvents = '';
    page.style.opacity = '1';
    page.style.transform = 'none';
    page.inert = false;
    page.style.pointerEvents = '';
    space.style.opacity = '0';
    trigger?.focus({ preventScroll: true });
    update('portfolio');
    phase = 'idle';
    onClose();
  }
  $('play').addEventListener('click', enter, { signal });
  $('back').addEventListener(
    'pointerdown',
    () => {
      if (frame?.contentDocument?.body) frame.contentDocument.body.dataset.handoff = 'true';
    },
    { signal },
  );
  $('back').addEventListener('click', returnToPortfolio, { signal });
  let resizeTimer;
  const resize = () => {
    if (state === 'entering') returnToPortfolio();
    else if (state === 'game') {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => prepareSky().then(() => drawSky()), 100);
    }
  };
  const visibility = () => {
    if (document.hidden) {
      stopSky();
      if (state === 'entering') returnToPortfolio();
      else frame?.contentWindow?.puffDemoGame?.pause();
    } else if (state === 'game') {
      scheduleMeteor();
      scheduleTwinkle();
    }
  };
  const hide = () => {
    dispose();
    onClose();
  };
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', visibility);
  addEventListener('pagehide', hide);
  Object.defineProperty(window, 'puffUp', {
    configurable: true,
    get: () =>
      Object.freeze({
        state,
        phase,
        ready,
        gameMounted: !!frame,
        gameRunning: !!frame?.contentWindow?.puffClimb?.running,
        gameSeed: frame?.contentWindow?.puffClimb?.run.seed ?? null,
        reduced: reducedQuery.matches,
        staticStars: sky?.starCount ?? 0,
        twinkles: sky?.twinkles.length ?? 0,
        twinklesEmitted: sky?.twinkled ?? 0,
        pendingTwinkle: !!twinkleTimer,
        shootingStarsEmitted: sky?.emitted ?? 0,
        shootingDirections: sky?.directions ?? [],
        shootingStars: sky?.shots.length ?? 0,
        skyAnimating: !!skyRAF,
        heroAnimating: !!heroRAF,
        pendingMeteor: !!meteorTimer,
        portfolioInert: page.inert,
        hero: lastHero ? structuredClone(lastHero) : null,
        returnScroll: { ...returnScroll },
        portfolioScroll: { x: window.scrollX, y: window.scrollY },
      }),
  });
  const oldOverflow = document.body.style.overflow,
    oldPageStyle = {
      opacity: page.style.opacity,
      transform: page.style.transform,
      transformOrigin: page.style.transformOrigin,
      pointerEvents: page.style.pointerEvents,
    },
    oldInert = page.inert;
  document.body.style.overflow = 'hidden';
  invite();
  function dispose() {
    if (disposed) return;
    disposed = true;
    root.hidden = true;
    events.abort();
    cancelGameLoad?.();
    clearTimeout(gameLoadTimer);
    clearTimeout(releaseTimer);
    ++serial;
    ++skyGeneration;
    clearTimeout(resizeTimer);
    cancelMotion();
    stopSky();
    frame?.remove();
    $('invite').close();
    removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', visibility);
    removeEventListener('pagehide', hide);
    root.removeEventListener('pointerdown', pointerModality, true);
    root.removeEventListener('keydown', keyboardModality, true);
    document.body.style.overflow = oldOverflow;
    Object.assign(page.style, oldPageStyle);
    page.inert = oldInert;
    window.scrollTo(returnScroll.x, returnScroll.y);
    trigger?.focus({ preventScroll: true });
    delete window.puffUp;
  }
  return dispose;
}
