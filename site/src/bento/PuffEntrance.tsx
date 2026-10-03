'use client';

import { useEffect, useRef, useState } from 'react';

export function PuffEntrance({
  onEntering,
  onEntered,
  scene,
}: {
  onEntering: () => void;
  onEntered: () => void;
  scene: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'puff:entering') onEntering();
      if (event.data?.type === 'puff:entered') onEntered();
    }
    addEventListener('message', receive);
    return () => removeEventListener('message', receive);
  }, [onEntering, onEntered]);
  return (
    <iframe
      ref={frame}
      className={`puff-entrance${ready ? ' is-ready' : ''}`}
      onLoad={() => setReady(true)}
      title="Puff — explore Randy’s portfolio"
      src={`/puff-intro/index.html?scene=${scene}`}
    />
  );
}

export function CorrespondencePuff() {
  const [waving, setWaving] = useState(false);
  useEffect(() => {
    if (!waving) return;
    const timer = setTimeout(() => setWaving(false), 1200);
    return () => clearTimeout(timer);
  }, [waving]);
  return (
    <button
      className="correspondence-puff"
      type="button"
      aria-label="Say hello to Puff"
      onClick={() => setWaving(true)}
    >
      <img
        src={waving ? '/puff-intro/puff-wave.png' : '/puff-intro/puff.png'}
        alt=""
        width="56"
        height="48"
      />
      <output className="puff-greeting">{waving ? 'Hello!' : ''}</output>
    </button>
  );
}
