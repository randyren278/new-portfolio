(() => {
  const entrance=document.querySelector('#entrance'),portfolio=document.querySelector('#portfolio');
  const scene=window.spaceScene=new OrbitalScene(entrance),transit=new SpaceTransit();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let entering=false;
  const send=type=>parent.postMessage({type},location.origin);
  const requested=new URLSearchParams(location.search).get('scene');
  scene.setMode(['space','pool','kite'].includes(requested)?requested:'space');scene.start();
  function finish(){scene.stop();entrance.hidden=true;send('puff:entered')}
  function enter(skip=false){if(entering)return;entering=true;entrance.inert=true;send('puff:entering');if(skip||reduced.matches)finish();else transit.play({scene,entrance,portfolio,onfinish:finish})}
  document.querySelectorAll('a[href="#portfolio"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();enter(!a.classList.contains('explore-button'))}));
  reduced.addEventListener('change',()=>{scene.setReduced(reduced.matches);if(reduced.matches&&entering)transit.complete()});
  addEventListener('pagehide',()=>{transit.cancel();scene.stop()});
})();
