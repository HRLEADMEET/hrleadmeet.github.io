(function (root) {
'use strict';
var TW = 64, TH = 32, N = 10, ROAD = [0, 3, 6, 9];
var COL = {
AI: ['#2D8CFF', '#1A5FBF', '#164E9E'], H: ['#FFD38A', '#D9A24F', '#B98334'],
M: ['#22C55E', '#15803D', '#166534'], N: ['#8DBFFF', '#2D7CE0', '#1F62B8'], F: ['#17407F', '#102F5E', '#0C2549']
};
var DEPTS = [
{ id: 'find', bx: 0, by: 1, label: 'Поиск', c: 'AI', h: 62, ly: 0 },
{ id: 'research', bx: 1, by: 0, label: 'Исследование', c: 'AI', h: 84, ly: 0 },
{ id: 'message', bx: 2, by: 0, label: 'Сообщение', c: 'AI', h: 60, ly: 0 },
{ id: 'meet', bx: 2, by: 1, label: 'Встреча', c: 'H', h: 78, ly: 0 },
{ id: 'pay', bx: 1, by: 2, label: 'Оплата', c: 'M', h: 90, ly: 0 },
{ id: 'core', bx: 1, by: 1, label: 'Ваш бизнес', c: 'N', h: 150, ly: 0, core: true, below: true }
];
var FILL = [[0, 0], [2, 2], [0, 2]];
var ARCS = [['find', 'research'], ['research', 'message'], ['message', 'meet'], ['meet', 'pay'], ['pay', 'core']];
var LEAD = { find: '#9CC3F5', research: '#5AA9FF', message: '#FFD38A', meet: '#7DE3A8', pay: '#22C55E', core: null };
var DOOR = {};
DEPTS.forEach(function (d) { DOOR[d.id] = [d.bx + 1, d.by + 1]; });
function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function bfs(a, b) {
if (a[0] === b[0] && a[1] === b[1]) return [];
var q = [[a[0], a[1], null]], seen = {}, k;
seen[a[0] + ',' + a[1]] = 1;
while (q.length) {
var cur = q.shift();
if (cur[0] === b[0] && cur[1] === b[1]) {
var path = [];
while (cur && cur[2]) { path.unshift([cur[0], cur[1]]); cur = cur[2]; }
return path;
}
[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
var x = cur[0] + d[0], y = cur[1] + d[1]; k = x + ',' + y;
if (x < 0 || y < 0 || x > 3 || y > 3 || seen[k]) return;
seen[k] = 1; q.push([x, y, cur]);
});
}
return [];
}
function makeBox(gx, gy, w, d, h, col, rnd, lit) {
var wins = [], cols = Math.max(2, Math.round(w * 3)), rows = Math.max(2, Math.round(h / 12)), i, j, f;
for (f = 0; f < 2; f++) for (i = 0; i < (f ? Math.max(2, Math.round(d * 3)) : cols); i++) for (j = 0; j < rows; j++) {
if (rnd() < lit) wins.push([f, (i + .5) / (f ? Math.max(2, Math.round(d * 3)) : cols), (j + .6) / (rows + .4)]);
}
return { gx: gx, gy: gy, w: w, d: d, h: h, col: col, wins: wins };
}
function build() {
var rnd = rng(7), boxes = [], items = [];
DEPTS.forEach(function (d) {
var gx = 1 + 3 * d.bx, gy = 1 + 3 * d.by, cx = gx + 1, cy = gy + 1;
var fw = d.core ? 1.2 : 1.1, fo = (2 - fw) / 2;
boxes.push({ b: makeBox(gx + fo, gy + fo, fw, fw, d.h, COL[d.c], rnd, d.core ? .6 : .42), d: d });
if (d.core) {
boxes.push({ b: makeBox(gx, gy, 2, 2, 8, COL.F, rnd, 0), d: null });
[[gx + .05, gy + .05], [gx + 1.5, gy + .05], [gx + .05, gy + 1.5], [gx + 1.5, gy + 1.5]].forEach(function (p) {
boxes.push({ b: makeBox(p[0], p[1], .45, .45, 26 + rnd() * 20, COL.F, rnd, .4), d: null });
});
} else {
boxes.push({ b: makeBox(gx + (rnd() < .5 ? .05 : 1.55), gy + (rnd() < .5 ? .05 : 1.55), .4, .4, 16 + rnd() * 16, COL.F, rnd, .35), d: null });
}
});
FILL.forEach(function (f) {
var gx = 1 + 3 * f[0], gy = 1 + 3 * f[1], n = 3 + Math.floor(rnd() * 2), i;
for (i = 0; i < n; i++) {
var w = .6 + rnd() * .5, d = .6 + rnd() * .5;
boxes.push({ b: makeBox(gx + rnd() * (2 - w), gy + rnd() * (2 - d), w, d, 14 + rnd() * 44, COL.F, rnd, .4), d: null });
}
});
return boxes;
}
function makeAgents(n, humans, rnd) {
var list = [], i;
function mk(human) {
var route = human ? ['meet', 'pay', 'core'] : ['core', 'find', 'research', 'message'];
var ri = Math.floor(rnd() * route.length), node = DOOR[route[ri]].slice();
return { human: human, route: route, ri: ri, node: node, from: node, path: [], t: 0,
speed: .8 + rnd() * .55, wait: rnd() * 1.4, lane: (rnd() - .5) * .38, lead: LEAD[route[ri]] };
}
for (i = 0; i < n; i++) list.push(mk(false));
for (i = 0; i < humans; i++) list.push(mk(true));
return list;
}
function step(a, dt, rnd) {
if (a.wait > 0) {
a.wait -= dt;
if (a.wait <= 0) {
a.ri = (a.ri + 1) % a.route.length;
a.path = bfs(a.node, DOOR[a.route[a.ri]]);
a.t = 0; a.from = a.node;
if (!a.path.length) a.wait = .4;
}
return;
}
if (!a.path.length) { a.wait = .5 + rnd() * .8; a.lead = LEAD[a.route[a.ri]]; return; }
var to = a.path[0];
a.t += a.speed * dt / 3;
if (a.t >= 1) { a.node = to; a.from = to; a.path.shift(); a.t = 0; if (!a.path.length) { a.wait = .5 + rnd() * .8; a.lead = LEAD[a.route[a.ri]]; } }
}
function mount(canvas, opts) {
opts = opts || {};
var ctx = canvas.getContext('2d'), boxes = build(), rnd = rng(11), W = 0, H = 0, s = 1, ox = 0, oy = 0, dpr = 1;
var agents = null, last = 0, running = false, raf = 0, t0 = performance.now(), alpha = opts.alpha == null ? 1 : opts.alpha;
var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
function P(gx, gy, z) { return [ox + (gx - gy) * TW / 2 * s, oy + (gx + gy) * TH / 2 * s - (z || 0) * s]; }
function resize() {
var r = canvas.getBoundingClientRect();
dpr = Math.min(2, root.devicePixelRatio || 1);
W = Math.max(200, r.width); H = Math.max(160, r.height);
canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
var cw = N * TW, ch = N * TH + 150;
s = Math.min(W * .96 / cw, H * .94 / ch) * (opts.zoom || 1);
if (opts.maxHeightFrac) s = Math.min(s, opts.maxHeightFrac * H / ch);
ox = W / 2;
oy = opts.anchor === 'bottom' ? H - (N * TH) * s - 6 * s : (H - ch * s) / 2 + 140 * s;
var wide = W >= 700;
if (!agents) agents = makeAgents(wide ? 26 : 14, wide ? 2 : 1, rnd);
draw(0);
}
function diamond(gx, gy, w, d, fill) {
var a = P(gx, gy), b = P(gx + w, gy), c = P(gx + w, gy + d), e = P(gx, gy + d);
ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(e[0], e[1]); ctx.closePath();
ctx.fillStyle = fill; ctx.fill();
}
function drawBox(bx) {
var b = bx.b, c = b.col, p0 = P(b.gx, b.gy + b.d, 0), p1 = P(b.gx + b.w, b.gy + b.d, 0), p2 = P(b.gx + b.w, b.gy, 0);
var h = b.h * s;
ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p1[0], p1[1] - h); ctx.lineTo(p0[0], p0[1] - h); ctx.closePath();
ctx.fillStyle = c[1]; ctx.fill();
ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p2[0], p2[1] - h); ctx.lineTo(p1[0], p1[1] - h); ctx.closePath();
ctx.fillStyle = c[2]; ctx.fill();
var t0p = P(b.gx, b.gy, b.h), t1 = P(b.gx + b.w, b.gy, b.h), t2 = P(b.gx + b.w, b.gy + b.d, b.h), t3 = P(b.gx, b.gy + b.d, b.h);
ctx.beginPath(); ctx.moveTo(t0p[0], t0p[1]); ctx.lineTo(t1[0], t1[1]); ctx.lineTo(t2[0], t2[1]); ctx.lineTo(t3[0], t3[1]); ctx.closePath();
ctx.fillStyle = c[0]; ctx.fill();
ctx.fillStyle = '#FFE2A8'; ctx.globalAlpha = alpha * .8;
var ws = Math.max(1, 1.5 * s), k, w, pt;
for (k = 0; k < b.wins.length; k++) {
w = b.wins[k];
pt = w[0] === 0 ? P(b.gx + w[1] * b.w, b.gy + b.d, w[2] * b.h) : P(b.gx + b.w, b.gy + w[1] * b.d, w[2] * b.h);
ctx.fillRect(pt[0] - ws / 2, pt[1] - ws / 2, ws, ws);
}
ctx.globalAlpha = alpha;
}
function drawAgent(a) {
var x, y, inside = a.wait > 0, fx = ROAD[a.from[0]], fy = ROAD[a.from[1]];
if (a.path.length) {
var to = a.path[0], tx = ROAD[to[0]], ty = ROAD[to[1]];
x = fx + (tx - fx) * a.t; y = fy + (ty - fy) * a.t;
if (tx !== fx) y += a.lane; else x += a.lane;
} else { x = fx + a.lane * .6; y = fy + a.lane * .6; }
var p = P(x, y, 0), u = Math.max(1.35, s * 1.9);
ctx.globalAlpha = alpha * (inside ? .35 : 1);
ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 3.4 * u, 1.6 * u, 0, 0, 6.3); ctx.fill();
ctx.fillStyle = a.human ? '#FFD38A' : '#7FE3FF';
ctx.fillRect(p[0] - 1.5 * u, p[1] - 6 * u, 3 * u, 6 * u);
ctx.beginPath(); ctx.arc(p[0], p[1] - 8 * u, 2.3 * u, 0, 6.3); ctx.fillStyle = a.human ? '#FFF1D2' : '#EAF9FF'; ctx.fill();
if (a.lead && !inside) { ctx.beginPath(); ctx.arc(p[0], p[1] - 13.5 * u, 1.9 * u, 0, 6.3); ctx.fillStyle = a.lead; ctx.fill(); }
ctx.globalAlpha = alpha;
}
function label(d, time) {
var gx = 1 + 3 * d.bx + 1, gy = 1 + 3 * d.by + 1, p = P(gx, gy, d.h);
var fs = Math.max(9.5, Math.min(15, 11.5 * s * 1.3)) * (d.core ? 1.15 : 1);
ctx.font = '700 ' + fs + 'px Manrope, "Helvetica Neue", Arial, sans-serif';
var tw = ctx.measureText(d.label).width, pw = tw + fs * 1.1, ph = fs * 1.7, x = p[0] - pw / 2, y = p[1] - ph - (14 + (-d.ly || 0)) * s;
if (d.below) { var pb = P(gx, gy, 0); y = pb[1] + 8 * s; p = [pb[0], y + ph]; }
ctx.beginPath();
if (ctx.roundRect) ctx.roundRect(x, y, pw, ph, ph / 2); else ctx.rect(x, y, pw, ph);
ctx.fillStyle = 'rgba(8,18,40,.9)'; ctx.fill();
ctx.lineWidth = 1; ctx.strokeStyle = d.c === 'H' ? '#FFD38A' : d.c === 'M' ? '#22C55E' : d.core ? '#FFD38A' : 'rgba(120,170,255,.65)'; ctx.stroke();
ctx.fillStyle = COL_TEXT; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
ctx.fillText(d.label, p[0], y + ph / 2 + .5);
}
var COL_TEXT = '#F2F6FF';
function core() { return DEPTS[5]; }
function draw(time) {
ctx.clearRect(0, 0, W, H);
ctx.globalAlpha = alpha;
var i, j;
for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
var road = ROAD.indexOf(i) >= 0 || ROAD.indexOf(j) >= 0;
diamond(i, j, 1, 1, road ? 'rgba(255,255,255,.08)' : 'rgba(45,140,255,.12)');
}
var c0 = core(), pulse = (Math.sin(time * .0022) + 1) / 2, base = P(1 + 3 * c0.bx + 1, 1 + 3 * c0.by + 1, 0);
ctx.beginPath(); ctx.ellipse(base[0], base[1], (50 + pulse * 18) * s, (25 + pulse * 9) * s, 0, 0, 6.3);
ctx.strokeStyle = 'rgba(255,211,138,' + (.5 - pulse * .3) + ')'; ctx.lineWidth = 1.2; ctx.stroke();
ARCS.forEach(function (ar, k) {
var A = DEPTS.filter(function (d) { return d.id === ar[0]; })[0], B = DEPTS.filter(function (d) { return d.id === ar[1]; })[0];
var pa = P(1 + 3 * A.bx + 1, 1 + 3 * A.by + 1, A.h + 6), pb = P(1 + 3 * B.bx + 1, 1 + 3 * B.by + 1, B.h + 6);
var cx = (pa[0] + pb[0]) / 2, cy = Math.min(pa[1], pb[1]) - 34 * s;
ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.quadraticCurveTo(cx, cy, pb[0], pb[1]);
ctx.strokeStyle = 'rgba(127,227,255,.3)'; ctx.lineWidth = 1; ctx.stroke();
var q;
for (q = 0; q < 2; q++) {
var t = (time * .00028 + q * .5 + k * .17) % 1, m = 1 - t;
var x = m * m * pa[0] + 2 * m * t * cx + t * t * pb[0], y = m * m * pa[1] + 2 * m * t * cy + t * t * pb[1];
ctx.beginPath(); ctx.arc(x, y, Math.max(1.4, 2.2 * s), 0, 6.3); ctx.fillStyle = '#7FE3FF'; ctx.fill();
}
});
var q2 = [];
boxes.forEach(function (b) { q2.push({ z: b.b.gx + b.b.w + b.b.gy + b.b.d, f: function () { drawBox(b); } }); });
agents.forEach(function (a) {
var gx = ROAD[a.from[0]], gy = ROAD[a.from[1]];
if (a.path.length) { gx += (ROAD[a.path[0][0]] - gx) * a.t; gy += (ROAD[a.path[0][1]] - gy) * a.t; }
q2.push({ z: gx + gy + .3, f: function () { drawAgent(a); } });
});
q2.sort(function (p, r) { return p.z - r.z; });
q2.forEach(function (it) { it.f(); });
var keep = alpha; alpha = keep * .55;
agents.forEach(function (a) { if (a.wait <= 0) drawAgent(a); });
alpha = keep; ctx.globalAlpha = alpha;
var top = P(1 + 3 * c0.bx + 1, 1 + 3 * c0.by + 1, c0.h + 8);
var beam = ctx.createLinearGradient(0, top[1], 0, top[1] - 170 * s);
beam.addColorStop(0, 'rgba(255,211,138,.28)'); beam.addColorStop(1, 'rgba(255,211,138,0)');
ctx.fillStyle = beam; ctx.fillRect(top[0] - 7 * s, top[1] - 170 * s, 14 * s, 170 * s);
var glow = ctx.createRadialGradient(top[0], top[1], 0, top[0], top[1], (16 + pulse * 6) * s);
glow.addColorStop(0, 'rgba(255,226,168,1)'); glow.addColorStop(1, 'rgba(255,211,138,0)');
ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(top[0], top[1], (16 + pulse * 6) * s, 0, 6.3); ctx.fill();
DEPTS.forEach(function (d) { label(d, time); });
if (opts.legend) {
var fs = Math.max(10, Math.min(12.5, 10.5 * s * 1.3)), lx = 10, ly = H - 12 - fs * 3.3, rows = [['#7FE3FF', 'ИИ-агенты ищут, изучают, пишут'], ['#FFD38A', 'Человек проводит встречу'], ['#22C55E', 'Деньги приходят вам']];
ctx.font = '600 ' + fs + 'px Manrope, "Helvetica Neue", Arial, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
rows.forEach(function (r, i) {
ctx.beginPath(); ctx.arc(lx + 4, ly + i * fs * 1.45, 3.4, 0, 6.3); ctx.fillStyle = r[0]; ctx.fill();
ctx.fillStyle = 'rgba(230,238,252,.92)'; ctx.fillText(r[1], lx + 14, ly + i * fs * 1.45 + .5);
});
}
ctx.globalAlpha = 1;
}
function loop(now) {
if (!running) return;
var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
agents.forEach(function (a) { step(a, dt, rnd); });
draw(now - t0);
raf = root.requestAnimationFrame(loop);
}
function start() { if (running || reduce) return; running = true; last = 0; raf = root.requestAnimationFrame(loop); }
function stop() { running = false; root.cancelAnimationFrame(raf); }
resize();
var ro = root.ResizeObserver ? new root.ResizeObserver(resize) : null;
if (ro) ro.observe(canvas); else root.addEventListener('resize', resize);
var io = root.IntersectionObserver ? new root.IntersectionObserver(function (e) { (e[0].isIntersecting && !document.hidden) ? start() : stop(); }) : null;
if (io) io.observe(canvas); else start();
document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
return { stop: stop, start: start, _agents: function () { return agents; }, _advance: function (sec) { for (var i = 0; i < sec / .05; i++) agents.forEach(function (a) { step(a, .05, rnd); }); draw(performance.now() - t0); } };
}
root.LMCity = { mount: mount, version: '1.0' };
})(typeof window !== 'undefined' ? window : this);
