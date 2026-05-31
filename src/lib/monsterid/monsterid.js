"use strict";

import { random, seedrandom } from "./seedrandom";
import md5 from "./md5";

const GRID_SIZE = 16;
const HALF_GRID = GRID_SIZE / 2;
const OUTLINE_NEIGHBORS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

const PALETTES = [
  {
    body: "#7dd3fc",
    shade: "#0f766e",
    highlight: "#ecfeff",
    accent: "#38bdf8",
    outline: "#082f49",
    eye: "#f8fafc",
    eyeDark: "#0f172a",
    mouth: "#0f172a",
  },
  {
    body: "#f97316",
    shade: "#9a3412",
    highlight: "#ffedd5",
    accent: "#fb7185",
    outline: "#431407",
    eye: "#fef08a",
    eyeDark: "#451a03",
    mouth: "#7c2d12",
  },
  {
    body: "#a78bfa",
    shade: "#6d28d9",
    highlight: "#f5f3ff",
    accent: "#c084fc",
    outline: "#2e1065",
    eye: "#fef9c3",
    eyeDark: "#3b0764",
    mouth: "#4c1d95",
  },
  {
    body: "#4ade80",
    shade: "#15803d",
    highlight: "#f0fdf4",
    accent: "#facc15",
    outline: "#052e16",
    eye: "#fef3c7",
    eyeDark: "#14532d",
    mouth: "#14532d",
  },
  {
    body: "#f472b6",
    shade: "#be185d",
    highlight: "#fdf2f8",
    accent: "#fb7185",
    outline: "#500724",
    eye: "#fefce8",
    eyeDark: "#4a044e",
    mouth: "#831843",
  },
  {
    body: "#facc15",
    shade: "#ca8a04",
    highlight: "#fefce8",
    accent: "#fb7185",
    outline: "#422006",
    eye: "#ffffff",
    eyeDark: "#713f12",
    mouth: "#713f12",
  },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const randInt = (min, max) => Math.floor(random() * (max - min + 1)) + min;
const pick = (values) => values[randInt(0, values.length - 1)];
const pixelKey = (x, y) => `${x},${y}`;

const setPixel = (layer, x, y, color) => {
  if (!color || x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
    return;
  }
  layer.set(pixelKey(x, y), { x, y, color });
};

const fillRow = (layer, left, right, y, color) => {
  for (let x = left; x <= right; x += 1) {
    setPixel(layer, x, y, color);
  }
};

const mirrorPixel = (layer, x, y, color) => {
  setPixel(layer, x, y, color);
  setPixel(layer, GRID_SIZE - 1 - x, y, color);
};

const composeLayers = (layers) => {
  const combined = new Map();
  for (const layer of layers) {
    for (const [key, pixel] of layer) {
      combined.set(key, pixel);
    }
  }
  return combined;
};

const createBodyBounds = () => {
  const top = randInt(3, 5);
  const height = randInt(7, 9);
  const waist = randInt(2, 3);
  const belly = randInt(waist + 1, 5);
  const bounds = [];

  for (let index = 0; index < height; index += 1) {
    const progress = height === 1 ? 0 : index / (height - 1);
    const swell = Math.sin(progress * Math.PI);
    const wobble = random() > 0.82 ? (random() > 0.5 ? 1 : -1) : 0;
    let halfWidth = waist + Math.round(swell * (belly - waist)) + wobble;
    if (index === 0) {
      halfWidth -= 1;
    }
    if (index === height - 1 && random() > 0.55) {
      halfWidth -= 1;
    }
    halfWidth = clamp(halfWidth, 2, 5);
    const left = clamp(HALF_GRID - halfWidth, 0, GRID_SIZE - 1);
    const right = clamp(HALF_GRID + halfWidth - 1, 0, GRID_SIZE - 1);
    bounds.push({
      y: top + index,
      left,
      right,
      width: right - left + 1,
    });
  }

  return {
    top,
    bottom: top + height - 1,
    height,
    bounds,
  };
};

const drawShadow = (layer, body) => {
  const y = Math.min(GRID_SIZE - 1, body.bottom + 1);
  const width = clamp(
    Math.floor(body.bounds[body.bounds.length - 1].width / 2),
    2,
    5,
  );
  for (let x = HALF_GRID - width; x <= HALF_GRID + width - 1; x += 1) {
    setPixel(layer, x, y, "rgba(15, 23, 42, 0.18)");
  }
  if (y + 1 < GRID_SIZE && width > 2) {
    for (let x = HALF_GRID - width + 1; x <= HALF_GRID + width - 2; x += 1) {
      setPixel(layer, x, y + 1, "rgba(15, 23, 42, 0.1)");
    }
  }
};

const drawBackFeature = (layer, body, palette) => {
  const style = pick(["wings", "spikes", "fins", "none"]);
  const shoulder = body.bounds[Math.min(2, body.bounds.length - 1)];
  const center = body.bounds[Math.floor(body.bounds.length / 2)];

  if (style === "wings") {
    for (let step = 0; step < 4; step += 1) {
      setPixel(
        layer,
        shoulder.left - 1 - step,
        shoulder.y + step - 1,
        palette.accent,
      );
      setPixel(
        layer,
        shoulder.left - 2 - step,
        shoulder.y + step,
        palette.highlight,
      );
      setPixel(
        layer,
        shoulder.right + 1 + step,
        shoulder.y + step - 1,
        palette.accent,
      );
      setPixel(
        layer,
        shoulder.right + 2 + step,
        shoulder.y + step,
        palette.highlight,
      );
    }
    return;
  }

  if (style === "spikes") {
    for (let step = 0; step < 3; step += 1) {
      const topRow = body.bounds[Math.min(step, body.bounds.length - 1)];
      setPixel(layer, topRow.left + step, topRow.y - 1, palette.accent);
      setPixel(layer, topRow.right - step, topRow.y - 1, palette.accent);
    }
    return;
  }

  if (style === "fins") {
    for (let step = 0; step < 3; step += 1) {
      setPixel(
        layer,
        center.left - 1 - step,
        center.y - 1 + step,
        palette.highlight,
      );
      setPixel(
        layer,
        center.right + 1 + step,
        center.y - 1 + step,
        palette.highlight,
      );
    }
  }
};

const drawLegs = (layer, body, palette) => {
  const style = pick(["stompers", "claws", "tentacles"]);
  const footY = Math.min(GRID_SIZE - 1, body.bottom + 1);
  const toeY = Math.min(GRID_SIZE - 1, footY + 1);
  const leftFoot = clamp(HALF_GRID - randInt(3, 4), 1, GRID_SIZE - 2);
  const rightFoot = clamp(HALF_GRID + randInt(1, 2), 1, GRID_SIZE - 2);

  if (style === "tentacles") {
    for (let step = 0; step < 3; step += 1) {
      setPixel(layer, leftFoot + (step % 2), body.bottom + step, palette.shade);
      setPixel(
        layer,
        rightFoot - (step % 2),
        body.bottom + step,
        palette.shade,
      );
    }
    return;
  }

  setPixel(layer, leftFoot, footY, palette.shade);
  setPixel(layer, leftFoot + 1, footY, palette.shade);
  setPixel(layer, rightFoot - 1, footY, palette.shade);
  setPixel(layer, rightFoot, footY, palette.shade);

  if (style === "claws" && toeY < GRID_SIZE) {
    setPixel(layer, leftFoot - 1, toeY, palette.highlight);
    setPixel(layer, leftFoot + 1, toeY, palette.highlight);
    setPixel(layer, rightFoot - 1, toeY, palette.highlight);
    setPixel(layer, rightFoot + 1, toeY, palette.highlight);
  }
};

const drawBody = (layer, body, palette) => {
  const lightFromLeft = random() > 0.5;
  for (let index = 0; index < body.bounds.length; index += 1) {
    const row = body.bounds[index];
    fillRow(layer, row.left, row.right, row.y, palette.body);

    setPixel(layer, row.left, row.y, palette.shade);
    setPixel(layer, row.right, row.y, palette.shade);

    if (row.width > 4) {
      const highlightX = lightFromLeft ? row.left + 1 : row.right - 1;
      const shadowX = lightFromLeft ? row.right - 1 : row.left + 1;
      setPixel(layer, highlightX, row.y, palette.highlight);
      setPixel(layer, shadowX, row.y, palette.shade);
    }

    if (index === 0 || index === body.bounds.length - 1) {
      const innerLeft = row.left + 1;
      const innerRight = row.right - 1;
      if (innerLeft <= innerRight) {
        fillRow(layer, innerLeft, innerRight, row.y, palette.highlight);
      }
    }
  }
};

const drawArms = (layer, body, palette) => {
  const style = pick(["claws", "paws", "blades", "none"]);
  if (style === "none") {
    return;
  }

  const row = body.bounds[Math.floor(body.bounds.length / 2)];
  const left = row.left;
  const right = row.right;
  const y = row.y;

  if (style === "paws") {
    setPixel(layer, left - 1, y, palette.body);
    setPixel(layer, left - 2, y + 1, palette.highlight);
    setPixel(layer, right + 1, y, palette.body);
    setPixel(layer, right + 2, y + 1, palette.highlight);
    return;
  }

  if (style === "blades") {
    for (let step = 0; step < 3; step += 1) {
      setPixel(layer, left - 1 - step, y - 1 + step, palette.accent);
      setPixel(layer, right + 1 + step, y - 1 + step, palette.accent);
    }
    return;
  }

  setPixel(layer, left - 1, y, palette.shade);
  setPixel(layer, left - 2, y + 1, palette.highlight);
  setPixel(layer, left - 1, y + 2, palette.shade);
  setPixel(layer, right + 1, y, palette.shade);
  setPixel(layer, right + 2, y + 1, palette.highlight);
  setPixel(layer, right + 1, y + 2, palette.shade);
};

const drawHeadFeature = (layer, body, palette) => {
  const style = pick(["horns", "ears", "antennae", "crest", "none"]);
  const topRow = body.bounds[0];

  if (style === "horns") {
    setPixel(layer, topRow.left + 1, topRow.y - 1, palette.highlight);
    setPixel(layer, topRow.left, topRow.y - 2, palette.accent);
    setPixel(layer, topRow.right - 1, topRow.y - 1, palette.highlight);
    setPixel(layer, topRow.right, topRow.y - 2, palette.accent);
    return;
  }

  if (style === "ears") {
    setPixel(layer, topRow.left, topRow.y - 1, palette.accent);
    setPixel(layer, topRow.right, topRow.y - 1, palette.accent);
    return;
  }

  if (style === "antennae") {
    setPixel(layer, HALF_GRID - 2, topRow.y - 1, palette.accent);
    setPixel(layer, HALF_GRID - 3, topRow.y - 2, palette.highlight);
    setPixel(layer, HALF_GRID + 1, topRow.y - 1, palette.accent);
    setPixel(layer, HALF_GRID + 2, topRow.y - 2, palette.highlight);
    return;
  }

  if (style === "crest") {
    mirrorPixel(layer, HALF_GRID - 2, topRow.y - 1, palette.highlight);
    mirrorPixel(layer, HALF_GRID - 1, topRow.y - 2, palette.accent);
  }
};

const drawBodyPattern = (layer, body, palette) => {
  const style = pick(["belly", "spots", "stripes", "runes"]);

  if (style === "belly") {
    for (let index = 1; index < body.bounds.length - 1; index += 1) {
      const row = body.bounds[index];
      setPixel(layer, HALF_GRID - 1, row.y, palette.highlight);
      setPixel(layer, HALF_GRID, row.y, palette.highlight);
    }
    return;
  }

  if (style === "stripes") {
    for (let index = 1; index < body.bounds.length - 1; index += 2) {
      const row = body.bounds[index];
      setPixel(layer, row.left + 1, row.y, palette.accent);
      setPixel(layer, row.right - 1, row.y, palette.accent);
    }
    return;
  }

  if (style === "runes") {
    const midRow = body.bounds[Math.floor(body.bounds.length / 2)];
    setPixel(layer, HALF_GRID - 1, midRow.y - 1, palette.accent);
    setPixel(layer, HALF_GRID, midRow.y - 1, palette.accent);
    setPixel(layer, HALF_GRID - 1, midRow.y, palette.highlight);
    setPixel(layer, HALF_GRID, midRow.y, palette.highlight);
    setPixel(layer, HALF_GRID - 1, midRow.y + 1, palette.accent);
    setPixel(layer, HALF_GRID, midRow.y + 1, palette.accent);
    return;
  }

  for (let index = 1; index < body.bounds.length - 1; index += 1) {
    const row = body.bounds[index];
    if (row.width < 5 || random() > 0.55) {
      continue;
    }
    const inset = randInt(1, Math.max(1, Math.floor(row.width / 3)));
    setPixel(layer, row.left + inset, row.y, palette.accent);
    setPixel(layer, row.right - inset, row.y, palette.accent);
  }
};

const drawFace = (layer, body, palette) => {
  const eyeStyle = pick(["wide", "sleepy", "glow", "cyclops"]);
  const eyeRow = body.bounds[Math.min(2, body.bounds.length - 2)];
  const mouthY = Math.min(body.bottom - 1, eyeRow.y + 2);

  if (eyeStyle === "cyclops") {
    setPixel(layer, HALF_GRID - 1, eyeRow.y, palette.eye);
    setPixel(layer, HALF_GRID, eyeRow.y, palette.eye);
    setPixel(layer, HALF_GRID - 1, eyeRow.y + 1, palette.eyeDark);
    setPixel(layer, HALF_GRID, eyeRow.y + 1, palette.eyeDark);
  } else {
    const offset = eyeStyle === "wide" ? 3 : 2;
    const leftEyeX = HALF_GRID - offset;
    const rightEyeX = HALF_GRID + offset - 1;

    setPixel(layer, leftEyeX, eyeRow.y, palette.eye);
    setPixel(layer, rightEyeX, eyeRow.y, palette.eye);

    if (eyeStyle === "sleepy") {
      setPixel(layer, leftEyeX, eyeRow.y - 1, palette.eyeDark);
      setPixel(layer, rightEyeX, eyeRow.y - 1, palette.eyeDark);
    } else if (eyeStyle === "glow") {
      setPixel(layer, leftEyeX, eyeRow.y + 1, palette.accent);
      setPixel(layer, rightEyeX, eyeRow.y + 1, palette.accent);
    } else {
      setPixel(layer, leftEyeX, eyeRow.y + 1, palette.eyeDark);
      setPixel(layer, rightEyeX, eyeRow.y + 1, palette.eyeDark);
    }
  }

  const mouthStyle = pick(["smile", "fangs", "beak", "flat"]);
  if (mouthStyle === "smile") {
    setPixel(layer, HALF_GRID - 1, mouthY, palette.mouth);
    setPixel(layer, HALF_GRID, mouthY, palette.mouth);
    setPixel(layer, HALF_GRID - 2, mouthY + 1, palette.mouth);
    setPixel(layer, HALF_GRID + 1, mouthY + 1, palette.mouth);
    return;
  }

  if (mouthStyle === "fangs") {
    fillRow(layer, HALF_GRID - 2, HALF_GRID + 1, mouthY, palette.mouth);
    setPixel(layer, HALF_GRID - 1, mouthY + 1, palette.eye);
    setPixel(layer, HALF_GRID, mouthY + 1, palette.eye);
    return;
  }

  if (mouthStyle === "beak") {
    setPixel(layer, HALF_GRID - 1, mouthY, palette.accent);
    setPixel(layer, HALF_GRID, mouthY, palette.accent);
    setPixel(layer, HALF_GRID - 1, mouthY + 1, palette.highlight);
    setPixel(layer, HALF_GRID, mouthY + 1, palette.highlight);
    return;
  }

  setPixel(layer, HALF_GRID - 1, mouthY, palette.mouth);
  setPixel(layer, HALF_GRID, mouthY, palette.mouth);
};

const buildOutline = (pixels, color) => {
  const outline = new Map();

  for (const pixel of pixels.values()) {
    for (const [dx, dy] of OUTLINE_NEIGHBORS) {
      const x = pixel.x + dx;
      const y = pixel.y + dy;
      const key = pixelKey(x, y);
      if (
        x < 0 ||
        x >= GRID_SIZE ||
        y < 0 ||
        y >= GRID_SIZE ||
        pixels.has(key)
      ) {
        continue;
      }
      outline.set(key, { x, y, color });
    }
  }

  return outline;
};

const drawPixels = (context, pixels, cellSize, offset) => {
  for (const pixel of pixels.values()) {
    context.fillStyle = pixel.color;
    context.fillRect(
      offset + pixel.x * cellSize,
      offset + pixel.y * cellSize,
      cellSize,
      cellSize,
    );
  }
};

export const getAvatar = function (string, width, height) {
  const hash = md5(string);
  const seed = parseInt(hash.slice(0, 6), 16);
  const palette = PALETTES[parseInt(hash.slice(6, 10), 16) % PALETTES.length];

  width = width || 128;
  height = height || 128;

  seedrandom(seed);

  const widthHeight = Math.max(Math.min(width, height), GRID_SIZE);
  const canvas = document.createElement("canvas");
  canvas.width = widthHeight;
  canvas.height = widthHeight;

  const context = canvas.getContext("2d");
  const cellSize = Math.max(1, Math.floor(widthHeight / GRID_SIZE));
  const offset = Math.round((widthHeight - cellSize * GRID_SIZE) / 2);
  const body = createBodyBounds();

  const shadowLayer = new Map();
  const backLayer = new Map();
  const bodyLayer = new Map();
  const patternLayer = new Map();
  const faceLayer = new Map();

  drawShadow(shadowLayer, body);
  drawBackFeature(backLayer, body, palette);
  drawLegs(bodyLayer, body, palette);
  drawBody(bodyLayer, body, palette);
  drawArms(bodyLayer, body, palette);
  drawHeadFeature(backLayer, body, palette);
  drawBodyPattern(patternLayer, body, palette);
  drawFace(faceLayer, body, palette);

  const sprite = composeLayers([backLayer, bodyLayer, patternLayer, faceLayer]);
  const outline = buildOutline(sprite, palette.outline);

  drawPixels(context, shadowLayer, cellSize, offset);
  drawPixels(context, outline, cellSize, offset);
  drawPixels(context, sprite, cellSize, offset);

  return canvas.toDataURL("image/png");
};
