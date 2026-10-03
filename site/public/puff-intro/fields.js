/* Actual compiled module factory from https://claude.dev/_next/static/chunks/3ujeutb_bgqh0.js.
   Formatting only; original identifiers and implementation retained. */
ReferenceModules.register(98092, e => {
    "use strict";
    var t = e.i(93384);
    function n(e) { let t = document.createElement("canvas"); t.setAttribute("aria-hidden", "true"), t.style.cssText = "display:block;width:100%;height:100%;", e.appendChild(t); let n = t.getContext("2d"), a = () => { let a = Math.min(2, devicePixelRatio || 1), o = e.getBoundingClientRect(); t.width = Math.max(1, o.width * a), t.height = Math.max(1, o.height * a), n.setTransform(a, 0, 0, a, 0, 0); }; a(); let o = new ResizeObserver(a); return o.observe(e), { c: t, ctx: n, ro: o, fit: a }; }
    function a(e) { let t, n = !1, last = 0, a = o => { n || (last=o/1e3,e(last),t=requestAnimationFrame(a)); }; const stop=()=>{n=!0;cancelAnimationFrame(t)};stop.render=()=>e(last);t=requestAnimationFrame(a);return stop; }
    let o = e => getComputedStyle(document.documentElement).getPropertyValue(e).trim(), l = e => `rgba(${getComputedStyle(document.documentElement).getPropertyValue("--ink-rgb").trim() || "250,249,245"},${e})`, i = 0xffffffff * Math.random() | 0;
    function r(e, t, n) { let a = 0x165667b1 * e + 0x27d4eb2f * t + 69069 * n | 0; return a = Math.imul(a ^ a >>> 13, 0x4bf19f61), ((a ^= a >>> 16) >>> 0) / 0x100000000; }
    function s(e, t, n, a) { let o = e / a, l = t / a, i = Math.floor(o), s = Math.floor(l), d = o - i, c = l - s; d = d * d * (3 - 2 * d), c = c * c * (3 - 2 * c); let p = r(i, s, n), u = r(i + 1, s, n), h = r(i, s + 1, n), m = r(i + 1, s + 1, n), f = p + (u - p) * d; return f + (h + (m - h) * d - f) * c; }
    function d(e, t, n, a, o) { let l = Math.floor(o), i = o - l, r = s(e, t, n ^ Math.imul(l, 0x9e3779b1), a); return r + (s(e, t, n ^ Math.imul(l + 1, 0x9e3779b1), a) - r) * (i * i * (3 - 2 * i)); }
    let c = e => e * e * (3 - 2 * e);
    e.s(["ditherClouds", 0, function (e, { color: o = "rgba(250,249,245,.5)", cloudCount: l = 4, dot: i = 2, gap: r = 5, drift: s = 6 } = {}) { let { c: d, ctx: c, ro: p } = n(e), u = []; for (let e = 0; e < l; e++)
            u.push({ x: Math.random(), y: .12 + .7 * Math.random(), w: 130 + 160 * Math.random(), h: 45 + 45 * Math.random(), v: (s + Math.random() * s) * 1, seed: 100 * Math.random() }); let h = (e, t, n) => { let a = 0; for (let o = 0; o < 4; o++) {
            let l = .18 + (Math.sin(13 * n + 7.3 * o) + 1) / 2 * .64, i = .55 + (Math.cos(7 * n + 3.1 * o) + 1) / 2 * .12, r = .16 + (Math.sin(5 * n + 11 * o) + 1) / 2 * .14, s = .62 * r, d = (e - l) / r, c = (t - i) / s;
            d * d + c * c < 1 && (a = Math.max(a, 1 - Math.hypot(d, c)));
        } return a; }, m = a(e => { let n = d.clientWidth, a = d.clientHeight; for (let l of (c.clearRect(0, 0, n, a), c.fillStyle = o, u)) {
            let o = ((t.reducedMotion ? l.x : l.x + e * l.v / n) % 1.3 - .15) * n, s = l.y * a - l.h / 2;
            for (let e = 0; e < l.h; e += r)
                for (let t = 0; t < l.w; t += r) {
                    let n = h(t / l.w, e / l.h, l.seed);
                    n > .12 && (n > .5 || (t / r + e / r) % 2 == 0) && c.fillRect(o + t, s + e, i, i);
                }
        } }); return { stop: () => { m(), p.disconnect(); }, canvas: d }; }, "flowField", 0, function (e, { color: o = "rgba(250,249,245,.82)", cell: l = 17, speed: i = .12, mouse: r = !0 } = {}) { let { c: s, ctx: d, ro: c } = n(e), p = -9999, u = -9999; r && (e.addEventListener("pointermove", t => { let n = e.getBoundingClientRect(); p = t.clientX - n.left, u = t.clientY - n.top; }), e.addEventListener("pointerleave", () => { p = u = -9999; })); let h = (e, t, n) => Math.sin(.011 * e + n) * Math.cos(.013 * t - .7 * n) + .7 * Math.sin((e + t) * .006 + .5 * n), m = e => { let n = s.clientWidth, a = s.clientHeight; d.clearRect(0, 0, n, a), d.strokeStyle = o, d.lineWidth = 1.1; let r = t.reducedMotion ? 0 : e * i * Math.PI * 2; for (let e = l / 2; e < a; e += l)
            for (let t = l / 2; t < n; t += l) {
                let n = h(t, e, r) * Math.PI, a = t - p, o = e - u, l = a * a + o * o;
                l < 14400 && (n += Math.atan2(o, a) * (1 - l / 14400) * 1.2), d.beginPath(), d.moveTo(t - 5.5 * Math.cos(n), e - 5.5 * Math.sin(n)), d.lineTo(t + 5.5 * Math.cos(n), e + 5.5 * Math.sin(n)), d.stroke();
            } }, f = t.reducedMotion ? (m(0), () => { }) : a(m); return { stop: () => { f(), c.disconnect(); }, canvas: s }; }, "glyphShimmer", 0, function (e, { chars: o = "#:[]/\\=+·", color: l = "rgba(250,249,245,.55)", cell: i = 14, density: r = .06 } = {}) { let { c: s, ctx: d, ro: c } = n(e), p = []; p = []; let u = s.clientWidth, h = s.clientHeight; for (let e = i; e < h; e += i)
            for (let t = i / 2; t < u; t += i)
                Math.random() < r && p.push({ x: t, y: e, ch: o[Math.random() * o.length | 0], p: 7 * Math.random() }); let m = a(e => { let n = s.clientWidth, a = s.clientHeight; for (let i of (d.clearRect(0, 0, n, a), d.font = '11px "Anthropic Mono", monospace', p)) {
            let n = .15 + .85 * Math.max(0, Math.sin(.7 * e + i.p));
            d.fillStyle = l.replace(/[\d.]+\)$/, `${(.55 * n).toFixed(3)})`), !t.reducedMotion && .004 > Math.random() && (i.ch = o[Math.random() * o.length | 0]), d.fillText(i.ch, i.x, i.y);
        } }); return { stop: () => { m(), c.disconnect(); }, canvas: s }; }, "rainField", 0, function (e, { color: o = "rgba(250,249,245,.75)", count: l = 140, speedMin: i = 18, speedMax: r = 60 } = {}) { let { c: s, ctx: d, ro: c } = n(e), p = [], u = () => ({ x: Math.random(), y: Math.random(), v: i + Math.random() * (r - i), l: 8 + 8 * Math.random(), o: .25 + .75 * Math.random() }); for (let e = 0; e < l; e++)
            p.push(u()); let h = 0, m = a(e => { let n = Math.min(.05, e - h); h = e; let a = s.clientWidth, l = s.clientHeight; for (let e of (d.clearRect(0, 0, a, l), d.lineWidth = 1.2, p)) {
            !t.reducedMotion && (e.y += e.v * n / l, e.y > 1.05 && (Object.assign(e, u()), e.y = -.05)), d.strokeStyle = o.replace(/[\d.]+\)$/, `${e.o})`);
            let i = e.x * a, r = e.y * l;
            d.beginPath(), d.moveTo(i, r), d.lineTo(i, r + e.l), d.stroke();
        } }); return { stop: () => { m(), c.disconnect(); }, canvas: s }; }, "scanShimmer", 0, function (e) {
            if (t.reducedMotion)
                return;
            let n = document.createElement("div");
            n.style.cssText = "position:relative;display:block;", e.parentNode.insertBefore(n, e), n.appendChild(e);
            let a = document.createElement("div");
            if (a.style.cssText = `
    position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;
    background:linear-gradient(105deg,transparent 42%,rgba(255,255,255,.55) 50%,transparent 58%);
    background-size:280% 100%;animation:banner-shine 5.5s ease-in-out infinite;`, n.appendChild(a), !document.getElementById("scan-shimmer-kf")) {
                let e = document.createElement("style");
                e.id = "scan-shimmer-kf", e.textContent = "@keyframes banner-shine{0%,20%{background-position:120% 0}70%,100%{background-position:-40% 0}}", document.head.appendChild(e);
            }
        }, "spaceField", 0, function (e, { progressRef: p = null, avoidRef: u = null, spacing: h = 12, maxDensity: m = .34, grain: f = .7, mix: y = .5 } = {}) { let { c: v, ctx: g, ro: b } = n(e), M = 12 * f, E = 0, w = null, x = { fn: null }, L = []; (e.parentElement || e).addEventListener("click", e => { if (t.reducedMotion)
            return; let n = v.getBoundingClientRect(), a = e.clientX - n.left, o = e.clientY - n.top; if (o < 0 || o > n.height)
            return; let l = 400 + 220 * Math.random(), i = Math.PI / 180; if (.75 > Math.random()) {
            let e = .5 > Math.random(), t = e ? -40 : n.width + 40, r = (28 + 27 * Math.random()) * i, s = Math.abs(a - t);
            o - Math.tan(r) * s < 10 && (r = Math.max(12 * i, Math.atan((o - 10) / s)));
            let d = o - Math.tan(r) * s;
            L.push({ x: t, y: d, vx: (e ? 1 : -1) * Math.cos(r) * l, vy: Math.sin(r) * l, t: 0, life: 2.4 });
        }
        else {
            let e = (28 + 27 * Math.random()) * i;
            L.push({ x: a, y: o, vx: (.5 > Math.random() ? 1 : -1) * Math.cos(e) * l, vy: Math.sin(e) * l, t: 0, life: 1.6 });
        } }); let T = (e, t, n, a) => { let l = t % h / 2 + h / 2, i = n % h / 2 + h / 2, r = (e, t) => t + Math.round((e - t) / h) * h; for (let s = L.length - 1; s >= 0; s--) {
            let d = L[s];
            if (d.t += e, d.t >= d.life) {
                L.splice(s, 1);
                continue;
            }
            let c = d.t, p = Math.min(1, c / (.25 * d.life)) * Math.min(1, (d.life - c) / (.4 * d.life)), m = d.x + d.vx * c, f = d.y + d.vy * c, y = u ? u() : null, v = Math.hypot(d.vx, d.vy) || 1, b = d.vx / v, M = d.vy / v, E = null, w = null;
            for (let e = 0; e < 9; e++) {
                let s = r(m - b * h * e, l), d = r(f - M * h * e, i);
                if (s === E && d === w || (E = s, w = d, s < -20 || s > t + 20 || d < -20 || d > n + 20 || y && s > y.left - h && s < y.left + y.w + h && d > y.top - h && d < y.top + y.h + h))
                    continue;
                let c = (0 === e ? .267 * h : .15 * h * (1 - e / 12)) * p;
                c < .4 || (g.fillStyle = o("--space-shot") || a, g.beginPath(), g.arc(s, d, c, 0, 2 * Math.PI), g.fill());
            }
        } }; x.fn = T; let C = a(e => { null === w && (w = e); let n = Math.min(.1, e - w); w = e, t.reducedMotion || (E += .22 * n); let a = v.clientWidth, f = v.clientHeight; g.clearRect(0, 0, a, f); let b = p ? Math.max(0, Math.min(1, p.p)) : 1; if (b <= 0)
            return; let L = .62 - b * m * .42, T = L + .34 - .22 * y, C = u ? u() : null, k = l(1), A = o("--space-dot") || k, S = a % h / 2, R = f % h / 2, $ = .15 * h, q = .267 * h, P = e => { let t = Math.max(0, Math.min(1, e)); return t * t * (3 - 2 * t); }, O = Math.min(a, f), B = Math.min(Math.max(52, .115 * O), .3 * O), D = Math.max(.14 * a, 1.1 * B), I = Math.max(.3 * f, 1.1 * B), F = .92 * B, N = D + .45 * B, W = Math.max(.12 * B, .9 * h), H = Math.max(.18 * F, .9 * h), U = (2.2 * B) ** 2, K = Math.min(Math.max(60, .15 * O), .19 * O), X = .8 * a, _ = f - .66 * K, j = 1.75 * K, z = .32 * K, Y = Math.max(.1 * K, .9 * h), V = (e, t, n, a) => { let o = e - D, l = t - I, s = o * o + l * l; if (s < B * B) {
            let n = e - N, a = t - I, o = n * n + a * a;
            if (o >= F * F) {
                let e = Math.sqrt(o) - F;
                return B - Math.sqrt(s) > W && e > H ? 2 : 1;
            }
        } if (s < U) {
            let e = Math.sqrt(s) / B;
            if (e < 1.4 || r(n, a, 12295 ^ i) > P((e - 1.4) / .8))
                return 0;
        } let c = e - X, p = t - _, u = Math.sqrt(c * c + p * p), h = .9492354180824408 * c + .31456656061611776 * p, m = -(.31456656061611776 * c) + .9492354180824408 * p, f = Math.sqrt(h / j * (h / j) + m / z * (m / z)), y = f > .8 && f < 1.2, v = () => { let e = Math.abs(h) / j; return e > .9 && r(n, a, 37191 ^ i) < (e - .9) / .1 * .9 ? 0 : .16000000000000003 > Math.abs(f - 1) ? 2 : 1; }; if (y && m > 0) {
            let e = v();
            if (e)
                return e;
        } if (m > 0 && u < K && f > 1 - .34 && f < 1.34)
            return 0; if (u < K) {
            let e = 1 - u / K;
            if (e < .05 && r(n, a, 1812 ^ i) > Math.pow(e / .05, 1.4))
                return 0;
            if (K - u < Y)
                return 1;
            let t = .5 * (-(c / K * .28) + -(p / K * .82)) + .5 + (d(n, a, 2458 ^ i, 3.1, 0) - .5) * .35;
            return t < .18 ? 0 : t > .82 ? 2 : 1;
        } if (y) {
            let e = v();
            if (e)
                return e;
        } let g = Math.min(u / (1.18 * K), f / 1.24); return g < 1.32 && (g < 1 || r(n, a, 30634 ^ i) > P((g - 1) / .32)) ? 0 : -1; }; for (let e = 0, t = R + h / 2; t < f; e++, t += h)
            for (let n = 0, o = S + h / 2; o < a; n++, o += h) {
                let a = .2 + t / f * .8, l = b > .12 ? V(o, t, n, e) : -1;
                if (0 === l || l < 0 && r(n, e, 170 ^ i) > 1.15 * b * a)
                    continue;
                if (C) {
                    let a = Math.max(Math.max(0, Math.max(C.left - o, o - (C.left + C.w))), Math.max(0, Math.max(C.top + 2 * h - t, t - (C.top + C.h)))) / h;
                    if (a <= 7) {
                        let t = Math.max(0, Math.min(1, (a - 1) / 6));
                        if (r(n, e, 3098 ^ i) > c(t))
                            continue;
                    }
                }
                if (l > 0) {
                    g.fillStyle = A, g.beginPath(), g.arc(o, t, 2 === l ? q : $, 0, 2 * Math.PI), g.fill();
                    continue;
                }
                let p = s(n, e, 273 ^ i, M), u = d(n, e, 546 ^ i, .63 * M, .5 * E), m = (.74 * (p < .38 ? d(n / 9, e / 1.3, 819 ^ i, 1, E) : p < .52 ? d(n / 1.3, e / 9, 1092 ^ i, 1, E) : p < .62 ? d((n + e) / 7, (n - e) / 1.4, 1365 ^ i, 1, E) : d(n, e, 1638 ^ i, 2.6, E)) + .2 * r(n, e, 2184 ^ i)) * (.12 + 1.15 * Math.pow(u, 1.5)), y = r(n, e, 1911 ^ i);
                if (m < L) {
                    y > .988 && (g.fillStyle = A, g.beginPath(), g.arc(o, t, $ * (.7 + 25 * (y - .988)), 0, 2 * Math.PI), g.fill());
                    continue;
                }
                let v = Math.min(1, (m - L) / Math.max(1e-4, T - L)), w = v * v * (3 - 2 * v), x = .6 + (q - .6) * w;
                y > .9985 && (x += 1.2 * (.5 + .5 * w)), x < .45 || (g.fillStyle = A, g.beginPath(), g.arc(o, t, x, 0, 2 * Math.PI), g.fill());
            } x.fn && x.fn(n, a, f, k); }); return { rerender: () => C.render(), stop: () => { C(), b.disconnect(); }, canvas: v, drawShots: T, shots: L }; }, "starDots", 0, function (e, { color: o = null, count: i = 220, twinkle: r = !0, progressRef: s = null } = {}) { let { c: d, ctx: c, ro: p } = n(e), u = Array.from({ length: i }, () => ({ x: Math.random(), y: Math.random(), s: .85 > Math.random() ? 2 : 3, p: Math.random() * Math.PI * 2, f: .4 + 1.2 * Math.random(), reveal: Math.random() })), h = a(e => { let n = d.clientWidth, a = d.clientHeight, i = o || l(.65); c.clearRect(0, 0, n, a); let p = s ? Math.max(0, Math.min(1, s.p)) : 1; for (let o of u) {
            if (o.reveal > p)
                continue;
            let l = r && !t.reducedMotion ? .25 + .75 * (.5 + .5 * Math.sin(e * o.f + o.p)) : .8;
            c.fillStyle = i.replace(/[\d.]+\)$/, `${(.8 * l).toFixed(3)})`), c.fillRect(o.x * n, o.y * a, o.s, o.s);
        } }); return { stop: () => { h(), p.disconnect(); }, canvas: d }; }]);
});
