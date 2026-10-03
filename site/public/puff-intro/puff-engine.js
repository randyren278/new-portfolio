/* Adapted Claude.dev public renderer. All character/vehicle artwork replaced by original Puff sprites. See SOURCES.md. */
/* Actual compiled module factory from https://claude.dev/_next/static/chunks/09vvvyoggmt1p.js.
   Original identifiers retained; Puff artwork substituted and optional kite cloud timing tuned. */
ReferenceModules.register(82742, a => {
    "use strict";
    let e;
    var l = a.i(93384);
    let i = { spacing: 12, rA: 1.8, rB: 3.2, color: "#7a7a7a" };
    function h(a) { return function () { a |= 0; let e = Math.imul((a = a + 0x6d2b79f5 | 0) ^ a >>> 15, 1 | a); return (((e = e + Math.imul(e ^ e >>> 7, 61 | e) ^ e) ^ e >>> 14) >>> 0) / 0x100000000; }; }
    function m(a, e, l) { let i = 0x165667b1 * a + 0x27d4eb2f * e + 69069 * l | 0; return i = Math.imul(i ^ i >>> 13, 0x4bf19f61), ((i ^= i >>> 16) >>> 0) / 0x100000000; }
    function t(a, e, l, i, h) { let m = Math.floor(h), t = h - m, k = b(a, e, l ^ Math.imul(m, 0x9e3779b1), i); return k + (b(a, e, l ^ Math.imul(m + 1, 0x9e3779b1), i) - k) * (t * t * (3 - 2 * t)); }
    function b(a, e, l, i) { let h = a / i, t = e / i, b = Math.floor(h), k = Math.floor(t), f = h - b, d = t - k; f = f * f * (3 - 2 * f), d = d * d * (3 - 2 * d); let n = m(b, k, l), c = m(b + 1, k, l), g = m(b, k + 1, l), j = m(b + 1, k + 1, l), o = n + (c - n) * f; return o + (g + (j - g) * f - o) * d; }
    function k(a, e) { return (a = (a % e + e) % e) > e / 2 ? a - e : a; }
    function f(a, e, l, i, h, t, f, d, n) { let c = null, g = { f: 0 }, j = 0; for (let a of e) {
        let e = k(i + h * a.speed - a.cx, l), m = a.cx + e, b = function (a, e, l) { let i = { f: -1 }; for (let h of a.structs) {
            let a = function (a, e, l) { if (l > a.baseline)
                return { f: -1 }; let i = -1; e >= a.xa && e <= a.xb ? i = a.rb : e < a.xa && e > a.xa - a.tailL ? i = a.rb * Math.pow(1 - (a.xa - e) / a.tailL, 1.5) : e > a.xb && e < a.xb + a.tailR && (i = a.rb * Math.pow(1 - (e - a.xb) / a.tailR, 1.5)); let h = -1, m = e, t = a.yc; if (i > 0) {
                let e = a.baseline - i;
                h = (i - Math.abs((l - e) * (l > e ? .35 : 1))) / a.rb, t = e;
            } for (let i of a.domes) {
                let a = e - i.x, b = (l - i.y) * (l > i.y ? .75 : 1), k = (i.r - Math.sqrt(a * a + b * b)) / i.r;
                k > h && (h = k, m = i.x, t = i.y);
            } return { f: h, ox: m, oy: t }; }(h, e, l);
            a.f > i.f && (i = a);
        } return i; }(a, m, t);
        b.f > g.f && (g = b, c = a, j = m);
    } if (!c)
        return 0; let o = Math.round(j / a.spacing), r = .02 + .14 * a.fray; if (g.f < r && m(o, f, 95 ^ a.seed) > Math.pow(g.f / r, 1.5))
        return 0; let p = j - g.ox, s = t - g.oy, u = Math.sqrt(p * p + s * s) || 1, w = (p /= u) * d + (s /= u) * n, x = Math.min(g.f, 1), y = .88 * b(o, f, a.seed, 3.2) + .12 * m(o, f, 40503 ^ a.seed), z = .88 - .4 * a.mix, q = (.5 * w + .5) * (x < .12 ? x / .12 : 1 - (x - .12) * .35) + (y - .5) * (.15 + .5 * a.dither) > z; return .008 > m(o, f, 44 ^ a.seed) && (q = !q), q ? 2 : 1; }
    function d(a) { let e = a.lightAng * Math.PI / 180; return [Math.cos(e), Math.sin(e)]; }
    function n(a) { let { w: e, h: l, fps: i, palette: h, base: m, deltas: t } = a, b = [], k = Uint8Array.from([...m].map(a => "." === a ? 255 : +a)); for (let a of (b.push(k.slice()), t)) {
        if (a)
            for (let e of a.split(",")) {
                let a = e.length - 1;
                k[parseInt(e.slice(0, a), 36)] = "." === e[a] ? 255 : +e[a];
            }
        b.push(k.slice());
    } return { w: e, h: l, fps: i, palette: h, frames: b, canvases: new Map }; }
    function c(a, e) { let l = document.createElement("canvas"); l.style.cssText = "display:block;width:100%;height:100%;", a.appendChild(l); let i = l.getContext("2d"), h = () => { let e = Math.min(2, devicePixelRatio || 1), h = a.getBoundingClientRect(); l.width = Math.max(1, h.width * e), l.height = Math.max(1, h.height * e), i.setTransform(e, 0, 0, e, 0, 0); }; return h(), new ResizeObserver(() => { h(), e && e(); }).observe(a), { c: l, ctx: i }; }
    function g(a, e, l, i, h) { let m = i.spacing, t = e % m / 2, b = l % m / 2; a.clearRect(0, 0, e, l), a.fillStyle = i.color; for (let k = 0, f = b; f <= l; f += m, k++)
        for (let l = 0, b = t; b <= e; b += m, l++) {
            let e = h(b, f, l, k);
            if (!e)
                continue;
            let m = 2 === e ? i.rB : i.rA;
            a.beginPath(), a.arc(b, f, m, 0, 6.2832), a.fill();
        } }
    function j(a) { let e = 0, l = String(a); for (let a = 0; a < l.length; a++)
        e = 31 * e + l.charCodeAt(a) >>> 0; return e || 1; }
    function o(a) { let e = h(0x9e3779b1 * a.seed >>> 0 || 1), l = 220 * Math.min(a.scale, 1.5), i = a.W + 2 * l, m = [], t = [], b = a.spacing, f = a.H % b / 2; for (let h = 0; h < a.count; h++) {
        let d = a.scale * (.7 + .8 * e()), n = Math.max((100 + 150 * e()) * d, 10 * b), c = 0, g = .6 * a.H, j = i / a.count;
        for (let m = 0; m < 16; m++) {
            c = -l + (h + .1 + .8 * e()) * j, g = (.2 + .6499999999999999 * e()) * a.H;
            let m = !0;
            for (let a of t) {
                let e = k(c - a.cx, i), l = (g - a.baseline) * 1.6;
                if (Math.sqrt(e * e + l * l) < (n + a.w) * .48) {
                    m = !1;
                    break;
                }
            }
            if (m)
                break;
        }
        t.push({ cx: c, baseline: g, w: n }), g = f + Math.round((g - f) / b) * b + .5, m.push({ cx: c, speed: .85 + .3 * e(), structs: [function (a, e, l, i, h) { let m = h * (.085 + .035 * a()), t = i - m, b = h * (.1 + .16 * a()) * (.25 > a() ? 2.2 : 1), k = h * (.1 + .16 * a()) * (.25 > a() ? 2.2 : 1), f = [], d = 3 + Math.floor(3 * a()), n = .25 + .5 * a(), c = 1.3 + 1.1 * a(), g = .8 + .5 * a(); .15 > a() && (g *= .55); for (let i = 0; i < d; i++) {
                    let b = (i + .5) / d + (a() - .5) * (.5 / d), k = Math.max(0, 1 - Math.pow(Math.abs(b - n) * c, 1.25)), j = h * (.06 + (.09 + .11 * e.puff) * k * g + .02 * a());
                    f.push({ x: l - h / 2 + b * h, y: t - m * (.5 + .55 * a()), r: j });
                } return { xa: l - h / 2 + m, xb: l + h / 2 - m, yc: t, rb: m, baseline: i, domes: f, tailL: b, tailR: k }; }(e, a, c, g, n)] });
    } return { clouds: m, period: i }; }
    let r = { spacing: i.spacing, rA: i.rA, rB: i.rB, color: i.color, count: 5, scale: 1, puff: .5, fray: .5, lightAng: 240, mix: .5, dither: .4 }, p = { spacing: i.spacing, rA: i.rA, rB: i.rB, color: i.color, texGrain: 1, texDensity: .55, texMix: .5 };
    function s(a, e = {}) { let i = () => { }, { c: h, ctx: k } = c(a, () => i()), f = { ...p, ...e, seed: j(e.seed ?? "tex") }, d = e.clearRef || null, n = e.excludeRef || null, o = e.scrollRef || null, r = e.edgeFray || 0, u = 0, w, x = !1, y = 0; if ((i = () => { let a = function (a, e = 0) { let l = 32343 ^ a.seed, i = 12 * a.texGrain; return (h, k, f, d) => { let n = b(f, d, 273 ^ l, i), c = t(f, d, 546 ^ l, .63 * i, .5 * e), g = (.74 * (n < .38 ? t(f / 9, d / 1.3, 819 ^ l, 1, e) : n < .52 ? t(f / 1.3, d / 9, 1092 ^ l, 1, e) : n < .62 ? t((f + d) / 7, (f - d) / 1.4, 1365 ^ l, 1, e) : t(f, d, 1638 ^ l, 2.6, e)) + .2 * m(f, d, 2184 ^ l)) * (.12 + 1.15 * Math.pow(c, 1.5)), j = .62 - .42 * a.texDensity, o = j + .34 - .22 * a.texMix; return g < j ? 0 : g >= o ? 2 : 1; }; }(f, u), e = o ? Math.round(o.y / f.spacing) : 0, l = h.clientWidth, i = h.clientHeight; g(k, l, i, f, (h, t, b, k) => { if (r) {
        let a = Math.min(h, t, l - h, i - t);
        if (a < 0 || a < r && m(b, k, 94) > Math.pow(a / r, 1.2))
            return 0;
    } if (k += e, n) {
        let a = n(h, t);
        if (2 === a || 1 === a && .72 > m(b, k, 119))
            return 0;
    } if (d && d.r > 0) {
        let a = Math.hypot(h - d.x, t - d.y);
        if (a < .45 * d.r || a < d.r && m(b, k, 119 ^ f.seed) > (a - .45 * d.r) / (.55 * d.r))
            return 0;
    } return a(h, t, b, k); }); })(), !l.reducedMotion && e.morph) {
        let a = 1e3 / (e.fps || 5), l = .05 * (e.fps ? 5 / e.fps : 1), h = e => { x || (e - y > a && (u += l, y = e, i()), w = requestAnimationFrame(h)); };
        w = requestAnimationFrame(h);
    } return { stop() { x = !0, cancelAnimationFrame(w); }, rerender: i }; }
    let u = PuffPixels.make('rides'), w = PuffPixels.make('space'), x = PuffPixels.make('pool');
    x.loopLen = x.frames.length, x.rest = 43;
    let y = PuffPixels.make('kite');
    function z(a, e) { if (a.canvases.has(e))
        return a.canvases.get(e); let l = document.createElement("canvas"); l.setAttribute("aria-hidden", "true"), l.width = a.w, l.height = a.h; let i = l.getContext("2d"), h = i.createImageData(a.w, a.h), m = a.frames[e]; for (let e = 0; e < m.length; e++) {
        if (255 === m[e])
            continue;
        let l = a.palette[m[e]], i = parseInt(l.slice(1, 3), 16), t = parseInt(l.slice(3, 5), 16), b = parseInt(l.slice(5, 7), 16);
        h.data[4 * e] = i, h.data[4 * e + 1] = t, h.data[4 * e + 2] = b, h.data[4 * e + 3] = 255;
    } return i.putImageData(h, 0, 0), a.canvases.set(e, l), l; }
    let q = { Agents: "orbit", "Applied AI": "signal", Engineering: "structure", Playbooks: "steps", Skills: "spark", Tutorials: "path", Announcements: "burst" };
    function v(a, e = {}) { let k = () => { }, { c: f, ctx: d } = c(a, () => k()), n = e.slug || e.seed || "post", o = e.cat || "Engineering", r = { spacing: e.spacing ?? i.spacing, rA: e.rA ?? i.rA, rB: e.rB ?? i.rB, color: e.color ?? i.color }, p = e.tt0 || 0, s, u = !1, w = 0; if ((k = () => { let a = function ({ seed: a, cat: e, tt: l = 0 }) { let i = j(a), k = h(i), f = q[e] || ["orbit", "signal", "structure", "steps", "spark", "path", "burst"][i % 7], d = 3 * k() | 0, n = .5 + 1.05 * k(), c = .22 > k(), g = .28 > k(), o = (k() - .5) * .26, r = k(), p = r < .45 ? "none" : r < .6 ? "horizon" : r < .8 ? "ticks" : "mini", s = k(), u = s < .3 ? "none" : s < .55 ? "sparse" : s < .75 ? "gradient" : s < .9 ? "band" : "half", w = Math.cos(6.283 * k()), x = Math.sin(6.283 * k()), y = 6.283 * k(), z = Math.cos(y), v = Math.sin(y), M = (k() - .5) * .5, A = .1 + .14 * k(), R = .18 > k(), I = R ? Array.from({ length: 2 + (3 * k() | 0) }, () => ({ dx: (k() - .5) * .62, dy: (k() - .5) * .5, sc: .3 + .26 * k() })) : [{ dx: 0, dy: 0, sc: 1 }], P = !R && .22 > k(), F = .5 > k() ? .2 : .8, L = .5 > k() ? .26 : .74, T = (k() - .5) * .6, C = (k() - .5) * .5, S = .1 + .3 * k(), E = (k() - .5) * 1.2, B = .5 + (k() - .5) * .3, W = .5 + (k() - .5) * .24, H = Math.cos(E), D = Math.sin(E), O = 95 ^ i, $ = 40503 ^ i, V = { ringR: .2 + .14 * k(), ringTh: .04 + .035 * k(), ring2: .55 + .35 * k(), sats: 1 + (4 * k() | 0), satA: k() * Math.PI * 2, satR: .024 + .026 * k(), arcs: 2 + (3 * k() | 0), arcFill: .45 + .3 * k(), nucleus: .7 > k(), beamA: k() * Math.PI, beamW: .04 + .06 * k(), ramp: .4 + +k(), beam2A: k() * Math.PI, waveAmp: .05 + .09 * k(), waveFreq: 4 + 5 * k(), frames: 2 + (2 * k() | 0), fw: .14 + .12 * k(), fh: .1 + .12 * k(), gap: .06 + .05 * k(), hatchQ: 4 * k() | 0, hatchDir: .5 > k(), gridN: 2 + (2 * k() | 0), gridM: 3 + (3 * k() | 0), denseCell: k(), bracketL: .08 + .07 * k(), steps: 3 + (5 * k() | 0), stepUp: .5 > k() ? 1 : -1, stepH: .04 + .04 * k(), riserFill: .5 > k(), spokes: 5 + (6 * k() | 0), spokeL: .24 + .2 * k(), spokeW: .12 + .14 * k(), hole: .04 + .05 * k(), altSpokes: .5 > k(), spark2: .3 + .25 * k(), wps: 2 + (3 * k() | 0), pathTh: .03 + .025 * k(), branchAt: .3 + .4 * k(), rays: 6 + (8 * k() | 0), rayL: .3 + .2 * k(), sparkles: .005 + .01 * k(), ringGapA: k() * Math.PI * 2, ripples: 2 + (3 * k() | 0), ground: .012 + .04 * k() }, Y = [[-.42, .28 + (k() - .5) * .2]]; for (let a = 0; a < V.wps; a++)
        Y.push([-.42 + .84 * (a + 1) / (V.wps + 1), (k() - .5) * .55]); Y.push([.42, -.28 + (k() - .5) * .2]); let U = [Y[Math.max(1, Y.length * V.branchAt | 0)], [.3 + .14 * k(), .34 + .1 * k()]], G = (a, e, l, i) => { let h = i[0] - l[0], m = i[1] - l[1], t = Math.max(0, Math.min(1, ((a - l[0]) * h + (e - l[1]) * m) / (h * h + m * m || 1))); return Math.hypot(a - (l[0] + t * h), e - (l[1] + t * m)); }; return (a, e, h, k, j, r) => { let s = Math.min(j, r) * n, y = (a - j * (P ? F : B)) / s, q = (e - r * (P ? L : W)) / s, R = y * H - q * D, E = y * D + q * H, N = (a, e) => { let t = -1; if ("orbit" === f) {
        let i = Math.hypot(a, e), h = Math.atan2(e, a);
        if (0 === d) {
            t = Math.max(t, 1 - Math.abs(i - V.ringR) / V.ringTh);
            for (let i = 0; i < V.sats; i++) {
                let h = V.satA + i * Math.PI * 2 / V.sats + .25 * l;
                t = Math.max(t, 1.6 * (1 - Math.hypot(a - Math.cos(h) * V.ringR, e - Math.sin(h) * V.ringR) / V.satR));
            }
            V.nucleus && (t = Math.max(t, 1.2 * (1 - i / .045)));
        }
        else if (1 === d) {
            t = Math.max(t = Math.max(t, 1 - Math.abs(i - V.ringR) / (.6 * V.ringTh)), 1 - Math.abs(i - V.ringR * (1 + V.ring2)) / (.5 * V.ringTh));
            let h = V.satA + .2 * l;
            t = Math.max(t, 1.6 * (1 - Math.hypot(a - Math.cos(h) * V.ringR * (1 + V.ring2), e - Math.sin(h) * V.ringR * (1 + V.ring2)) / V.satR)), V.nucleus && (t = Math.max(t, -(i / .08 * .2)));
        }
        else {
            (h + Math.PI) / (2 * Math.PI) * V.arcs * 2 % 2 < 2 * V.arcFill && (t = Math.max(t, 1 - Math.abs(i - V.ringR) / V.ringTh));
            let l = V.satA, m = Math.cos(l) * V.ringR, b = Math.sin(l) * V.ringR;
            t = Math.max(t, 1.4 * (1 - Math.hypot(a - m, e - b) / (2.2 * V.satR))), Math.hypot(a - m, e - b) < 3.4 * V.satR && (t = Math.max(t, -.2));
        }
    }
    else if ("signal" === f) {
        let m = a * Math.cos(V.beamA) + e * Math.sin(V.beamA), f = -a * Math.sin(V.beamA) + e * Math.cos(V.beamA);
        if (0 === d)
            t = Math.max(t, 1 - Math.abs(f) / V.beamW), b(h, k, i, 2.6) < (m + .5) * V.ramp - .35 && (t = Math.max(t, -.3));
        else if (1 === d) {
            let l = -a * Math.sin(V.beam2A) + e * Math.cos(V.beam2A);
            t = Math.max(t = Math.max(t, 1 - Math.abs(f) / (.8 * V.beamW)), 1 - Math.abs(l) / (.55 * V.beamW)), .06 > Math.hypot(a, e) && (t = Math.max(t, 1.2));
        }
        else {
            let a = Math.sin(m * V.waveFreq + l) * V.waveAmp;
            t = Math.max(t = Math.max(t, 1 - Math.abs(f - a) / (.7 * V.beamW)), .4 - Math.abs(f - 2.2 * a) / (2.4 * V.beamW));
        }
    }
    else if ("structure" === f)
        if (0 === d) {
            for (let l = 0; l < V.frames; l++) {
                let i = V.fw + l * V.gap, h = V.fh + l * V.gap, m = Math.abs(a) - i, b = Math.abs(e) - h;
                .03 > Math.max(m, b) && .027 > Math.abs(Math.max(m, b)) && (t = Math.max(t, 1 - Math.abs(Math.max(m, b)) / .027));
            }
            (V.hatchQ % 2 == 0 ? a > 0 : a < 0) && (V.hatchQ < 2 ? e > 0 : e < 0) && Math.abs(a) < V.fw && Math.abs(e) < V.fh && (V.hatchDir ? h + k : h - k) % 3 == 0 && (t = Math.max(t, -.2));
        }
        else if (1 === d) {
            let l = .6 / V.gridM, i = .44 / V.gridN, h = Math.floor((a + .3) / l), m = Math.floor((e + .22) / i);
            if (h >= 0 && h < V.gridM && m >= 0 && m < V.gridN) {
                let b = (a + .3) % l, k = (e + .22) % i;
                (b < .022 || k < .022 || l - b < .022 || i - k < .022) && (t = Math.max(t, .8)), h === (V.denseCell * V.gridM | 0) && m === (7 * V.denseCell | 0) % V.gridN && (t = Math.max(t, 1));
            }
        }
        else {
            let l = V.bracketL;
            for (let [i, h] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                let m = a - .3 * i, b = e - .24 * h;
                (.026 > Math.abs(m) && h * b <= 0 && Math.abs(b) < l || .026 > Math.abs(b) && i * m <= 0 && Math.abs(m) < l) && (t = Math.max(t, 1));
            }
            let i = Math.abs(a) - .5 * V.fw, m = Math.abs(e) - .5 * V.fh;
            .024 > Math.max(i, m) && .024 > Math.abs(Math.max(i, m)) && (t = Math.max(t, 1)), 0 > Math.max(i, m) && (h + k) % 2 == 0 && (t = Math.max(t, -.2));
        }
    else if ("steps" === f) {
        let l = Math.floor((a + .42) / (.84 / V.steps));
        if (l >= 0 && l < V.steps) {
            let a = .26 - ((0 === d ? V.stepUp > 0 ? l : V.steps - 1 - l : 1 === d ? 2 * Math.abs(l - (V.steps - 1) / 2) | 0 : ((V.steps - 1) / 2 - Math.abs(l - (V.steps - 1) / 2)) * 2 | 0) + 1) * V.stepH;
            e > a && e < .3 && (e - a < .03 ? t = Math.max(t, 1) : V.riserFill ? t = Math.max(t, -.2) : (h + k) % 3 == 0 && (t = Math.max(t, -.25)));
        }
    }
    else if ("spark" === f) {
        let l = (a, e, l, i, h) => { let m = Math.hypot(a, e), t = Math.atan2(e, a); if (m < V.hole * l || m > V.spokeL * l)
            return -1; let b = 2 * Math.abs((t + h) / (2 * Math.PI) * i % 1 - .5), k = V.spokeL * l; if (1 === d && ((t + h) / (2 * Math.PI) * i | 0) % 2 && (k *= .55), m > k)
            return -1; let f = V.spokeW * (1 - m / k); return 1 - b < 3 * f ? 1 - (1 - (1 - b)) / (3 * f) : m < .6 * k ? -.35 : -1; };
        t = Math.max(t, l(a, e, 1, V.spokes, 0)), 1 === d && .012 > Math.abs(Math.hypot(a, e) - 1.12 * V.spokeL) && (t = Math.max(t, -.15)), 2 === d && (t = Math.max(t, l(a - .24, e + .18, V.spark2, Math.max(4, V.spokes - 2), .5)));
    }
    else if ("path" === f) {
        let l = 1;
        for (let i = 0; i < Y.length - 1; i++)
            l = Math.min(l, G(a, e, Y[i], Y[i + 1]));
        for (let [i, m] of (2 === d && (l = Math.min(l, G(a, e, Y[Y.length - 1], Y[0]))), t = Math.max(t, 1 - l / V.pathTh - .35 * ((h + k) % 4 != 0)), 1 === d && (t = Math.max(t = Math.max(t, 1 - G(a, e, U[0], U[1]) / (.8 * V.pathTh) - .4 * ((h + k) % 4 != 0)), 1.5 * (1 - Math.hypot(a - U[1][0], e - U[1][1]) / .03))), Y)) {
            let l = Math.hypot(a - i, e - m);
            t = Math.max(t, 1.5 * (1 - l / .035)), .014 > Math.abs(l - .07) && (t = Math.max(t, -.2));
        }
    }
    else {
        let l = Math.hypot(a, e), b = Math.atan2(e, a);
        if (0 === d) {
            if (l > .07 && l < V.rayL) {
                let a = 2 * Math.abs(b / (2 * Math.PI) * V.rays % 1 - .5);
                a > .82 && (t = Math.max(t, (a - .82) / .18 - l / V.rayL + .35));
            }
        }
        else if (1 === d) {
            let l = a + .34, i = e + .26, h = Math.hypot(l, i), m = Math.atan2(i, l);
            if (h > .05 && h < 1.5 * V.rayL && m > -.3 && m < Math.PI / 2 + .3) {
                let a = 2 * Math.abs(m / (Math.PI / 2) * (.5 * V.rays) % 1 - .5);
                a > .76 && (t = Math.max(t, (a - .76) / .24 - h / (1.5 * V.rayL) + .3));
            }
        }
        else {
            for (let a = 1; a <= V.ripples; a++) {
                let e = V.rayL * a / V.ripples;
                2 * Math.abs((b + V.ringGapA * a + Math.PI) / (2 * Math.PI) % 1 - .5) < .86 && .014 > Math.abs(l - e) && (t = Math.max(t, 1 - Math.abs(l - e) / .014));
            }
            t = Math.max(t, 1.3 * (1 - l / .035));
        }
        if (l > .8 * V.rayL && m(h, k, 44 ^ i) < 3 * V.sparkles)
            return 2;
    } return t; }, K = -1; for (let a of I)
        K = Math.max(K, N((R - a.dx) / a.sc, (E - a.dy) / a.sc)); let Q = (a - .5 * j) / Math.min(j, r), X = (e - .5 * r) / Math.min(j, r); if ("horizon" === p)
        .011 > Math.abs(X - C) && Math.abs(Q - .4 * T) > .12 && h % 2 == 0 && (K = Math.max(K, -.2));
    else if ("ticks" === p)
        .045 > Math.hypot(Q - T, X - C) && .35 > m(h, k, 119 ^ i) && (K = Math.max(K, .5));
    else if ("mini" === p) {
        let a = Math.hypot(Q - T, X - C);
        a < .12 * S && (K = Math.max(K, 1)), .012 > Math.abs(a - .2 * S) && (K = Math.max(K, -.2));
    } let _ = l ? .55 * m(h, k, O) + .45 * t(h, k, O, 2.2, .5 * l) : m(h, k, O); K > 0 && K < .2 && _ > K / .2 && (K = -.3); let J = l ? t(h, k, 435 ^ i, 2.6, .6 * l) : m(h, k, 435 ^ i), Z = l ? Math.max(0, Math.min(1, (J - .5) * 1.9 + .5)) : J; if (c) {
        if (K >= .1)
            return 0;
        let a = m(h, k, $);
        return K > -.45 ? a < .5 ? Z < .18 ? 2 : 1 : 0 : a < .34 ? Z < .3 + o ? 2 : 1 : 2 * (a > .985);
    } if (K > -.45)
        return Z < Math.min(.95, Math.max(.2, .8 * K + .46 + o + (l ? .17 * Math.sin((Q * z + X * v) * 5.2 - 2.2 * l) : 0) + .16 * !!g)) ? 2 : 1; let aa = m(h, k, $), ae = V.ground; "none" === u ? ae = 0 : "gradient" === u ? ae = 4 * V.ground * Math.max(0, Math.min(1, Q * w + X * x + .5)) : "band" === u ? ae = Math.abs(X - M) < A ? 3 * V.ground : 0 : "half" === u && (ae = Q * w + X * x > 0 ? 3.2 * V.ground : 0); let al = l ? ae * (.55 + .9 * t(h, k, 68 ^ i, 3, .4 * l)) : ae; return aa >= al ? 0 : aa < .38 * al ? 2 : 1; }; }({ seed: n, cat: o, tt: p }), e = f.clientWidth, l = f.clientHeight; g(d, e, l, r, (i, h, m, t) => a(i, h, m, t, e, l)); })(), !l.reducedMotion && e.animate) {
        let a = e => { u || (e - w > 80 && (p += .022, w = e, k()), s = requestAnimationFrame(a)); };
        s = requestAnimationFrame(a);
    } return { stop() { u = !0, cancelAnimationFrame(s); }, rerender: k }; }
    a.s(["CLAWD", 0, w, "CLAWD_KITE", 0, y, "CLAWD_POOL", 0, x, "DOT", 0, i, "RIDE_SPRITES", 0, u, "clawdActor", 0, function (a, { mode: e = "astronaut", px: i = 4, follow: h = !0, home: m = { x: .5, y: .45 }, followStrength: t = 1, omega: b = 3.2, zeta: k = 1.05, targetEase: f = 2.6, onMove: d = null, clampX: n = null, clampY: c = null, entranceX: g = null, skipIntro: j = !1 } = {}) { let o = { ...m }; null !== g && setTimeout(() => { o.x = g; }, 350); let r = "pool" === e ? x : "kite" === e ? y : w, p = document.createElement("canvas"); p.setAttribute("aria-hidden", "true"), p.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;", "static" === getComputedStyle(a).position && (a.style.position = "relative"), a.appendChild(p); let s = p.getContext("2d"); s.imageSmoothingEnabled = !1; let u = () => { let e = Math.min(2, devicePixelRatio || 1), l = a.getBoundingClientRect(); p.width = Math.max(1, l.width * e), p.height = Math.max(1, l.height * e), s.setTransform(e, 0, 0, e, 0, 0), s.imageSmoothingEnabled = !1; }; u(), new ResizeObserver(() => { u(); try {
            W();
        }
        catch { } }).observe(a); let q = null, v = null; h && (a.addEventListener("pointermove", e => { let l = a.getBoundingClientRect(); q = (e.clientX - l.left) / l.width, v = (e.clientY - l.top) / l.height; }), a.addEventListener("pointerleave", () => { q = v = null; })); let M = o.x, A = o.y, R = 0, I = 0, P = o.x, F = o.y, L = 0, T = performance.now(), C = T, S, E = !1; "pool" === e && (M = m.x, A = m.y, R = 0, I = 0); let B = null, W = () => { let a = performance.now(), l = (a - T) / 1e3, g = Math.min(.05, Math.max(.008, (a - C) / 1e3)); C = a; let u = p.clientWidth, w = p.clientHeight, x = "astronaut" === e && !j && l * r.fps < r.launch; if ("astronaut" !== e || x)
            if ("astronaut" === e && x)
                M = m.x, A = m.y, R = 0, I = 0;
            else if ("pool" === e) {
                let a = (a, e, l) => Math.max(e, Math.min(l, a)), e = h && null !== q ? { x: a(q, .1, .9), y: a(v, .12, .88) } : { x: m.x, y: m.y };
                e.x += .028 * Math.sin(.45 * l) + .018 * Math.sin(.19 * l + 1.7), e.y += .045 * Math.sin(.62 * l + .8) + .03 * Math.sin(.27 * l + 2.4), c && (e.y = a(e.y, c[0], c[1]));
                let i = .04 * Math.min(1, l / 2.5);
                R += ((e.x - M) * i - 1.05 * R) * g, I += ((e.y - A) * i - 1.05 * I) * g, M += R * g, A += I * g;
            }
            else {
                let a = h && null !== q ? o.x + (q - o.x) * t : o.x, l = "kite" === e || x ? o.y : h && null !== v ? o.y + (v - o.y) * t : o.y;
                n && (a = Math.max(n[0], Math.min(n[1], a))), c && (l = Math.max(c[0], Math.min(c[1], l)));
                let i = 1 - Math.exp(-g * f);
                P += (a - P) * i, F += (l - F) * i, R += (b * b * (P - M) - 2 * k * b * R) * g, I += (b * b * (F - A) - 2 * k * b * I) * g, R = Math.max(-.55, Math.min(.55, R)), I = Math.max(-.55, Math.min(.55, I)), "kite" === e ? (M = m.x, I = 0) : M += R * g, A += "kite" === e ? 0 : I * g;
            }
        else {
            let a = (a, e, l) => Math.max(e, Math.min(l, a)), e = h && null !== q ? { x: a(q, .1, .9), y: a(v, .12, .88) } : { x: m.x, y: m.y };
            e.x += .028 * Math.sin(.45 * l) + .018 * Math.sin(.19 * l + 1.7), e.y += .045 * Math.sin(.62 * l + .8) + .03 * Math.sin(.27 * l + 2.4), R += ((e.x - M) * .12 - .8 * R) * g, I += ((e.y - A) * .12 - .8 * I) * g, M += R * g, A += I * g;
        } let y = "astronaut" !== e || x ? 0 : Math.max(-8, Math.min(8, 55 * R)); L += (y - L) * (1 - Math.exp(-(4 * g))); let S = z(r, (a => { if ("astronaut" === e) {
            let e = Math.floor(a * r.fps) + (j ? r.launch : 0);
            return e < r.launch ? Math.min(e, r.launch - 1) : r.launch + (e - r.launch) % (r.loop - r.launch);
        } if ("kite" === e)
            return Math.floor(a * r.fps) % r.frames.length; if (!B || a >= B.until) {
            let e = Math.random();
            B = B && "bob" === B.kind && e < .38 ? { kind: "glare", a: 17, b: 27, t0: a, until: a + 11 / r.fps } : B && "bob" === B.kind && e < .62 ? { kind: "gloff", a: 28, b: 43, t0: a, until: a + 16 / r.fps + 1.6 } : { kind: "bob", a: 0, b: 13, t0: a, until: a + (B ? 3 + 3 * Math.random() : 2.5) };
        } let l = Math.floor((a - B.t0) * r.fps); return "bob" === B.kind ? B.a + l % (B.b - B.a + 1) : Math.min(B.a + l, B.b); })(l)), E = r.w * i, W = r.h * i; s.clearRect(0, 0, u, w), s.save(); let H = M * u, D = "kite" === e ? w - .5 * W : A * w; "pool" === e && (H += 4 * Math.sin(.31 * l) + 1.5 * Math.sin(.7 * l), D += 2.5 * Math.sin(.83 * l) + Math.sin(.27 * l)), s.translate(H, D), "pool" === e && (() => { const q=(l%4.8)/4.8; s.save(); s.globalAlpha=Math.sin(q*Math.PI)*.24; s.strokeStyle="#91b1c6"; s.lineWidth=1; s.setLineDash([1.2,3]); s.beginPath(); s.ellipse(0,24+q*2,27+q*25,5+q*6,0,0,Math.PI*2); s.stroke(); s.restore(); })(), "pool" === e && s.rotate((4.5 * Math.sin(.5 * l) + 2.5 * Math.sin(.21 * l + 1.3)) * Math.PI / 180), "astronaut" !== e || x || (s.rotate(L * Math.PI / 180), s.translate(0, 4 * Math.sin(1.1 * l))), s.drawImage(S, -E / 2, -W / 2, E, W), s.restore(), d && d(H, D, u, w); }, H = () => { E || (W(), S = requestAnimationFrame(H)); }; return W(), l.reducedMotion || (S = requestAnimationFrame(H)), { stop() { E = !0, cancelAnimationFrame(S), p.remove(); }, getRect() { let e = a.getBoundingClientRect(), l = r.w * i, h = r.h * i; return { left: M * e.width - l / 2, top: A * e.height - h / 2, w: l, h: h }; } }; }, "clawdMark", 0, function (a, e = 2) { let l = y.frames[0], i = y.w, h = y.h, m = 0, t = 0; for (let a = 0; a < y.h; a++)
            for (let e = 0; e < y.w; e++)
                255 !== l[a * y.w + e] && (e < i && (i = e), e > m && (m = e), a < h && (h = a), a > t && (t = a)); let b = m - i + 1, k = t - h + 1, f = document.createElement("canvas"); f.setAttribute("aria-hidden", "true"), f.width = b, f.height = k; let d = f.getContext("2d"), n = d.createImageData(b, k); for (let a = 0; a < k; a++)
            for (let e = 0; e < b; e++) {
                let m = l[(a + h) * y.w + (e + i)];
                if (255 === m)
                    continue;
                let t = y.palette[m];
                if ("#141413" === t || "#000000" === t)
                    continue;
                let k = (a * b + e) * 4;
                n.data[k] = parseInt(t.slice(1, 3), 16), n.data[k + 1] = parseInt(t.slice(3, 5), 16), n.data[k + 2] = parseInt(t.slice(5, 7), 16), n.data[k + 3] = 255;
            } return d.putImageData(n, 0, 0), f.style.cssText = `width:${b * e}px;height:${k * e}px;image-rendering:pixelated;display:block;`, a.appendChild(f), f; }, "dotAmbient", 0, function ({ seed: a = "ambient", density: e = .3, fps: h = 13, opacity: m = .55, avoid: t = ".nav, h1, h2, .tabs, .list-top, .arow, .post, .vcard, .vmeta, .nlx, .art-foot, .search, .term-bar, .footer-grid, .footer-bar, .f-low, .nl, .sub, .rail-sub, .hero-dots, .site-footer .scene, .map, p, h3, h4, li, a, button, .lede, [data-dot-avoid]", pad: b = 26, fray: k = 30 } = {}) { let f = document.createElement("div"); f.style.cssText = `position:fixed;left:0;right:0;top:-260px;height:calc(100vh + 520px);z-index:0;pointer-events:none;opacity:${m};will-change:transform;`, document.body.prepend(f); let d = { x: -9999, y: -9999, r: 0 }, n = { y: 0 }, c = 0, g = 0, j = null; addEventListener("scroll", () => { let a = window.scrollY; Math.abs(g = a - c) > 260 ? (n.y = c = Math.round(a / i.spacing) * i.spacing, g = a - c, f.style.transform = `translateY(${-g}px)`, j && j.rerender()) : f.style.transform = `translateY(${-g}px)`; }, { passive: !0 }); let o = i.spacing, r = null, p = 0, u = 0, w = () => { let a = window.scrollY; for (let e of (p = Math.ceil(innerWidth / o) + 1, u = Math.ceil(document.documentElement.scrollHeight / o) + 2, r = new Uint8Array(p * u), document.querySelectorAll(t))) {
            let l = e.getBoundingClientRect();
            if (!l.width)
                continue;
            let i = l.top + a, h = l.bottom + a, m = e.classList.contains("nl") || e.classList.contains("nlx") || e.classList.contains("f-low"), t = (a, e, l, i, h) => { let m = Math.max(0, Math.floor(a / o)), t = Math.min(p - 1, Math.ceil(l / o)), b = Math.max(0, Math.floor(e / o)), k = Math.min(u - 1, Math.ceil(i / o)); for (let a = b; a <= k; a++)
                for (let e = m; e <= t; e++) {
                    let l = a * p + e;
                    r[l] < h && (r[l] = h);
                } };
            t(l.left - b - k, i - b - k, l.right + b + k, h + b + k, m ? 2 : 1), t(l.left - b, i - b, l.right + b, h + b, 2);
        } }; w(); let x = null, y = () => { x || (x = setTimeout(() => { x = null, w(); }, 200)); }; if (addEventListener("resize", y), setInterval(y, 2500), j = s(f, { seed: a, morph: !0, fps: h, texDensity: e, clearRef: d, excludeRef: (a, e) => { if (!r)
                return 0; let l = e - 260 + c; return l < 0 ? 0 : r[Math.floor(l / o) * p + Math.floor(a / o)] || 0; }, scrollRef: n }), !l.reducedMotion) {
            let a = null;
            document.addEventListener("mousemove", e => { d.x = e.clientX, d.y = e.clientY + 260 + g, d.r = Math.min(140, (d.r || 0) + 12), clearTimeout(a), a = setTimeout(function e() { d.r = Math.max(0, d.r - 9), d.r > 0 && (a = setTimeout(e, 70)); }, 260); }, { passive: !0 });
        } return f; }, "dotArt", 0, v, "dotBanner", 0, function (a, { text: e = "CLAUDE", spacing: l = 6, rA: i = 1.1, rB: h = 2.1, color: m = "rgba(250,249,245,.92)", weight: t = 900, font: b = '"Anthropic Sans", sans-serif' } = {}) { let k = () => { }, { c: f, ctx: d } = c(a, () => k()); return (k = () => { let a = f.clientWidth, k = f.clientHeight; if (!a || !k)
            return; let n = document.createElement("canvas"); n.width = Math.max(2, Math.ceil(a / l)), n.height = Math.max(2, Math.ceil(k / l)); let c = n.getContext("2d"), g = 1.05 * n.height; c.font = `${t} ${g}px ${b}`; let j = c.measureText(e).width; j > .96 * n.width && (g *= .96 * n.width / j), c.font = `${t} ${g}px ${b}`, c.textAlign = "center", c.textBaseline = "middle", c.fillStyle = "#fff", c.fillText(e, n.width / 2, .54 * n.height); let o = c.getImageData(0, 0, n.width, n.height).data; d.clearRect(0, 0, a, k), d.fillStyle = m; for (let a = 0; a < n.height; a++)
            for (let e = 0; e < n.width; e++) {
                if (o[(a * n.width + e) * 4 + 3] / 255 < .2)
                    continue;
                let m = o[(a * n.width + Math.max(0, e - 1)) * 4 + 3] < 51 || o[(a * n.width + Math.min(n.width - 1, e + 1)) * 4 + 3] < 51 || a > 0 && o[((a - 1) * n.width + e) * 4 + 3] < 51 || a < n.height - 1 && o[((a + 1) * n.width + e) * 4 + 3] < 51 ? i : h;
                d.beginPath(), d.arc(e * l + l / 2, a * l + l / 2, m, 0, 6.2832), d.fill();
            } })(), document.fonts?.ready && document.fonts.ready.then(k), { rerender: k }; }, "dotFace", 0, function (a, { seed: e = "face", spacing: l = 4, rA: t = .85, rB: b = 1.7, color: k = i.color } = {}) { let f = () => { }, { c: d, ctx: n } = c(a, () => f()), o = h(j(e)), r = 15 + 5 * o(), p = 19 + 5 * o(), s = 5 * o() | 0, u = 3 + 6 * o(), w = .34 > o(), x = .3 > o(), y = 6 + 2.5 * o(), z = 43 + 3 * o(), q = w ? 2.2 : 2.6, v = 33 + 10 * o(), M = 8 + 4 * o(), A = 61 ^ j(e), R = document.createElement("canvas"); R.width = 96, R.height = 112; let I = R.getContext("2d"), P = (a, e, l, i, h) => { I.fillStyle = h, I.beginPath(), I.ellipse(a, e, l, i, 0, 0, 6.2832), I.fill(); }; if (P(48, 118, v, 30, "#fff"), I.fillStyle = "#999", I.fillRect(48 - M / 2, 66, M, 26), P(48 - r - 1, 47, 3.4, 5, "#999"), P(48 + r + 1, 47, 3.4, 5, "#999"), P(48, 46, r, p, "#999"), 0 === s)
            P(48, 46 - .42 * p, r + 2, .62 * p, "#fff");
        else if (1 === s)
            P(48, 44 - .38 * p, r + 4, .66 * p, "#fff"), I.fillStyle = "#fff", I.fillRect(48 - r - 6, 40, 8, 62), I.fillRect(48 + r - 2, 40, 8, 62);
        else if (2 === s)
            P(48, 46 - .45 * p, r + 1, .55 * p, "#fff"), P(48 - r - 3, 26, 7, 7, "#fff"), P(48 + r + 3, 26, 7, 7, "#fff");
        else if (3 === s)
            for (let a = -2; a <= 2; a++)
                P(48 + .5 * r * a, 27 - 2 * Math.abs(a) + u - 6, 7.5, 7.5, "#fff");
        else
            P(44, 40 - .62 * p - .4 * u, .9 * r, 8 + .7 * u, "#fff"); w && (I.strokeStyle = "#fff", I.lineWidth = 2.4, I.beginPath(), I.arc(48 - y, z, 6, 0, 6.2832), I.stroke(), I.beginPath(), I.arc(48 + y, z, 6, 0, 6.2832), I.stroke(), I.beginPath(), I.moveTo(48 - y + 6, z), I.lineTo(48 + y - 6, z), I.stroke()), x && P(48 + r + 1, 54, 1.8, 1.8, "#fff"), I.globalCompositeOperation = "destination-out", P(48 - y, z, q, q + .4, "#000"), P(48 + y, z, q, q + .4, "#000"), I.globalCompositeOperation = "source-over"; let F = I.getImageData(0, 0, 96, 112).data; return (f = () => { let a = d.clientWidth, e = d.clientHeight; if (!a || !e)
            return; let i = Math.min(a / 96, e / 112), h = (a - 96 * i) / 2, f = (e - 112 * i) / 2; g(n, a, e, { spacing: l, rA: t, rB: b, color: k }, (a, e, l, t) => { let b = (a - h) / i, k = (e - f) / i; if (b < 0 || k < 0 || b >= 96 || k >= 112)
            return 0; let d = ((0 | k) * 96 + (0 | b)) * 4; if (F[d + 3] < 40)
            return 0; let n = F[d], c = (a - h) / i, g = (e - f) / i; return [[-3, 0], [3, 0], [0, -3], [0, 3]].some(([a, e]) => { let l = ((g + e | 0) * 96 + (c + a | 0)) * 4; return l < 0 || l >= F.length || F[l + 3] < 40; }) && .35 > m(l, t, A) ? 0 : n > 200 ? 2 : 1; }); })(), { rerender: f }; }, "dotRipples", 0, function (a, e = {}) { let h = () => { }, { c: m, ctx: k } = c(a, () => h()), f = { spacing: i.spacing, rA: i.rA, rB: i.rB, color: i.color, ripple: 1.5, density: .3, ...e, seed: j(e.seed ?? "pool") }, d = 0, n, o = !1, r = 0; if ((h = () => { e.colorVar && (f.color = getComputedStyle(document.documentElement).getPropertyValue(e.colorVar).trim() || f.color); let a = 36930 ^ f.seed, l = e.progressRef ? Math.max(0, Math.min(1, e.progressRef.p)) : 1; l <= 0 ? k.clearRect(0, 0, m.clientWidth, m.clientHeight) : g(k, m.clientWidth, m.clientHeight, f, (e, i, h, m) => { let k = .8 * t((h + 3 * d) / (7 * f.ripple), m / 1.15, a, 1, .6 * d) + .25 * b(h, m, 34 ^ a, 9), n = .8 - l * (.18 + .35 * f.density); return k < n ? 0 : k > n + .24 ? 2 : 1; }); })(), !l.reducedMotion) {
            let a = e => { o || (e - r > 180 && (d += .06, r = e, h()), n = requestAnimationFrame(a)); };
            n = requestAnimationFrame(a);
        } return { stop() { o = !0, cancelAnimationFrame(n); } }; }, "dotSky", 0, function (a, e = {}) { let i = () => { }, { c: h, ctx: m } = c(a, () => i()), t = { ...r, ...e, seed: j(e.seed ?? "sky") }, b = null, k = 0, n = 0, [] = [], p = 0, s, u = !1, w = 0; if ((i = () => { t.colorVar && (t.color = getComputedStyle(document.documentElement).getPropertyValue(t.colorVar).trim() || t.color); let a = h.clientWidth, e = h.clientHeight; b && k === a && n === e || (b = o({ ...t, W: a, H: e }), k = a, n = e); let [l, i] = d(t); g(m, a, e, t, (h, m, k, d) => f({ ...t, W: a, H: e }, b.clouds, b.period, h, p, m, d, l, i)); })(), !l.reducedMotion && !1 !== e.drift) {
            // Kite-only smooth drift: elapsed time keeps wind speed stable across refresh rates.
            let started = null; const interval = e.smooth ? 1000 / 30 : 420;
            let a = now => { if (u) return; started ??= now; if (now - w >= interval - (e.smooth ? .5 : 0)) { p = e.smooth ? (now - started) / 1000 * (e.speed ?? t.spacing / 1.26) : p + t.spacing / 3; w = now; i(); } s = requestAnimationFrame(a); };
            s = requestAnimationFrame(a);
        } return { stop() { u = !0, cancelAnimationFrame(s); }, rerender: i }; }, "dotTexture", 0, s, "dotThumb", 0, function (a, e = "thumb", l = null) { return v(a, { seed: e, cat: l || void 0, spacing: 6, rA: 1, rB: 1.9 }); }, "poolWater", 0, function (a, e = {}) { let h = () => { }, { c: k, ctx: f } = c(a, () => h()), d = { spacing: i.spacing, rA: i.rA, rB: i.rB, color: i.color, ripple: 1.5, density: .3, ...e, seed: j(e.seed ?? "pool") }, n = [], o = 0, r, p = !1, s = 0; h = () => { e.colorVar && (d.color = getComputedStyle(document.documentElement).getPropertyValue(e.colorVar).trim() || d.color); let a = 36930 ^ d.seed, l = k.clientWidth, i = k.clientHeight, h = d.spacing, c = e.progressRef ? Math.max(0, Math.min(1, e.progressRef.p)) : 1; if (c <= 0)
            return void f.clearRect(0, 0, l, i); let j = l % h / 2, r = i % h / 2, p = e.avoidRef ? e.avoidRef() : null, s = p ? p.left + p.w / 2 : -1e5, u = p ? p.top + p.h / 2 : -1e5, w = p ? .46 * Math.min(p.w, p.h) : 0, x = n.filter(a => o - a.t >= 0 && o - a.t < 4), y = .72 - .34 * d.density * c + .14 * (1 - c); g(f, l, i, d, (e, l, i, k) => { let f = e, n = l; if (p) {
            let t = e - s, b = l - u, d = Math.sqrt(t * t + b * b), c = (d - w) / h;
            if (c < 9.5) {
                if (c <= 2)
                    return 0;
                let g = (c - 2) / 7.5;
                if (m(i, k, 46314 ^ a) > g * g * (3 - 2 * g))
                    return 0;
                let j = 1 - g, o = j * j * 2.5 * h, r = d || 1;
                f = e - t / r * o, n = l - b / r * o;
            }
        } let c = 0; for (let a of x) {
            let i = o - a.t, m = 7 * h * i, t = e - a.x, b = l - a.y, k = Math.sqrt(t * t + b * b) || 1, d = (k - m) / (1.3 * h), g = 3 * h * Math.exp(-(1.2 * i)) * Math.exp(-d * d / 2);
            g > .05 * h && (f -= t / k * g, n -= b / k * g, c = Math.max(c, g));
        } let g = (f - j) / h, z = (n - r) / h, q = b(i, k, 2475 ^ a, 26), v = (.55 * t((g + 1.3 * o) / (7 * d.ripple), z / (1.6 * d.ripple), 819 ^ a, 1, .35 * o) + .45 * t((g + .7 * o + .35 * z) / (4.2 * d.ripple), z / (2.6 * d.ripple), 1638 ^ a, 1, .5 * o)) * (.68 + .5 * q) + .14 * m(i, k, 1365 ^ a) + Math.min(.25, c / h * .14); return v < y ? 0 : v <= y + .24 ? 1 : t(i, k, 1911 ^ a, 2.2, 2.2 * o) > .45 || c > 1.2 * h ? 2 : 1; }); }; let u = a => { let e = k.getBoundingClientRect(); a.clientY < e.top || a.clientY > e.bottom || (n.push({ x: a.clientX - e.left, y: a.clientY - e.top, t: o }), n.length > 12 && n.shift(), l.reducedMotion && h()); }; (e.clickHost || a).addEventListener("click", u), h(); let w = null; if (l.reducedMotion)
            e.progressRef && addEventListener("scroll", w = () => { r || (r = requestAnimationFrame(() => { r = 0, p || h(); })); }, { passive: !0 });
        else {
            let a = e => { p || (e - s > 40 && (o += Math.min(.12, (e - s) / 1e3), s = e, h()), r = requestAnimationFrame(a)); };
            r = requestAnimationFrame(a);
        } return { rerender: h, stop() { p = !0, cancelAnimationFrame(r), w && removeEventListener("scroll", w), (e.clickHost || a).removeEventListener("click", u); } }; }, "rideScene", 0, function (a, e = {}) { let h = () => { }, { c: t, ctx: b } = c(a, () => h()), k = ["walk", "skate", "scooter", "bike", "car"], n = e.vehicle || k[Math.floor(Math.random() * k.length)], g = u[n], r = e.px || 4, p = { spacing: i.spacing, rA: i.rA, rB: i.rB, color: i.color, count: 4, scale: .9, puff: .5, fray: .5, lightAng: 240, mix: .5, dither: .4, ...e, seed: j(e.seed ?? "ride") }, s = p.spacing, w = null, x = 0, y = 0, q = null, v = 0, M = 0, A, R = !1, I = 0, P = !1, F = 0; (h = () => { e.colorVar && (p.color = getComputedStyle(document.documentElement).getPropertyValue(e.colorVar).trim() || p.color); let a = t.clientWidth, l = t.clientHeight; b.clearRect(0, 0, a, l); let i = e.progressRef ? Math.max(0, Math.min(1, e.progressRef.p)) : 1; if (i <= 0)
            return; let h = Math.round(.7 * l), k = a % s / 2, n = l % s / 2; w && x === a && y === l || (w = o({ ...p, W: a, H: Math.max(120, h - 2 * s) }), x = a, y = l); let [c, j] = d(p), u = g.w * r, v = g.h * r, M = Math.round(n + Math.ceil((h - n) / s + 1e-4) * s - .8 * p.rA - 1), A = Math.round(.38 * a), R = M - v / 2, I = u / 2 + 1.2 * s, L = v / 2 + s, T = { ...p, W: a, H: Math.max(120, h - 2 * s) }; b.fillStyle = p.color; for (let e = 0, t = n; t <= l; t += s, e++)
            for (let l = 0, d = k; d <= a; l++, d += s) {
                if (t > h) {
                    b.beginPath(), b.arc(d, t, .8 * p.rA * Math.min(1, 1.4 * i), 0, 6.2832), b.fill();
                    continue;
                }
                let a = f(T, w.clouds, w.period, d, F, t, e, c, j);
                if (a) {
                    if (P) {
                        let a = (d - A) / I, i = (t - R) / L, h = a * a + i * i;
                        if (h < 1 || h < 1.8 && m(l, e, 49642 ^ p.seed) > (h - 1) / .8)
                            continue;
                    }
                    b.beginPath(), b.arc(d, t, (2 === a ? p.rB : p.rA) * Math.min(1, 1.4 * i), 0, 6.2832), b.fill();
                }
            } if (P && null !== q) {
            let e = z(g, (a => { if (a < 1.25)
                return 0; let e = Math.floor((a - 1.25) * g.fps); if (e < g.launch)
                return e; if (g.cruiseSeq)
                return g.cruiseSeq[(e - g.launch) % g.cruiseSeq.length]; let l = g.loopFrom ?? g.launch; return l + (e - g.launch) % (g.loop - l); })(q));
            b.imageSmoothingEnabled = !1, b.drawImage(e, Math.round(.38 * a - u / 2), M - v, u, v);
        } })(); let L = a => { if (R)
            return; let i = Math.min(.05, (a - I) / 1e3) || .016; I = a; let m = e.progressRef ? e.progressRef.p : 1; if (!P && m > .78 && (P = !0, q = 0), P && !l.reducedMotion) {
            let a = (q - 1.25) * g.fps >= g.launch ? g.speed : 0, e = a < M ? 6 : 2.2;
            M += (a - M) * Math.min(1, i * e), v += i * M, F += 6 * i + i * M * .45, q += i;
        } h(), A = requestAnimationFrame(L); }; return A = requestAnimationFrame(L), { stop() { R = !0, cancelAnimationFrame(A); }, vehicle: n }; }]);
});
