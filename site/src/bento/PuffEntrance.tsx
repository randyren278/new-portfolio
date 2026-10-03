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
  const [curious, setCurious] = useState(false);
  useEffect(() => {
    if (!curious) return;
    const timer = setTimeout(() => setCurious(false), 1800);
    return () => clearTimeout(timer);
  }, [curious]);
  return (
    <button
      className={`correspondence-puff${curious ? ' is-curious' : ''}`}
      type="button"
      aria-label="Say hello to Puff"
      onClick={() => setCurious(true)}
    >
      <svg
        viewBox="0 0 56 48"
        width="56"
        height="48"
        aria-hidden="true"
        shapeRendering="crispEdges"
      >
        {/* Approved Puff silhouette, with fixed feet and an unbroken helmet. */}
        <g transform="translate(2 0)" className="puff-still" fill="#eee5d2">
          <path d="M23 20H30V21H33V23H36V25H38V27H39V33H37V36H33V37H18V36H14V34H11V29H12V26H15V24H19V22H23Z" />
          <path fill="#d3c8b3" d="M13 33L16 34L20 35H32L36 33H37V36H33V37H18V36H14V34H13Z" />
          <path d="M17 35H22V39L21 40H18L17 39ZM30 35H35V39L34 40H31L30 39Z" />
          <path fill="#d3c8b3" d="M18 39H21V40H18ZM31 39H34V40H31Z" />
          <g className="puff-glance">
            <g className="puff-eyes" fill="#282723">
              <path d="M19 28H21V30H19ZM29 28H31V30H29Z" />
            </g>
          </g>
          <g fill="none" strokeWidth="1" strokeLinejoin="miter" transform="translate(.5 .5)">
            <path
              stroke="#c9c5b9"
              d="M7 28V20H8V16H10V13H13V11H17V9H23V8H34V9H38V11H41V14H43V18H44V28H43V31H41V33"
            />
            <path stroke="#d3c8b3" d="M7 27V31H9V33H13V34H18V35H32V34H38V33H41V31H43V28" />
          </g>
          <path fill="#f7efd9" d="M35 12H38V13H40V16H37V13H35ZM41 19H42V20H41Z" />
        </g>
        <g fill="#e9be76" className="puff-star puff-star-left">
          <path className="puff-star-cross" d="M2 27H5V28H2ZM3 26H4V29H3Z" />
          <path
            className="puff-star-sparks"
            d="M1 25H2V26H1ZM5 25H6V26H5ZM1 29H2V30H1ZM5 29H6V30H5Z"
          />
        </g>
        <g fill="#e9be76" className="puff-star puff-star-right">
          <path className="puff-star-cross" d="M51 15H54V16H51ZM52 14H53V17H52Z" />
          <path
            className="puff-star-sparks"
            d="M50 13H51V14H50ZM54 13H55V14H54ZM50 17H51V18H50ZM54 17H55V18H54Z"
          />
        </g>
      </svg>
      <output className="puff-greeting">{curious ? 'Hello!' : ''}</output>
    </button>
  );
}
