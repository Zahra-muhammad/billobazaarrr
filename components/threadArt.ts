/**
 * The menu's flower art as living thread lines.
 *
 * The blooms and leaves are painted as an invisible mask, then a small WebGL shader draws them
 * as vertical maroon threads: solid where the flower is solid, broken and thinner where it is
 * light. The threads grow up from the bottom when the menu opens, sway gently all the time,
 * and bend away from the pointer. Without WebGL the same threads are drawn once, standing still.
 */

const INK: [number, number, number] = [59 / 255, 10 / 255, 10 / 255]; // #3B0A0A
const PITCH = 5; // px between threads (the original art's spacing)

/** The blooms + leaves mask, seeded so each side always gets the same flowers. */
function paintBlooms(c: CanvasRenderingContext2D, W: number, H: number, seed0: number) {
  let seed = seed0;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const bloom = (x: number, y: number, R: number) => {
    for (let layer = 0; layer < 4; layer++) {
      const r = R * (1 - layer * 0.22), k = 7 + layer * 2, rot = rnd() * 6;
      c.beginPath();
      for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.03) {
        const rr = r * (0.72 + 0.28 * Math.abs(Math.cos((k * t) / 2 + rot))) * (0.92 + rnd() * 0.08);
        const px = x + Math.cos(t) * rr, py = y + Math.sin(t) * rr;
        if (t === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fillStyle = `rgba(255,255,255,${layer % 2 ? 0.45 : 1})`;
      c.fill();
    }
    c.beginPath();
    c.arc(x, y, R * 0.14, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.fill();
  };
  const leaf = (x: number, y: number, L: number, ang: number) => {
    c.save();
    c.translate(x, y);
    c.rotate(ang);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(L * 0.5, -L * 0.28, L, 0);
    c.quadraticCurveTo(L * 0.5, L * 0.28, 0, 0);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.fill();
    c.restore();
  };
  let y = H * 0.08;
  while (y < H * 1.05) {
    const R = W * (0.34 + rnd() * 0.22), x = W * (0.18 + rnd() * 0.42);
    bloom(x, y, R);
    leaf(x + R * 0.6, y + R * 0.7, R * 0.9, 0.5 + rnd());
    if (rnd() > 0.4) bloom(x + R * (0.9 + rnd() * 0.4), y + R * 0.9, R * 0.5);
    y += R * (1.6 + rnd() * 0.5);
  }
}

/** No WebGL: the threads drawn once with the 2D canvas, standing still. */
function drawStatic(cv: HTMLCanvasElement, mask: HTMLCanvasElement, dpr: number, seed0: number) {
  const ctx = cv.getContext('2d');
  const mc = mask.getContext('2d');
  if (!ctx || !mc) return;
  const W = mask.width, H = mask.height;
  const data = mc.getImageData(0, 0, W, H).data;
  let seed = seed0;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#3B0A0A';
  for (let xx = 0; xx < W; xx += PITCH) {
    for (let yy = 0; yy < H; yy += 2) {
      const a = data[(yy * W + xx) * 4 + 3] / 255;
      if (a > 0.05 && (a > 0.9 ? rnd() > 0.06 : rnd() < a * 0.85)) ctx.fillRect(xx, yy, a > 0.9 ? 3 : 2, 2);
    }
  }
}

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uMask;
uniform vec2 uSize;     // canvas size in CSS px
uniform float uDpr;
uniform float uTime;
uniform float uGrow;    // 0 = no threads, 1 = fully grown
uniform vec3 uPointer;  // xy in CSS px, z = how strongly it pushes (0..1)
uniform vec3 uInk;
const float PITCH = ${PITCH.toFixed(1)};

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 p = vUv * uSize;
  // every thread sways a little, two slow waves travelling up the threads
  float sway = sin(p.y * 0.028 + uTime * 1.25 + p.x * 0.06) * 1.3
             + sin(p.y * 0.085 - uTime * 2.0 + p.x * 0.23) * 0.5;
  // the pointer pushes nearby threads aside
  vec2 d = p - uPointer.xy;
  float near = exp(-dot(d, d) / 4500.0) * uPointer.z;
  sway += near * 9.0 * d.x / sqrt(d.x * d.x + 400.0);
  float x = p.x - sway;
  float c = floor(x / PITCH);
  float cx = (c + 0.5) * PITCH;
  // the threads grow up from the bottom, each with its own ragged tip
  float grow = uGrow * (uSize.y + 160.0) - hash(vec2(c, 7.0)) * 160.0;
  if (uSize.y - p.y > grow) discard;
  // solid flower: thick thread with a few gaps; light parts: thin, broken thread
  float a = texture2D(uMask, vec2(cx, p.y) / uSize).a;
  if (a < 0.05) discard;
  float h = hash(vec2(c, floor(p.y / 2.0)));
  bool solid = a > 0.9;
  if (solid ? h < 0.06 : h > a * 0.85) discard;
  // inked look: each thread's thickness wobbles a little along its length
  float hw = (solid ? 1.5 : 1.0) * (0.8 + 0.4 * hash(vec2(c, floor(p.y / 6.0) + 91.0)));
  float aa = 0.6 / uDpr;
  float ink = 1.0 - smoothstep(hw - aa, hw + aa, abs(x - cx));
  gl_FragColor = vec4(uInk * ink, ink);
}`;

export type ThreadArt = {
  /** Re-measure the canvas and repaint the flowers (on open and on resize). */
  resize(): void;
  /** Start / stop the animation loop (sway + pointer). */
  start(): void;
  stop(): void;
  /** How far the threads have grown, 0..1. */
  setGrow(v: number): void;
  /** One still frame, fully grown (reduced motion). */
  renderStill(): void;
  destroy(): void;
};

export function createThreadArt(canvas: HTMLCanvasElement, seed: number, mirrored: boolean): ThreadArt {
  let gl: WebGLRenderingContext | null = null;
  let failed = false;
  let u: Record<string, WebGLUniformLocation | null> = {};
  let W = 0, H = 0, dpr = 1;
  let raf = 0, t0 = 0, time = 0, running = false;
  let grow = 1;
  const ptr = { x: -9999, y: -9999, tx: -9999, ty: -9999, s: 0, ts: 0 };

  function init(): boolean {
    if (gl) return true;
    if (failed) return false;
    const ctx = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!ctx || ctx.isContextLost()) { failed = true; return false; }
    const shader = (type: number, src: string) => {
      const s = ctx.createShader(type)!;
      ctx.shaderSource(s, src);
      ctx.compileShader(s);
      return ctx.getShaderParameter(s, ctx.COMPILE_STATUS) ? s : null;
    };
    const vs = shader(ctx.VERTEX_SHADER, VERT), fs = shader(ctx.FRAGMENT_SHADER, FRAG);
    const prog = ctx.createProgram();
    if (!vs || !fs || !prog) { failed = true; return false; }
    ctx.attachShader(prog, vs);
    ctx.attachShader(prog, fs);
    ctx.linkProgram(prog);
    if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) { failed = true; return false; }
    ctx.useProgram(prog);
    // one triangle that covers the whole canvas
    const buf = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), ctx.STATIC_DRAW);
    const loc = ctx.getAttribLocation(prog, 'aPos');
    ctx.enableVertexAttribArray(loc);
    ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
    const tex = ctx.createTexture();
    ctx.bindTexture(ctx.TEXTURE_2D, tex);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
    for (const name of ['uMask', 'uSize', 'uDpr', 'uTime', 'uGrow', 'uPointer', 'uInk']) u[name] = ctx.getUniformLocation(prog, name);
    ctx.uniform1i(u.uMask, 0);
    ctx.uniform3f(u.uInk, INK[0], INK[1], INK[2]);
    gl = ctx;
    return true;
  }

  function draw() {
    if (!gl || !W || !H) return;
    gl.uniform2f(u.uSize, W, H);
    gl.uniform1f(u.uDpr, dpr);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uGrow, grow);
    gl.uniform3f(u.uPointer, ptr.x, ptr.y, ptr.s);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    time = (now - t0) / 1000;
    ptr.x += (ptr.tx - ptr.x) * 0.15;
    ptr.y += (ptr.ty - ptr.y) * 0.15;
    ptr.s += (ptr.ts - ptr.s) * 0.08;
    draw();
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', onLeave);
  }

  // pointer position in this canvas's own (unmirrored) coordinates
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const lx = mirrored ? r.right - e.clientX : e.clientX - r.left;
    const ly = e.clientY - r.top;
    const inside = lx > -80 && lx < r.width + 80 && ly > -80 && ly < r.height + 80;
    if (ptr.s < 0.02) { ptr.x = lx; ptr.y = ly; } // arriving: start where the pointer is
    ptr.tx = lx;
    ptr.ty = ly;
    ptr.ts = inside ? 1 : 0;
  };
  const onLeave = () => { ptr.ts = 0; };

  return {
    resize() {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      if (!W || !H) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const mask = document.createElement('canvas');
      mask.width = W;
      mask.height = H;
      const mc = mask.getContext('2d', { willReadFrequently: true });
      if (!mc) return;
      paintBlooms(mc, W, H, seed);
      if (init() && gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
        draw();
      } else {
        drawStatic(canvas, mask, dpr, seed);
      }
    },
    start() {
      if (running || !gl) return;
      running = true;
      t0 = performance.now() - time * 1000;
      ptr.s = ptr.ts = 0;
      window.addEventListener('pointermove', onMove);
      document.documentElement.addEventListener('pointerleave', onLeave);
      raf = requestAnimationFrame(frame);
    },
    stop,
    setGrow(v: number) {
      grow = v;
      if (!running) draw();
    },
    renderStill() {
      grow = 1;
      time = 0;
      ptr.s = 0;
      draw();
    },
    // Only stops: the canvas keeps its WebGL context, so a remount (React dev mode mounts twice)
    // can pick the same context up again instead of finding it lost.
    destroy() {
      stop();
    },
  };
}
