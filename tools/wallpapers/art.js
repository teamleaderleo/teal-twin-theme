// Teal Twin wallpapers: original abstract art, drawn with the canvas 2D API.
// Usage: art.html?kind=waves&mode=dark&w=2560&h=1600&q=0.86
// Writes the WebP data URL into <pre id="out"> for --dump-dom.
(function () {
  const params = new URLSearchParams(location.search);
  const kind = params.get("kind");
  const mode = params.get("mode");
  const W = +params.get("w"), H = +params.get("h");
  const q = +(params.get("q") || 0.86);
  const S = W / 2560; // scale: every size below is written for 2560 wide

  const P = mode === "dark"
    ? { bg: "#0e1719", bg2: "#0a1214", teal: "#39c5bb", tealHi: "#7de3da", pink: "#ff7eb9", pinkHi: "#ffa6cf", ink: "#ddf3f0", faint: 0.10 }
    : { bg: "#f7fcfb", bg2: "#e4f5f3", teal: "#39c5bb", tealHi: "#0a766f", pink: "#e12885", pinkHi: "#ff7eb9", ink: "#1a2e31", faint: 0.12 };

  let seed = [...(kind + mode)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");

  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }
  function base() {
    const lg = g.createLinearGradient(0, 0, W, H);
    lg.addColorStop(0, P.bg2); lg.addColorStop(0.55, P.bg); lg.addColorStop(1, P.bg2);
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    glow(W * 0.18, H * 0.2, W * 0.45, P.teal, mode === "dark" ? 0.16 : 0.18);
    glow(W * 0.85, H * 0.85, W * 0.4, P.pink, mode === "dark" ? 0.12 : 0.10);
  }
  function glow(x, y, r, color, a) {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, rgba(color, a)); rg.addColorStop(1, rgba(color, 0));
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
  }
  function grain(amount) {
    // a light film grain so gradients do not band
    const img = g.getImageData(0, 0, W, H), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rnd() - 0.5) * amount;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
  }

  const kinds = {
    // Layered flowing waves, teal in front of pink.
    waves() {
      base();
      const layers = 9;
      for (let i = 0; i < layers; i++) {
        const t = i / (layers - 1);
        const color = i % 3 === 2 ? P.pink : P.teal;
        const y0 = H * (0.42 + t * 0.4);
        const amp = H * (0.05 + 0.05 * Math.sin(i * 1.7));
        const freq = 1.2 + i * 0.13, phase = i * 0.9;
        g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W; x += 8 * S) {
          const u = x / W;
          g.lineTo(x, y0 + amp * Math.sin(u * Math.PI * 2 * freq + phase) + amp * 0.4 * Math.sin(u * Math.PI * 5.3 + phase * 2));
        }
        g.lineTo(W, H); g.closePath();
        const lg = g.createLinearGradient(0, y0 - amp, 0, H);
        lg.addColorStop(0, rgba(color, mode === "dark" ? 0.16 : 0.15)); lg.addColorStop(0.6, rgba(color, 0.03)); lg.addColorStop(1, rgba(color, 0));
        g.fillStyle = lg; g.fill();
        g.strokeStyle = rgba(i % 3 === 2 ? P.pinkHi : P.tealHi, mode === "dark" ? 0.35 : 0.30);
        g.lineWidth = 2 * S; g.stroke();
      }
      grain(6);
    },
    // A sound wave across the middle, bars fading from teal to pink, with a mirror.
    soundwave() {
      base();
      const bars = 160, gap = W / bars, mid = H * 0.5;
      const lg = g.createLinearGradient(0, 0, W, 0);
      lg.addColorStop(0, P.teal); lg.addColorStop(0.5, P.tealHi); lg.addColorStop(1, P.pink);
      for (let i = 0; i < bars; i++) {
        const u = i / bars;
        const env = Math.pow(Math.sin(Math.PI * u), 1.4);
        const h = H * 0.32 * env * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.113) + 0.3 * Math.sin(i * 1.9)));
        const x = i * gap + gap * 0.2, w = gap * 0.55;
        g.fillStyle = lg; g.globalAlpha = mode === "dark" ? 0.85 : 0.75;
        roundRect(x, mid - h, w, h, w / 2); g.fill();
        g.globalAlpha = 0.22;
        roundRect(x, mid + 6 * S, w, h * 0.55, w / 2); g.fill();
      }
      g.globalAlpha = 1;
      g.strokeStyle = rgba(P.ink, 0.12); g.lineWidth = 2 * S;
      g.beginPath(); g.moveTo(0, mid + 3 * S); g.lineTo(W, mid + 3 * S); g.stroke();
      grain(5);
    },
    // Musical notes floating over faint staff lines.
    notes() {
      base();
      for (let s = 0; s < 3; s++) {
        const top = H * (0.22 + s * 0.26), step = 22 * S;
        g.strokeStyle = rgba(s === 1 ? P.pink : P.teal, mode === "dark" ? 0.18 : 0.22);
        g.lineWidth = 2 * S;
        for (let l = 0; l < 5; l++) {
          g.beginPath();
          for (let x = 0; x <= W; x += 10 * S) {
            const y = top + l * step + 40 * S * Math.sin(x / W * Math.PI * 2 + s);
            x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
          }
          g.stroke();
        }
      }
      for (let i = 0; i < 46; i++) {
        const x = rnd() * W, y = rnd() * H, size = (26 + rnd() * 46) * S;
        const color = rnd() < 0.4 ? P.pink : P.teal;
        g.globalAlpha = 0.25 + rnd() * 0.5;
        note(x, y, size, color, rnd() < 0.35, rnd() * 0.5 - 0.25);
      }
      g.globalAlpha = 1;
      grain(5);
    },
    // Two bundles of long ribbons, each hanging from its own pink bow and swaying down.
    ribbons() {
      base();
      for (const side of [-1, 1]) {
        const bx = W * 0.5 + side * W * 0.26, by = H * 0.16;
        for (let k = 0; k < 9; k++) {
          const off = (k - 4) * 18 * S;
          g.beginPath();
          g.moveTo(bx + off * 0.3, by);
          g.bezierCurveTo(
            bx + side * W * 0.05 + off, by + H * 0.22,
            bx - side * W * 0.07 + off * 1.3, by + H * 0.45,
            bx + side * W * 0.01 + off * 1.6, by + H * 0.62);
          g.bezierCurveTo(
            bx + side * W * 0.08 + off * 1.8, by + H * 0.75,
            bx + side * W * 0.04 + off * 2.0, by + H * 0.82,
            bx + side * W * 0.10 + off * 2.4, H * 1.02);
          const lg = g.createLinearGradient(0, by, 0, H);
          lg.addColorStop(0, rgba(P.tealHi, mode === "dark" ? 0.6 : 0.65));
          lg.addColorStop(0.7, rgba(P.teal, 0.32));
          lg.addColorStop(1, rgba(P.teal, 0.04));
          g.strokeStyle = lg;
          g.lineWidth = (k === 4 ? 16 : 3 + (k % 3) * 2.5) * S;
          g.lineCap = "round";
          g.stroke();
        }
        glow(bx, by, 300 * S, P.pink, 0.16);
        for (const s of [-1, 1]) {
          g.beginPath();
          g.ellipse(bx + s * 62 * S, by, 64 * S, 30 * S, s * 0.4, 0, Math.PI * 2);
          g.fillStyle = rgba(P.pink, mode === "dark" ? 0.78 : 0.82); g.fill();
        }
        g.beginPath(); g.arc(bx, by, 20 * S, 0, Math.PI * 2); g.fillStyle = P.pinkHi; g.fill();
      }
      grain(5);
    },
    // A halftone dot grid, dots swelling toward a teal corner and a pink corner.
    halftone() {
      base();
      const step = 34 * S;
      for (let y = step / 2; y < H; y += step) {
        for (let x = step / 2; x < W; x += step) {
          const dt = Math.hypot(x - W * 0.1, y - H * 0.15) / W;
          const dp = Math.hypot(x - W * 0.92, y - H * 0.9) / W;
          const t = Math.max(0, 1 - dt * 1.6), p = Math.max(0, 1 - dp * 1.6);
          const r = step * 0.42 * Math.max(t, p) + 1.2 * S;
          g.fillStyle = rgba(t >= p ? P.teal : P.pink, mode === "dark" ? 0.12 + 0.5 * Math.max(t, p) : 0.14 + 0.45 * Math.max(t, p));
          g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        }
      }
      // a thin grid over it
      g.strokeStyle = rgba(P.ink, 0.05); g.lineWidth = 1 * S;
      for (let x = 0; x < W; x += step * 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      for (let y = 0; y < H; y += step * 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    },
    // The sidebar header: a short strip of ribbons, a sound wave and two notes.
    header() {
      const lg = g.createLinearGradient(0, 0, W, H);
      lg.addColorStop(0, P.bg2); lg.addColorStop(1, P.bg);
      g.fillStyle = lg; g.fillRect(0, 0, W, H);
      glow(W * 0.15, H * 0.3, W * 0.6, P.teal, 0.28);
      glow(W * 0.9, H * 0.8, W * 0.5, P.pink, 0.22);
      const bars = 48, gap = W / bars, mid = H * 0.62;
      const bl = g.createLinearGradient(0, 0, W, 0);
      bl.addColorStop(0, P.teal); bl.addColorStop(1, P.pink);
      for (let i = 0; i < bars; i++) {
        const u = i / bars;
        const h = H * 0.42 * Math.pow(Math.sin(Math.PI * u), 1.2) * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.61) + 0.4 * Math.cos(i * 1.3)) / 1.4);
        g.fillStyle = bl; g.globalAlpha = 0.8;
        roundRect(i * gap + gap * 0.2, mid - h, gap * 0.55, h, gap * 0.27); g.fill();
      }
      g.globalAlpha = 1;
      for (let k = 0; k < 3; k++) {
        g.beginPath(); g.moveTo(0, H * (0.25 + k * 0.08));
        g.bezierCurveTo(W * 0.3, H * (0.05 + k * 0.1), W * 0.6, H * (0.9 - k * 0.1), W, H * (0.3 + k * 0.08));
        g.strokeStyle = rgba(k === 1 ? P.pink : P.tealHi, 0.45); g.lineWidth = (k === 1 ? 5 : 2.5) * (W / 1200); g.stroke();
      }
      note(W * 0.86, H * 0.42, H * 0.22, P.pink, true, 0.1);
      note(W * 0.1, H * 0.48, H * 0.18, P.teal, false, -0.1);
    },
  };

  function roundRect(x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  // An eighth note (or two beamed eighths), head at (x, y), drawn from shapes.
  function note(x, y, size, color, beamed, tilt) {
    g.save(); g.translate(x, y); g.rotate(tilt);
    g.fillStyle = color; g.strokeStyle = color; g.lineWidth = size * 0.09; g.lineCap = "round";
    const heads = beamed ? [0, size * 1.1] : [0];
    for (const dx of heads) {
      g.beginPath(); g.ellipse(dx, 0, size * 0.36, size * 0.26, -0.45, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(dx + size * 0.31, -size * 0.08); g.lineTo(dx + size * 0.31, -size * 1.35); g.stroke();
    }
    if (beamed) {
      g.lineWidth = size * 0.2;
      g.beginPath(); g.moveTo(size * 0.31, -size * 1.3); g.lineTo(size * 1.41, -size * 1.42); g.stroke();
    } else {
      g.beginPath(); g.moveTo(size * 0.31, -size * 1.35);
      g.quadraticCurveTo(size * 0.95, -size * 0.95, size * 0.7, -size * 0.45); g.stroke();
    }
    g.restore();
  }

  kinds[kind]();
  document.getElementById("out").textContent = c.toDataURL("image/webp", q);
})();
