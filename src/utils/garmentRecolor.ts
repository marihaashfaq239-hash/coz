import { Product } from '../data/products';

const recolorCache = new Map<string, string>();
const inFlightCache = new Map<string, Promise<string>>();

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '').trim();
  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [200, 200, 200];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) {
    return [0, 0, l];
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    case bn:
      h = (rn - gn) / d + 4;
      break;
  }

  return [h * 60, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = (((h % 360) + 360) % 360) / 360;
  const sat = Math.max(0, Math.min(1, s));
  const lig = Math.max(0, Math.min(1, l));

  if (sat === 0) {
    const v = Math.round(lig * 255);
    return [v, v, v];
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = lig < 0.5 ? lig * (1 + sat) : lig + sat - lig * sat;
  const p = 2 * lig - q;

  return [
    Math.round(hue2rgb(p, q, hue + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hue) * 255),
    Math.round(hue2rgb(p, q, hue - 1 / 3) * 255),
  ];
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Skin detector tuned across fair, olive, tan, and deep complexions.
 */
function isSkinPixel(
  r: number,
  g: number,
  b: number,
  h: number,
  s: number,
  l: number
): boolean {
  if (l < 0.1 || l > 0.88) return false;
  const inWarmHue = h <= 44 || h >= 346;
  if (!inWarmHue) return false;
  if (r - g >= 12 && r - b >= 20 && s >= 0.13) return true;
  if (r > g + 8 && g > b + 6 && s >= 0.2 && l <= 0.48) return true;
  return false;
}

/**
 * Per-row side-aware studio wall + floor flood-fill starting from outer margins.
 * Measures exact studio wall color on every row y (left & right independently)
 * so shadowed white garments never get mistaken for darker left-hand studio walls.
 */
function computeStudioBackgroundMask(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  isModelShot: boolean
): Uint8Array {
  const total = w * h;
  const bg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  // Per-row wall reference RGB from outer 6px left & right margins
  const leftWallR = new Float32Array(h);
  const leftWallG = new Float32Array(h);
  const leftWallB = new Float32Array(h);
  const rightWallR = new Float32Array(h);
  const rightWallG = new Float32Array(h);
  const rightWallB = new Float32Array(h);

  for (let y = 0; y < h; y++) {
    let lr = 0;
    let lg = 0;
    let lb = 0;
    let rr = 0;
    let rg = 0;
    let rb = 0;
    const sampleCount = 4;
    for (let k = 0; k < sampleCount; k++) {
      const li = (y * w + Math.min(w - 1, k * 2 + 2)) * 4;
      lr += data[li];
      lg += data[li + 1];
      lb += data[li + 2];

      const ri = (y * w + Math.max(0, w - 3 - k * 2)) * 4;
      rr += data[ri];
      rg += data[ri + 1];
      rb += data[ri + 2];
    }
    leftWallR[y] = lr / sampleCount;
    leftWallG[y] = lg / sampleCount;
    leftWallB[y] = lb / sampleCount;
    rightWallR[y] = rr / sampleCount;
    rightWallG[y] = rg / sampleCount;
    rightWallB[y] = rb / sampleCount;
  }

  const pushIfValid = (
    px: number,
    py: number,
    prevR: number,
    prevG: number,
    prevB: number,
    isSeed: boolean
  ) => {
    const pIdx = py * w + px;
    if (bg[pIdx]) return;

    // Never allow wall flood-fill to enter core subject torso area on model photos
    if (isModelShot) {
      const xr = px / w;
      const yr = py / h;
      if (xr >= 0.41 && xr <= 0.59 && yr >= 0.19 && yr <= 0.44) {
        return;
      }
    }

    const i = pIdx * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const chroma = maxC - minC;

    // Studio walls & grey floors have minimal saturation
    if (chroma > 22) return;

    const useRight = px >= w * 0.5;
    const wr = useRight ? rightWallR[py] : leftWallR[py];
    const wg = useRight ? rightWallG[py] : leftWallG[py];
    const wb = useRight ? rightWallB[py] : leftWallB[py];

    const lum = (r + g + b) / 3;
    const wallLum = (wr + wg + wb) / 3;

    // Stop cleanly whenever fabric is brighter than that row's studio wall
    if (!isSeed && lum > wallLum + 8) return;

    const wallDiff =
      Math.abs(r - wr) + Math.abs(g - wg) + Math.abs(b - wb);
    const neighborDiff =
      Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);

    if (isSeed ? wallDiff < 36 : wallDiff < 26 && neighborDiff <= 14) {
      bg[pIdx] = 1;
      queue[tail++] = pIdx;
    }
  };

  for (let x = 0; x < w; x++) {
    const topIdx = x * 4;
    const botIdx = ((h - 1) * w + x) * 4;
    pushIfValid(x, 0, data[topIdx], data[topIdx + 1], data[topIdx + 2], true);
    pushIfValid(x, h - 1, data[botIdx], data[botIdx + 1], data[botIdx + 2], true);
  }
  for (let y = 0; y < h; y++) {
    const lIdx = y * w * 4;
    const rIdx = (y * w + w - 1) * 4;
    pushIfValid(0, y, data[lIdx], data[lIdx + 1], data[lIdx + 2], true);
    pushIfValid(w - 1, y, data[rIdx], data[rIdx + 1], data[rIdx + 2], true);
  }

  while (head < tail) {
    const cur = queue[head++];
    const cx = cur % w;
    const cy = (cur - cx) / w;
    const ci = cur * 4;
    const cr = data[ci];
    const cg = data[ci + 1];
    const cb = data[ci + 2];

    if (cx > 0) pushIfValid(cx - 1, cy, cr, cg, cb, false);
    if (cx + 1 < w) pushIfValid(cx + 1, cy, cr, cg, cb, false);
    if (cy > 0) pushIfValid(cx, cy - 1, cr, cg, cb, false);
    if (cy + 1 < h) pushIfValid(cx, cy + 1, cr, cg, cb, false);
  }

  return bg;
}

/**
 * Classifies candidate pixels belonging specifically to the garment/product
 * (completely excluding outer wall/floor, skin, hair, and companion clothing).
 */
function isCandidateGarmentPixel(
  product: Product,
  baseH: number,
  baseS: number,
  baseL: number,
  xRatio: number,
  yRatio: number,
  r: number,
  g: number,
  b: number,
  h: number,
  s: number,
  l: number,
  isBg: boolean
): boolean {
  if (isBg) return false;

  switch (product.id) {
    case 'esprit-ruffle-shirt': {
      // Crewneck white tee: y 0.21..0.445, excludes hair/face (<0.21), black belt/jeans (>0.445), skin arms
      if (xRatio < 0.31 || xRatio > 0.69 || yRatio < 0.205 || yRatio > 0.445) {
        return false;
      }
      if (isSkinPixel(r, g, b, h, s, l)) return false;
      // Cover BOTH sunlit & deeply shadowed folds seamlessly
      return l >= 0.48 && s <= 0.14;
    }

    case 'herschel-supply': {
      // White poplin shirt: y 0.175..0.445, excludes face/hair (<0.175), pink trousers, brown skin forearms
      if (xRatio < 0.29 || xRatio > 0.70 || yRatio < 0.175 || yRatio > 0.445) {
        return false;
      }
      if (isSkinPixel(r, g, b, h, s, l)) return false;
      // Exclude pink tailored trousers around the tucked waistband
      if (yRatio >= 0.37 && r - b >= 9 && s >= 0.10) return false;
      if (yRatio >= 0.39 && r > g + 4 && b < r - 5) return false;
      // Include ALL sunlit & shadowed poplin folds smoothly
      return l >= 0.46 && s <= 0.14;
    }

    case 'only-check-trouser': {
      if (xRatio < 0.29 || xRatio > 0.73 || yRatio < 0.16 || yRatio > 0.525) {
        return false;
      }
      if (isSkinPixel(r, g, b, h, s, l)) return false;
      if (l < 0.38) return false;
      return (
        (hueDistance(h, 215) <= 45 && s >= 0.08) ||
        (b >= r + 2 && s <= 0.16 && l <= 0.86)
      );
    }

    case 'classic-trench-coat': {
      if (xRatio < 0.28 || xRatio > 0.72 || yRatio < 0.17 || yRatio > 0.71) {
        return false;
      }
      if (isSkinPixel(r, g, b, h, s, l)) return false;
      return h >= 44 && h <= 130 && s >= 0.11 && l >= 0.13 && l <= 0.62;
    }

    case 'selvedge-chore-jacket': {
      if (xRatio < 0.31 || xRatio > 0.77 || yRatio < 0.15 || yRatio > 0.56) {
        return false;
      }
      if (isSkinPixel(r, g, b, h, s, l)) return false;
      return h >= 190 && h <= 255 && s >= 0.14 && l <= 0.55;
    }

    case 'sand-linen-tunic': {
      if (xRatio < 0.28 || xRatio > 0.70 || yRatio < 0.18 || yRatio > 0.58) {
        return false;
      }
      if (isSkinPixel(r, g, b, h, s, l)) return false;
      const warmOffset = r - b >= 7 && r - g <= 16;
      return warmOffset && l >= 0.45 && l <= 0.85 && s >= 0.06 && s <= 0.30;
    }

    case 'stone-twill-overshirt': {
      if (xRatio < 0.28 || xRatio > 0.72 || yRatio < 0.16 || yRatio > 0.54) {
        return false;
      }
      if (isSkinPixel(r, g, b, h, s, l)) return false;
      if (xRatio >= 0.43 && xRatio <= 0.56 && l >= 0.84 && s <= 0.08) return false;
      return (
        r - b >= 9 &&
        r - g <= 16 &&
        l >= 0.42 &&
        l <= 0.83 &&
        s >= 0.07 &&
        s <= 0.34
      );
    }

    case 'espresso-knit-polo': {
      if (xRatio < 0.31 || xRatio > 0.73 || yRatio < 0.16 || yRatio > 0.445) {
        return false;
      }
      if (isSkinPixel(r, g, b, h, s, l)) return false;
      if (xRatio < 0.2) return false;
      return l >= 0.08 && l <= 0.56 && (hueDistance(h, 215) <= 45 || s <= 0.22);
    }

    case 'avelina-leather-tote': {
      if (yRatio < 0.12 || yRatio > 0.83) return false;
      return h >= 8 && h <= 46 && s >= 0.22 && l >= 0.08 && l <= 0.66;
    }

    case 'saddle-crossbody-bag': {
      if (xRatio < 0.08 || xRatio > 0.94 || yRatio < 0.24 || yRatio > 0.76) {
        return false;
      }
      const isBrass = h >= 35 && h <= 65 && s >= 0.26 && l >= 0.32;
      if (isBrass) return false;
      return l <= 0.46 && (h <= 48 || h >= 335 || s <= 0.25);
    }

    case 'waxed-canvas-weekender': {
      if (yRatio < 0.24 || yRatio > 0.82) return false;
      const isCognacStrap = h >= 8 && h <= 36 && s >= 0.28;
      if (isCognacStrap) return false;
      return h >= 38 && h <= 135 && s >= 0.07 && l >= 0.08 && l <= 0.62;
    }

    case 'nordic-court-sneaker': {
      if (xRatio < 0.07 || xRatio > 0.95 || yRatio < 0.28 || yRatio > 0.77) {
        return false;
      }
      const warmChalk = r - b >= 4 || l >= 0.66;
      return warmChalk && l >= 0.42 && l <= 0.95 && s <= 0.28;
    }

    case 'tobacco-suede-loafer': {
      if (yRatio < 0.26 || yRatio > 0.8) return false;
      return h >= 10 && h <= 46 && s >= 0.22 && l >= 0.08 && l <= 0.64;
    }

    case 'matte-chelsea-boot': {
      if (xRatio < 0.09 || xRatio > 0.94 || yRatio < 0.25 || yRatio > 0.78) {
        return false;
      }
      return l <= 0.48 && s <= 0.24;
    }

    case 'atelier-steel-watch': {
      const dx = (xRatio - 0.495) / 0.17;
      const dy = (yRatio - 0.435) / 0.16;
      if (dx * dx + dy * dy <= 1.0) {
        return l <= 0.62 && s <= 0.15;
      }
      if (xRatio >= 0.36 && xRatio <= 0.68 && (yRatio <= 0.25 || yRatio >= 0.62)) {
        return l <= 0.28 && s <= 0.18;
      }
      return false;
    }

    case 'altus-field-watch': {
      if (xRatio >= 0.35 && xRatio <= 0.7 && (yRatio <= 0.3 || yRatio >= 0.65)) {
        return h >= 42 && h <= 130 && s >= 0.1 && l <= 0.56;
      }
      return false;
    }

    default: {
      if (isSkinPixel(r, g, b, h, s, l)) return false;
      if (baseS < 0.14) {
        return Math.abs(l - baseL) <= 0.24 && s <= 0.18;
      }
      return hueDistance(h, baseH) <= 42 && s >= 0.1;
    }
  }
}

/**
 * Retains connected garment components seeded from torso chest/collar coordinates
 * so stray isolated fragments can never be tinted.
 */
function keepConnectedTorsoMask(
  mask: Uint8Array,
  w: number,
  h: number,
  seedPoints: [number, number][]
): Uint8Array {
  const total = w * h;
  const connected = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  for (const [rx, ry] of seedPoints) {
    const cx = Math.round(rx * w);
    const cy = Math.round(ry * h);
    for (let dy = -16; dy <= 16; dy += 2) {
      for (let dx = -16; dx <= 16; dx += 2) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const pIdx = ny * w + nx;
          if (mask[pIdx] && !connected[pIdx]) {
            connected[pIdx] = 1;
            queue[tail++] = pIdx;
          }
        }
      }
    }
  }

  if (tail === 0) return mask;

  while (head < tail) {
    const cur = queue[head++];
    const cx = cur % w;
    const cy = (cur - cx) / w;
    for (let dy = -1; dy <= 1; dy++) {
      const ny = cy + dy;
      if (ny < 0 || ny >= h) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx;
        if (nx < 0 || nx >= w) continue;
        const nIdx = ny * w + nx;
        if (mask[nIdx] && !connected[nIdx]) {
          connected[nIdx] = 1;
          queue[tail++] = nIdx;
        }
      }
    }
  }

  return connected;
}

/**
 * Morphological closing (5x5 pass) eliminates tiny weave/button pinholes inside garments.
 */
function closeMaskHoles(mask: Uint8Array, w: number, h: number): Uint8Array {
  const dilated = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (mask[idx]) {
        dilated[idx] = 1;
        continue;
      }
      let hits = 0;
      for (let dy = -2; dy <= 2; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          if (mask[ny * w + nx]) hits++;
        }
      }
      if (hits >= 11) dilated[idx] = 1;
    }
  }

  const closed = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (!dilated[idx]) continue;
      let misses = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          if (!dilated[ny * w + nx]) misses++;
        }
      }
      if (misses <= 5) closed[idx] = 1;
    }
  }

  return closed;
}

function renderRecoloredGarment(
  product: Product,
  targetHex: string,
  targetName: string
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const maxDim = 760;
        const scale = Math.min(
          1,
          maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1)
        );
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(product.image);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const total = w * h;

        const baseHex = product.variants[0]?.hex || product.colorHex || '#f4f4f5';
        const [br, bgC, bb] = hexToRgb(baseHex);
        const [bh, bs, bl] = rgbToHsl(br, bgC, bb);

        const [tr, tg, tb] = hexToRgb(targetHex);
        const [th, ts, tl] = rgbToHsl(tr, tg, tb);
        const lowerName = targetName.toLowerCase();
        const isModelShot =
          product.category === 'Women' || product.category === 'Men';

        // Compute per-row side-aware studio background mask
        const bgMask = computeStudioBackgroundMask(data, w, h, isModelShot);

        // Pass 1: Classify candidate garment pixels
        let rawMask: Uint8Array = new Uint8Array(total);
        const sArr = new Float32Array(total);
        const lArr = new Float32Array(total);

        for (let y = 0; y < h; y++) {
          const yRatio = y / h;
          for (let x = 0; x < w; x++) {
            const pIdx = y * w + x;
            const i = pIdx * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const [ph, ps, pl] = rgbToHsl(r, g, b);
            sArr[pIdx] = ps;
            lArr[pIdx] = pl;

            if (
              isCandidateGarmentPixel(
                product,
                bh,
                bs,
                bl,
                x / w,
                yRatio,
                r,
                g,
                b,
                ph,
                ps,
                pl,
                bgMask[pIdx] === 1
              )
            ) {
              rawMask[pIdx] = 1;
            }
          }
        }

        // Fill tiny button/texture pinholes inside garment mask
        rawMask = closeMaskHoles(rawMask, w, h);

        // For fitted torso garments, retain connected chest+sleeve components only
        if (
          product.id === 'esprit-ruffle-shirt' ||
          product.id === 'herschel-supply' ||
          product.id === 'sand-linen-tunic' ||
          product.id === 'espresso-knit-polo'
        ) {
          rawMask = keepConnectedTorsoMask(rawMask, w, h, [
            [0.48, 0.28],
            [0.54, 0.30],
            [0.43, 0.31],
          ]);
        } else if (product.id === 'stone-twill-overshirt') {
          rawMask = keepConnectedTorsoMask(rawMask, w, h, [
            [0.40, 0.30],
            [0.58, 0.30],
          ]);
        }

        // Compute average luminance across finalized garment mask
        let sumL = 0;
        let maskCount = 0;
        for (let pIdx = 0; pIdx < total; pIdx++) {
          if (rawMask[pIdx]) {
            sumL += lArr[pIdx];
            maskCount++;
          }
        }

        if (maskCount < 40) {
          resolve(product.image);
          return;
        }

        const meanSrcL = Math.max(0.08, sumL / maskCount);

        // Pass 2: Soft edge feathering (3x3 smooth alpha border)
        const alphaMask = new Float32Array(total);
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const pIdx = y * w + x;
            if (rawMask[pIdx] === 1) {
              let sum = 0;
              let cnt = 0;
              for (let dy = -1; dy <= 1; dy++) {
                const ny = y + dy;
                if (ny < 0 || ny >= h) continue;
                for (let dx = -1; dx <= 1; dx++) {
                  const nx = x + dx;
                  if (nx < 0 || nx >= w) continue;
                  sum += rawMask[ny * w + nx];
                  cnt++;
                }
              }
              alphaMask[pIdx] = Math.min(1, (sum / cnt) * 1.15);
            }
          }
        }

        // Normalize target dye properties for visible, realistic fabric texture
        let effectiveTargetL = tl;
        let effectiveTargetS = ts;

        if (lowerName.includes('black') || lowerName.includes('charcoal')) {
          effectiveTargetL = Math.min(tl, 0.2);
          effectiveTargetS = Math.min(ts, 0.08);
        } else if (lowerName.includes('white')) {
          effectiveTargetL = Math.max(tl, 0.9);
          effectiveTargetS = Math.min(ts, 0.05);
        } else if (lowerName.includes('ivory') || lowerName.includes('cream')) {
          effectiveTargetL = 0.85;
          effectiveTargetS = 0.24;
        } else if (lowerName.includes('powder blue')) {
          effectiveTargetL = 0.79;
          effectiveTargetS = 0.48;
        } else if (lowerName.includes('warm sand')) {
          effectiveTargetL = 0.76;
          effectiveTargetS = 0.30;
        } else if (lowerName.includes('silver')) {
          effectiveTargetL = 0.76;
          effectiveTargetS = 0.06;
        } else if (effectiveTargetL > 0.75) {
          effectiveTargetS = Math.max(effectiveTargetS, 0.3);
        }

        // Pass 3: Re-dye garment pixels smoothly preserving real folds & highlights
        for (let pIdx = 0; pIdx < total; pIdx++) {
          const weight = alphaMask[pIdx];
          if (weight <= 0.02) continue;

          const i = pIdx * 4;
          const srcL = lArr[pIdx];
          const srcS = sArr[pIdx];

          const foldRatio = srcL / meanSrcL;
          let outL =
            effectiveTargetL *
            Math.pow(foldRatio, effectiveTargetL < 0.35 ? 1.25 : 0.78);

          if (effectiveTargetL <= 0.24) {
            outL = Math.max(0.05, Math.min(0.42, outL));
          } else if (effectiveTargetL >= 0.85) {
            outL = Math.max(0.62, Math.min(0.97, outL));
          } else {
            outL = Math.max(0.06, Math.min(0.92, outL));
          }

          let outS = effectiveTargetS;
          if (product.id === 'only-check-trouser' && srcL > 0.7) {
            outS = effectiveTargetS * (0.25 + srcS * 0.85);
          }

          const [nr, ng, nb] = hslToRgb(th, outS, outL);
          data[i] = Math.round(data[i] * (1 - weight) + nr * weight);
          data[i + 1] = Math.round(data[i + 1] * (1 - weight) + ng * weight);
          data[i + 2] = Math.round(data[i + 2] * (1 - weight) + nb * weight);
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch {
        resolve(product.image);
      }
    };
    img.onerror = () => resolve(product.image);
    img.src = product.image;
  });
}

export function getRecoloredProductImage(
  product: Product,
  colorName: string
): Promise<string> {
  const baseVariant = product.variants[0]?.name ?? product.color;
  const matchedVariant =
    product.variants.find((v) => v.name === colorName) ?? product.variants[0];

  if (!matchedVariant || matchedVariant.name === baseVariant) {
    return Promise.resolve(product.image);
  }

  const cacheKey = `${product.id}::${matchedVariant.name}::${matchedVariant.hex}`;
  const cached = recolorCache.get(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = inFlightCache.get(cacheKey);
  if (pending) {
    return pending;
  }

  const task = renderRecoloredGarment(
    product,
    matchedVariant.hex,
    matchedVariant.name
  ).then((resultUrl) => {
    recolorCache.set(cacheKey, resultUrl);
    inFlightCache.delete(cacheKey);
    return resultUrl;
  });

  inFlightCache.set(cacheKey, task);
  return task;
}

export function getCachedRecoloredProductImage(
  product: Product,
  colorName: string
): string | null {
  const baseVariant = product.variants[0]?.name ?? product.color;
  const matchedVariant =
    product.variants.find((v) => v.name === colorName) ?? product.variants[0];

  if (!matchedVariant || matchedVariant.name === baseVariant) {
    return product.image;
  }

  const cacheKey = `${product.id}::${matchedVariant.name}::${matchedVariant.hex}`;
  return recolorCache.get(cacheKey) ?? null;
}
