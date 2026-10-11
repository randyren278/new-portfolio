'use client';

/**
 * SVG charts for the training page. Each one measures its container and
 * draws at that exact width, so axis text stays crisp at every size.
 * Marks follow the site's palette: --accent for the thing the chart is
 * about, a dim neutral for context, text always in text colours.
 */

import { type PointerEvent, useEffect, useRef, useState } from 'react';
import type { CorosLoadDay } from '../coros/parse';
import {
  type Night,
  type Session,
  type Week,
  type WeekDay,
  clock,
  fmtDay,
  fmtDow,
  hm,
  km1,
  pace,
  shift,
  weekday,
} from '../derive';
import { useTip } from './tip';

export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.round(el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

const AX = { fill: 'var(--muted)', fontSize: 10 } as const;
const GRID = { stroke: 'rgba(var(--ink-rgb) / 0.08)', strokeWidth: 1 } as const;
const DIM = 'var(--data-dim)';
const CONTEXT = 'rgba(var(--ink-rgb) / 0.32)';

/** Column with a 4px rounded data end, square at the baseline. */
function colTop(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0 || w <= 0) return '';
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

const line = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');

/** Nearest-index crosshair over a shared x scale. */
function useCrosshair(n: number, xOf: (i: number) => number, tipFor: (i: number) => string[]) {
  const tip = useTip();
  const [idx, setIdx] = useState<number | null>(null);
  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const px = e.clientX - box.left;
    let best = 0;
    for (let i = 1; i < n; i++) if (Math.abs(xOf(i) - px) < Math.abs(xOf(best) - px)) best = i;
    setIdx(best);
    tip.show(tipFor(best), e.clientX, e.clientY);
  };
  const onLeave = () => {
    setIdx(null);
    tip.hide();
  };
  return { idx, onMove, onLeave };
}

// ------------------------------------------------------------- load

const loadComment = (c: string | null) => (/excessive|over/i.test(c ?? '') ? 'var(--accent)' : DIM);

export function LoadChart({
  days,
  dayTips,
}: { days: CorosLoadDay[]; dayTips: Map<string, string> }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const n = days.length;
  const ml = 30;
  const mr = 92;
  const mt = 8;
  const H1 = 170;
  const gap = 30;
  const H2 = 64;
  const mb = 22;
  const H = mt + H1 + gap + H2 + mb;
  const iw = Math.max(1, W - ml - mr);
  const x = (i: number) => ml + (n > 1 ? (i * iw) / (n - 1) : iw / 2);
  const cross = useCrosshair(n, x, (i) => {
    const d = days[i];
    return [
      fmtDow(d.date),
      `${d.comment ?? '—'} · ratio ${d.ratio.toFixed(2)}`,
      `Short-term ${d.shortTerm} · long-term ${d.longTerm}`,
      dayTips.get(d.date) ?? 'Rest',
    ];
  });
  if (W < 160 || !n) return <div ref={ref} className="chart" style={{ height: H }} />;

  const ymax = Math.ceil(Math.max(...days.map((d) => Math.max(d.shortTerm, d.longTerm))) / 40) * 40;
  const y = (v: number) => mt + H1 - (v / ymax) * H1;
  const rmax = Math.max(1.6, Math.ceil(Math.max(...days.map((d) => d.ratio)) * 10) / 10);
  const r0 = mt + H1 + gap + H2;
  const ry = (v: number) => r0 - (v / rmax) * H2;
  const last = days[n - 1];
  const st = line(days.map((d, i) => [x(i), y(d.shortTerm)]));
  const lt = line(days.map((d, i) => [x(i), y(d.longTerm)]));

  // End labels: keep 30px apart, leader lines back to the dots.
  let ys = y(last.shortTerm);
  let yl = y(last.longTerm);
  if (Math.abs(ys - yl) < 30) {
    const mid = (ys + yl) / 2;
    const s = ys < yl ? -1 : 1;
    ys = mid + (s * 30) / 2;
    yl = mid - (s * 30) / 2;
  }
  const lx = ml + iw + 14;
  const ticks: number[] = [];
  for (let i = n - 1; i >= 0; i -= 7) ticks.push(i);
  const bw = Math.max(2, iw / n - 3);

  return (
    <div ref={ref} className="chart">
      <svg width={W} height={H} data-crosshair="" aria-hidden="true">
        {[0, ymax / 2, ymax].map((v) => (
          <g key={v}>
            <line x1={ml} x2={ml + iw} y1={y(v)} y2={y(v)} {...GRID} />
            <text x={ml - 8} y={y(v) + 3} textAnchor="end" {...AX}>
              {v}
            </text>
          </g>
        ))}
        {ticks.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" {...AX}>
            {fmtDay(days[i].date)}
          </text>
        ))}
        <path d={`${lt}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill="rgba(var(--ink-rgb) / 0.07)" />
        <path d={lt} fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinejoin="round" />
        <path d={st} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
        <circle
          cx={x(n - 1)}
          cy={y(last.longTerm)}
          r={4}
          fill="var(--ink)"
          stroke="var(--bg)"
          strokeWidth={2}
        />
        <circle
          cx={x(n - 1)}
          cy={y(last.shortTerm)}
          r={4}
          fill="var(--accent)"
          stroke="var(--bg)"
          strokeWidth={2}
        />
        {(
          [
            [ys, y(last.shortTerm), 'SHORT-TERM', last.shortTerm],
            [yl, y(last.longTerm), 'LONG-TERM', last.longTerm],
          ] as const
        ).map(([yy, yd, label, v]) => (
          <g key={label}>
            <line
              x1={ml + iw + 6}
              y1={yd}
              x2={lx - 2}
              y2={yy - 4}
              stroke="rgba(var(--ink-rgb) / 0.25)"
            />
            <text x={lx} y={yy - 6} {...AX}>
              {label}
            </text>
            <text x={lx} y={yy + 9} fill="var(--ink)" fontSize={13}>
              {v}
            </text>
          </g>
        ))}

        <text x={ml} y={r0 - H2 - 10} {...AX} letterSpacing={1}>
          LOAD RATIO
        </text>
        {[1, 1.5].map((v) => (
          <g key={v}>
            <line x1={ml} x2={ml + iw} y1={ry(v)} y2={ry(v)} {...GRID} />
            <text x={ml - 8} y={ry(v) + 3} textAnchor="end" {...AX}>
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {days.map((d, i) => (
          <path
            key={d.date}
            d={colTop(x(i) - bw / 2, ry(d.ratio), bw, r0 - ry(d.ratio), 2)}
            fill={loadComment(d.comment)}
          />
        ))}
        <line x1={ml} x2={ml + iw} y1={r0} y2={r0} stroke="var(--rule)" />
        <text x={lx} y={ry(last.ratio) - 2} {...AX}>
          RATIO
        </text>
        <text x={lx} y={ry(last.ratio) + 13} fill="var(--ink)" fontSize={13}>
          {last.ratio.toFixed(2)}
        </text>

        {cross.idx != null && (
          <line
            x1={x(cross.idx)}
            x2={x(cross.idx)}
            y1={mt}
            y2={r0}
            stroke="rgba(var(--ink-rgb) / 0.35)"
            pointerEvents="none"
          />
        )}
        <rect
          x={ml}
          y={mt}
          width={iw}
          height={r0 - mt}
          fill="transparent"
          onPointerMove={cross.onMove}
          onPointerDown={cross.onMove}
          onPointerLeave={cross.onLeave}
        />
      </svg>
    </div>
  );
}

// -------------------------------------------------------- this week

export function WeekBars({ days, today }: { days: WeekDay[]; today: string }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const H = 96;
  const mt = 16;
  const mb = 18;
  const ih = H - mt - mb;
  if (W < 160) return <div ref={ref} className="chart" style={{ height: H + 2 }} />;
  const step = W / 7;
  const bw = Math.min(24, step * 0.5);
  const vmax = Math.max(20, ...days.map((d) => d.km));
  return (
    <div ref={ref} className="chart">
      <svg width={W} height={H + 2} aria-hidden="true">
        {days.map((d, i) => {
          const cx = step * i + step / 2;
          const h = (d.km / vmax) * ih;
          const isToday = d.date === today;
          return (
            <g key={d.date}>
              <text
                x={cx}
                y={H - 3}
                textAnchor="middle"
                fontSize={10}
                fill={isToday ? 'var(--ink)' : 'var(--muted)'}
              >
                {weekday(d.date)[0]}
              </text>
              {isToday && (
                <line
                  x1={cx - 6}
                  x2={cx + 6}
                  y1={H}
                  y2={H}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              )}
              {d.state === 'future' && <circle cx={cx} cy={mt + ih - 2} r={2} fill="var(--rule)" />}
              {(d.state === 'run' || d.state === 'ride') && (
                <>
                  <path
                    d={colTop(cx - bw / 2, mt + ih - h, bw, h)}
                    fill={d.quality ? 'var(--accent)' : d.state === 'ride' ? DIM : CONTEXT}
                  />
                  <text
                    x={cx}
                    y={mt + ih - h - 5}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--ink)"
                  >
                    {km1(d.km)}
                  </text>
                  <rect
                    x={cx - step / 2}
                    y={0}
                    width={step}
                    height={H}
                    fill="transparent"
                    data-tip={`${fmtDow(d.date)}|${d.title}|${km1(d.km)} km · ${hm(d.sec)}${d.state === 'run' ? ` · ${pace(d.sec / d.km)} /km` : ''}`}
                  />
                </>
              )}
            </g>
          );
        })}
        <line x1={0} x2={W} y1={mt + ih} y2={mt + ih} stroke="var(--rule)" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------- session

export function SessionChart({
  session,
  threshold,
}: { session: Session; threshold: number | null }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const ml = 34;
  const mr = 8;
  const mt = 18;
  const H1 = 230;
  const mb = 20;
  const H = mt + H1 + mb;
  if (W < 160) return <div ref={ref} className="chart" style={{ height: H }} />;
  const iw = W - ml - mr;
  const total = session.laps.reduce((s, l) => s + l.sec, 0);
  const tx = (t: number) => ml + (t / total) * iw;

  // Pace as a dash per lap on a fixed fast→slow scale, never bars from
  // zero: from zero a 3:41 rep and a 3:14 rep look identical.
  const paces = session.laps.filter((l) => l.part !== 'rest' && l.km > 0).map((l) => l.sec / l.km);
  const pFast = Math.floor((Math.min(...paces) - 10) / 30) * 30;
  const pSlow = Math.ceil((Math.max(...paces) + 10) / 30) * 30;
  const y = (p: number) =>
    mt + ((Math.min(Math.max(p, pFast), pSlow) - pFast) / (pSlow - pFast)) * H1;
  const ticks: number[] = [];
  for (let p = pFast; p <= pSlow; p += 30) ticks.push(p);

  let t = 0;
  let repN = 0;
  const marks = session.laps.map((l, i) => {
    const x0 = tx(t);
    const x1 = tx(t + l.sec);
    t += l.sec;
    const p = l.km > 0 ? l.sec / l.km : 0;
    let tip: string;
    let label: string | null = null;
    if (l.part === 'rep') {
      repN++;
      const rep = session.reps[repN - 1];
      tip = `Rep ${repN}|${l.km.toFixed(2)} km · ${clock(l.sec)} · ${pace(p)} /km${l.watts ? `|${l.watts} W` : ''}`;
      if (repN === 1 || rep === session.reps[session.fastest]) label = pace(p);
    } else if (l.part === 'rest') tip = `Recovery|${clock(l.sec)}`;
    else
      tip = `${l.part === 'warmup' ? 'Warm-up' : 'Cool-down'}|${l.km.toFixed(2)} km · ${pace(p)} /km`;
    return { i, l, x0, x1, p, tip, label };
  });
  return (
    <div ref={ref} className="chart">
      <svg width={W} height={H} aria-hidden="true">
        <text x={ml} y={mt - 6} {...AX}>
          PACE /KM
        </text>
        {ticks.map((p) => (
          <g key={p}>
            <line x1={ml} x2={ml + iw} y1={y(p)} y2={y(p)} {...GRID} />
            <text x={ml - 6} y={y(p) + 3} textAnchor="end" {...AX}>
              {pace(p)}
            </text>
          </g>
        ))}
        {threshold && threshold > pFast && threshold < pSlow && (
          <g>
            <line
              x1={ml}
              x2={ml + iw}
              y1={y(threshold)}
              y2={y(threshold)}
              stroke="rgba(var(--ink-rgb) / 0.3)"
            />
            <text x={ml + iw} y={y(threshold) + 13} textAnchor="end" {...AX}>
              threshold {pace(threshold)}
            </text>
          </g>
        )}
        {marks.map((m) =>
          m.l.part === 'rest' || !m.l.km ? null : (
            <rect
              key={m.i}
              x={m.x0 + 1}
              y={y(m.p) - 4}
              width={Math.max(2, m.x1 - m.x0 - 2)}
              height={8}
              rx={4}
              fill={m.l.part === 'rep' ? 'var(--accent)' : DIM}
            />
          ),
        )}
        {marks.map((m) =>
          m.label ? (
            <text
              key={`l${m.i}`}
              x={(m.x0 + m.x1) / 2}
              y={y(m.p) - 9}
              textAnchor="middle"
              fontSize={10}
              fill="var(--ink)"
            >
              {m.label}
            </text>
          ) : null,
        )}
        {Array.from({ length: Math.floor(total / 60 / 20) + 1 }, (_, k) => k * 20).map((m) => (
          <text key={m} x={tx(m * 60)} y={H - 4} textAnchor={m ? 'middle' : 'start'} {...AX}>
            {m}′
          </text>
        ))}
        {marks.map((m) => (
          <rect
            key={`h${m.i}`}
            x={m.x0}
            y={mt}
            width={Math.max(4, m.x1 - m.x0)}
            height={H1}
            fill="transparent"
            data-tip={m.tip}
          />
        ))}
      </svg>
    </div>
  );
}

// ----------------------------------------------------------- volume

export function VolumeChart({ weeks }: { weeks: Week[] }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const ml = 28;
  const mr = 4;
  const mt = 20;
  const H1 = 150;
  const mb = 24;
  const H = mt + H1 + mb;
  if (W < 160 || !weeks.length) return <div ref={ref} className="chart" style={{ height: H }} />;
  const iw = W - ml - mr;
  const vmax = Math.max(20, Math.ceil(Math.max(...weeks.map((w) => w.runKm)) / 20) * 20);
  const y = (v: number) => mt + H1 - (v / vmax) * H1;
  const step = iw / weeks.length;
  const bw = Math.min(24, step * 0.6);
  const full = weeks.filter((w) => !w.partial);
  const lastFull = full[full.length - 1];
  const every = step < 46 ? 3 : 2;
  return (
    <div ref={ref} className="chart">
      <svg width={W} height={H} aria-hidden="true">
        <defs>
          <pattern
            id="tr-hatch"
            patternUnits="userSpaceOnUse"
            width={5}
            height={5}
            patternTransform="rotate(45)"
          >
            <line x1={0} y1={0} x2={0} y2={5} stroke="var(--accent)" strokeWidth={2} />
          </pattern>
        </defs>
        <text x={ml} y={mt - 8} {...AX}>
          KM / WEEK
        </text>
        {[0, vmax / 2, vmax].map((v) => (
          <g key={v}>
            <line x1={ml} x2={ml + iw} y1={y(v)} y2={y(v)} {...GRID} />
            <text x={ml - 6} y={y(v) + 3} textAnchor="end" {...AX}>
              {v}
            </text>
          </g>
        ))}
        {weeks.map((w, i) => {
          const cx = ml + step * i + step / 2;
          const fill = w.partial ? 'url(#tr-hatch)' : w === lastFull ? 'var(--accent)' : CONTEXT;
          return (
            <g key={w.start}>
              <path d={colTop(cx - bw / 2, y(w.runKm), bw, y(0) - y(w.runKm))} fill={fill} />
              {(w === lastFull || w.partial) && (
                <text x={cx} y={y(w.runKm) - 6} textAnchor="middle" fontSize={10} fill="var(--ink)">
                  {Math.round(w.runKm)}
                </text>
              )}
              {(weeks.length - 1 - i) % every === 0 && (
                <text x={cx} y={H - 6} textAnchor="middle" {...AX}>
                  {w.partial ? 'NOW' : fmtDay(w.start)}
                </text>
              )}
              <rect
                x={cx - step / 2}
                y={mt}
                width={step}
                height={H1}
                fill="transparent"
                data-tip={`${fmtDay(w.start)} – ${fmtDay(shift(w.start, 6))}${w.partial ? ' (so far)' : ''}|${km1(w.runKm)} km · ${w.runs} runs · ${hm(w.runSec)}${w.rideKm > 1 ? `|+ ${km1(w.rideKm)} km on the bike` : ''}`}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// --------------------------------------------------------- recovery

type Panel = {
  key: 'hrv' | 'sleep';
  label: string;
  value: (n: Night) => number | null;
  base: (n: Night) => number | null;
  flag: (n: Night) => boolean;
  bars?: boolean;
};

export function RecoveryChart({
  nights,
  sleepBase,
  dayTips,
}: {
  nights: Night[];
  sleepBase: number | null;
  dayTips: Map<string, string>;
}) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const n = nights.length;
  const ml = 4;
  const mr = 46;
  const rowH = 52;
  const gap = 28;
  const top = 16;
  const mb = 20;
  const H = top + 2 * rowH + gap + mb;
  const iw = Math.max(1, W - ml - mr);
  const x = (i: number) => ml + (n > 1 ? (i * iw) / (n - 1) : 0);
  const cross = useCrosshair(n, x, (i) => {
    const d = nights[i];
    return [
      fmtDow(d.date),
      `HRV ${d.hrv ?? '—'} ms${d.baseline ? ` (base ${d.baseline})` : ''}${d.hrvStatus ? ` · ${d.hrvStatus}` : ''}`,
      `Sleep score ${d.sleep ?? '—'}`,
      `Day before: ${dayTips.get(shift(d.date, -1)) ?? 'rest'}`,
    ];
  });
  if (W < 160 || !n) return <div ref={ref} className="chart" style={{ height: H }} />;

  const panels: Panel[] = [
    {
      key: 'hrv',
      label: 'HRV · MS',
      value: (d) => d.hrv,
      base: (d) => d.baseline,
      flag: (d) => /low/i.test(d.hrvStatus ?? ''),
    },
    {
      key: 'sleep',
      label: 'SLEEP SCORE',
      value: (d) => d.sleep,
      base: () => sleepBase,
      flag: (d) => (d.sleep ?? 100) < 65,
      bars: true,
    },
  ];
  const ticks = [0, 7, 14, n - 1].filter((i, k, a) => i < n && a.indexOf(i) === k);

  return (
    <div ref={ref} className="chart">
      <svg width={W} height={H} data-crosshair="" aria-hidden="true">
        {panels.map((p, k) => {
          const y0 = top + k * (rowH + gap);
          const vals = nights.map(p.value).filter((v): v is number => v != null);
          const bases = nights.map(p.base).filter((v): v is number => v != null);
          if (!vals.length) return null;
          const lo = p.bars ? 0 : Math.min(...vals, ...bases) - 4;
          const hi = p.bars ? 100 : Math.max(...vals, ...bases) + 4;
          const y = (v: number) => y0 + rowH - ((v - lo) / (hi - lo)) * rowH;
          const cur = [...nights].reverse().find((d) => p.value(d) != null);
          const curV = cur ? (p.value(cur) as number) : null;
          const basePts = nights
            .map((d, i) => [i, p.base(d)] as const)
            .filter((e): e is readonly [number, number] => e[1] != null)
            .map(([i, v]) => [x(i), y(v)] as [number, number]);
          const valPts = nights
            .map((d, i) => [i, p.value(d)] as const)
            .filter((e): e is readonly [number, number] => e[1] != null)
            .map(([i, v]) => [x(i), y(v)] as [number, number]);
          const bw = Math.max(2, iw / n - 3);
          const lastBase = basePts[basePts.length - 1];
          return (
            <g key={p.key}>
              <text x={ml} y={y0 - 7} {...AX} letterSpacing={0.5}>
                {p.label}
              </text>
              {p.bars ? (
                nights.map((d, i) =>
                  d.sleep == null ? null : (
                    <path
                      key={d.date}
                      d={colTop(
                        x(i) - bw / 2,
                        y(d.sleep),
                        bw,
                        y(0) - y(d.sleep),
                        Math.min(3, bw / 2),
                      )}
                      fill={p.flag(d) ? 'var(--accent)' : 'rgba(var(--ink-rgb) / 0.28)'}
                    />
                  ),
                )
              ) : (
                <>
                  {basePts.length > 1 && (
                    <path d={line(basePts)} fill="none" stroke="rgba(var(--ink-rgb) / 0.22)" />
                  )}
                  {basePts.length === 1 && null}
                  <path
                    d={line(valPts)}
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {nights.map((d, i) => {
                    const v = p.value(d);
                    if (v == null || !p.flag(d)) return null;
                    return (
                      <g key={d.date}>
                        <circle
                          cx={x(i)}
                          cy={y(v)}
                          r={4}
                          fill="var(--accent)"
                          stroke="var(--bg)"
                          strokeWidth={2}
                        />
                        <text x={x(i) + 8} y={y(v) + 4} {...AX}>
                          {v}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}
              {p.bars && p.base(nights[0]) != null && (
                <line
                  x1={ml}
                  x2={ml + iw}
                  y1={y(p.base(nights[0]) as number)}
                  y2={y(p.base(nights[0]) as number)}
                  stroke="rgba(var(--ink-rgb) / 0.4)"
                />
              )}
              {curV != null && (
                <text x={ml + iw + 10} y={y(curV) + 4} fill="var(--ink)" fontSize={13}>
                  {curV}
                </text>
              )}
              {lastBase && !p.bars && curV != null && (
                <text
                  x={ml + iw + 10}
                  y={
                    lastBase[1] +
                    (Math.abs(lastBase[1] - y(curV)) < 14 ? (lastBase[1] > y(curV) ? 16 : -10) : 4)
                  }
                  {...AX}
                >
                  base
                </text>
              )}
            </g>
          );
        })}
        {ticks.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 4}
            textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
            {...AX}
          >
            {fmtDay(nights[i].date)}
          </text>
        ))}
        {cross.idx != null && (
          <line
            x1={x(cross.idx)}
            x2={x(cross.idx)}
            y1={top}
            y2={H - mb}
            stroke="rgba(var(--ink-rgb) / 0.35)"
            pointerEvents="none"
          />
        )}
        <rect
          x={ml}
          y={top}
          width={iw}
          height={H - mb - top}
          fill="transparent"
          onPointerMove={cross.onMove}
          onPointerDown={cross.onMove}
          onPointerLeave={cross.onLeave}
        />
      </svg>
    </div>
  );
}

// ------------------------------------------------------------ small

export function Sparkline({ values, base }: { values: number[]; base: number | null }) {
  const w = 96;
  const h = 26;
  if (values.length < 2) return <svg width={w} height={h} aria-hidden="true" />;
  const lo = Math.min(...values, base ?? Number.POSITIVE_INFINITY);
  const hi = Math.max(...values, base ?? Number.NEGATIVE_INFINITY);
  const xs = (i: number) => 3 + (i * (w - 6)) / (values.length - 1);
  const ys = (v: number) => h - 3 - ((v - lo) / (hi - lo || 1)) * (h - 6);
  const n = values.length - 1;
  return (
    <svg width={w} height={h} aria-hidden="true">
      {base != null && (
        <line x1={0} x2={w} y1={ys(base)} y2={ys(base)} stroke="rgba(var(--ink-rgb) / 0.18)" />
      )}
      <path
        d={line(values.map((v, i) => [xs(i), ys(v)]))}
        fill="none"
        stroke="rgba(var(--ink-rgb) / 0.55)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={xs(n)}
        cy={ys(values[n])}
        r={3.5}
        fill="var(--accent)"
        stroke="var(--bg)"
        strokeWidth={2}
      />
    </svg>
  );
}

export function Ring({ pct }: { pct: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  return (
    <svg
      width={136}
      height={136}
      viewBox="0 0 136 136"
      role="img"
      aria-label={`Recovery ${pct} percent`}
    >
      <circle
        cx={68}
        cy={68}
        r={r}
        fill="none"
        stroke="rgba(var(--ink-rgb) / 0.1)"
        strokeWidth={8}
      />
      <circle
        cx={68}
        cy={68}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={`${((c * pct) / 100).toFixed(1)} ${c.toFixed(1)}`}
        transform="rotate(-90 68 68)"
      />
      <text
        x={68}
        y={74}
        textAnchor="middle"
        fontFamily="Instrument Serif, Georgia, serif"
        fontSize={50}
        fill="var(--ink)"
      >
        {pct}
      </text>
      <text x={68} y={94} textAnchor="middle" fontSize={9} letterSpacing={1} fill="var(--muted)">
        % RECOVERED
      </text>
    </svg>
  );
}
