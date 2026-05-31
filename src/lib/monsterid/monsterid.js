"use strict";

import md5 from "./md5";

const FRAME_WIDTH = 16;
const FRAME_HEIGHT = 24;
const PART_WIDTH = 16;
const PART_HEIGHT = 20;
const PART_Y_OFFSET = 4;
const IDLE_ANIMATION = { len: 4, y: 1 };
const BASE_TEXTURE_SRC = "/base.png";
const PARTS_TEXTURE_SRC = "/parts.png";
const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=";

const SHAPE_OPTIONS = [
  { key: "face", sheetRow: 2, max: 25 },
  { key: "head", sheetRow: 0, max: 44 },
];

const HEAD_ORIGINS = [
  [0],
  [0, 1, 2, 1],
  [-1, -2, 0, 1],
  [-1, -1, -1, 1, 2, 1, 0],
];
const EYES_ORIGINS = HEAD_ORIGINS;

const COLOR_THEMES = [
  {
    key: "eyes",
    defaults: ["ee7755"],
    options: [
      ["222033"],
      ["178178"],
      ["7722ab"],
      ["346524"],
      ["5a8ca6"],
      ["fafafa"],
      ["ababab"],
      ["751f20"],
      ["da4e38"],
      ["000000"],
    ],
  },
  {
    key: "skin",
    defaults: ["cccc77", "aaaa55", "888844"],
    options: [
      ["cccc77", "aaaa55", "888844"],
      ["f0f0dd", "d1d1c2", "b1b1b1"],
      ["ccccbe", "877d78", "675d58"],
      ["e6d1bc", "d9af83", "b98f73"],
      ["cb9f76", "af8055", "8f6035"],
      ["a47d5b", "7c5e46", "5c3e56"],
      ["7a3333", "56252f", "36051f"],
      ["686e46", "505436", "303416"],
      ["dcb641", "aa6622", "8a4602"],
      ["72b8e4", "5d96ba", "3d76aa"],
      ["aa4951", "8a344d", "6a142d"],
      ["887777", "554444", "775555"],
      ["434343", "353535", "3e3e3e"],
      ["6cb832", "3c8802", "4c9812"],
    ],
  },
  {
    key: "suit",
    defaults: ["7722aa", "552277"],
    options: "item",
  },
  {
    key: "item",
    defaults: ["dd77bb", "aa5599", "eebbee"],
    options: [
      ["91804c", "726641", "b9a156"],
      ["ccaa44", "aa6622", "c89437"],
      ["facb3e", "ee8e2e", "fdf7ed"],
      ["d04648", "aa3333", "caacac"],
      ["a9b757", "828a58", "c1cd74"],
      ["4ba747", "3d734f", "79f874"],
      ["f0f0dd", "d1d1c2", "fdfdfb"],
      ["944a9c", "5a3173", "ae68b6"],
      ["447ccf", "3d62b3", "69b7d8"],
      ["72d6ce", "5698cc", "fdf7ed"],
      ["3e3e3e", "353535", "434343"],
    ],
  },
  {
    key: "hair",
    defaults: ["eeeeee", "cccccc"],
    options: [
      ["ebebeb", "c7c7c7"],
      ["e4da99", "d9c868"],
      ["b62f31", "751f20"],
      ["cc7733", "bb5432"],
      ["4d4e4c", "383839"],
    ],
  },
];

COLOR_THEMES.forEach((theme) => {
  if (typeof theme.options === "string") {
    theme.options = COLOR_THEMES.find(
      (candidate) => candidate.key === theme.options,
    ).options;
  }
});

const texturePromises = new Map();
const avatarPromises = new Map();

function createRng(hash) {
  const parsedState = parseInt(hash.slice(0, 8), 16);
  const fallbackState = parseInt(hash.slice(8, 16), 16);
  let state =
    Number.isFinite(parsedState) && parsedState !== 0
      ? parsedState
      : Number.isFinite(fallbackState) && fallbackState !== 0
        ? fallbackState
        : 0x6d2b79f5;
  return function nextRandom() {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function createAppearance(seed) {
  const rng = createRng(md5(seed));
  const appearance = {};

  SHAPE_OPTIONS.forEach(({ key, max }) => {
    appearance[key] = Math.floor(rng() * (max + 1));
  });

  COLOR_THEMES.forEach(({ key, options }) => {
    appearance[key] = Math.floor(rng() * options.length);
  });

  return appearance;
}

function loadImage(src) {
  if (!texturePromises.has(src)) {
    texturePromises.set(
      src,
      new Promise((resolve, reject) => {
        if (typeof Image === "undefined") {
          reject(new Error(`Image loading is unavailable for ${src}`));
          return;
        }

        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load ${src}`));
        image.src = src;
      }),
    );
  }

  return texturePromises.get(src);
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getContext(canvas) {
  const context = canvas.getContext("2d");
  context.imageSmoothingEnabled = false;
  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;
  return context;
}

function draw16(context, x, y, image, sx = 0, sy = 0) {
  context.drawImage(
    image,
    sx * PART_WIDTH,
    sy * PART_HEIGHT,
    PART_WIDTH,
    PART_HEIGHT,
    x,
    y + PART_Y_OFFSET,
    PART_WIDTH,
    PART_HEIGHT,
  );
}

function drawShape(context, frame, value, sheetRow, origins, partsImage) {
  let drewCustomPart = false;
  const baseY = IDLE_ANIMATION.y * FRAME_HEIGHT;

  if (value === 4 && sheetRow === 2) {
    if (frame === 1) {
      draw16(context, frame * FRAME_WIDTH, baseY + 1, partsImage, 4, 4);
      drewCustomPart = true;
    } else if (frame === 2) {
      draw16(context, frame * FRAME_WIDTH, baseY + 2, partsImage, 5, 4);
      drewCustomPart = true;
    } else if (frame === 3) {
      draw16(context, frame * FRAME_WIDTH, baseY + 1, partsImage, 4, 4);
      drewCustomPart = true;
    }
  } else if (value === 6 && sheetRow === 0) {
    if (frame === 1 || frame === 3) {
      draw16(
        context,
        frame * FRAME_WIDTH,
        baseY + origins[frame],
        partsImage,
        6,
        4,
      );
      drewCustomPart = true;
    } else if (frame === 2) {
      draw16(
        context,
        frame * FRAME_WIDTH,
        baseY + origins[frame],
        partsImage,
        7,
        4,
      );
      drewCustomPart = true;
    }
  } else if (value === 13 && (sheetRow === 0 || sheetRow === 1)) {
    drawShape(context, frame, 6, sheetRow, origins, partsImage);
    drawShape(context, frame, 12, sheetRow, origins, partsImage);
    drewCustomPart = true;
  } else if (value === 14 && (sheetRow === 0 || sheetRow === 1)) {
    drawShape(context, frame, 10, sheetRow, origins, partsImage);
    drawShape(context, frame, 12, sheetRow, origins, partsImage);
    drewCustomPart = true;
  } else if (value === 15 && (sheetRow === 0 || sheetRow === 1)) {
    drawShape(context, frame, 7, sheetRow, origins, partsImage);
    drawShape(context, frame, 12, sheetRow, origins, partsImage);
    drewCustomPart = true;
  } else if (value === 23 && (sheetRow === 0 || sheetRow === 1)) {
    drawShape(context, frame, 6, sheetRow, origins, partsImage);
    drawShape(context, frame, 22, sheetRow, origins, partsImage);
    drewCustomPart = true;
  } else if (value === 24 && (sheetRow === 0 || sheetRow === 1)) {
    drawShape(context, frame, 7, sheetRow, origins, partsImage);
    drawShape(context, frame, 22, sheetRow, origins, partsImage);
    drewCustomPart = true;
  }

  if (!drewCustomPart) {
    draw16(
      context,
      frame * FRAME_WIDTH,
      baseY + origins[frame],
      partsImage,
      value,
      sheetRow,
    );
  }
}

function pad2(value) {
  return `00${value.toString(16)}`.slice(-2);
}

function hexToArr(value) {
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function applyTheme(data, defaults, palette) {
  for (let colorIndex = 0; colorIndex < defaults.length; colorIndex += 1) {
    const source = defaults[colorIndex];
    const target = hexToArr(palette[colorIndex]);

    for (let pixelIndex = 0; pixelIndex < data.length; pixelIndex += 4) {
      const pixel =
        pad2(data[pixelIndex]) +
        pad2(data[pixelIndex + 1]) +
        pad2(data[pixelIndex + 2]);

      if (data[pixelIndex + 3] === 255 && pixel === source) {
        data[pixelIndex] = target[0];
        data[pixelIndex + 1] = target[1];
        data[pixelIndex + 2] = target[2];
      }
    }
  }
}

function recolorAll(context, appearance) {
  const image = context.getImageData(
    0,
    0,
    context.canvas.width,
    context.canvas.height,
  );
  const { data } = image;

  COLOR_THEMES.forEach((theme) => {
    applyTheme(data, theme.defaults, theme.options[appearance[theme.key]]);
  });

  context.putImageData(image, 0, 0);
}

function buildSourceCanvas(baseImage, partsImage, appearance) {
  const canvas = createCanvas(baseImage.width, baseImage.height);
  const context = getContext(canvas);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(baseImage, 0, 0);

  drawOrigins(context, appearance.face, 3, EYES_ORIGINS[1], partsImage);
  drawOrigins(context, appearance.head, 0, HEAD_ORIGINS[1], partsImage);
  drawOrigins(context, appearance.head, 1, HEAD_ORIGINS[1], partsImage);
  drawOrigins(context, appearance.face, 2, EYES_ORIGINS[1], partsImage);
  recolorAll(context, appearance);

  return canvas;
}

function drawOrigins(context, value, sheetRow, origins, partsImage) {
  for (let frame = 0; frame < origins.length; frame += 1) {
    drawShape(context, frame, value, sheetRow, origins, partsImage);
  }
}

function renderFrame(
  sourceCanvas,
  frameIndex,
  width,
  height,
  animationRow = IDLE_ANIMATION.y,
) {
  const canvas = createCanvas(width, height);
  const context = getContext(canvas);
  const scale = Math.min(width / FRAME_WIDTH, height / FRAME_HEIGHT);
  const drawWidth = Math.max(1, Math.round(FRAME_WIDTH * scale));
  const drawHeight = Math.max(1, Math.round(FRAME_HEIGHT * scale));
  const offsetX = Math.floor((width - drawWidth) / 2);
  const offsetY = Math.floor((height - drawHeight) / 2);

  context.clearRect(0, 0, width, height);
  context.drawImage(
    sourceCanvas,
    frameIndex * FRAME_WIDTH,
    animationRow * FRAME_HEIGHT,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    offsetX,
    offsetY,
    drawWidth,
    drawHeight,
  );

  return canvas.toDataURL("image/png");
}

async function generateAvatarFrames(seed, width, height) {
  const [baseImage, partsImage] = await Promise.all([
    loadImage(BASE_TEXTURE_SRC),
    loadImage(PARTS_TEXTURE_SRC),
  ]);
  const appearance = createAppearance(seed);
  const sourceCanvas = buildSourceCanvas(baseImage, partsImage, appearance);

  return Array.from({ length: IDLE_ANIMATION.len }, (_, frameIndex) =>
    renderFrame(sourceCanvas, frameIndex, width, height),
  );
}

export const getAvatarFrames = function (string, width, height) {
  const resolvedWidth = Math.max(width ?? 128, 16);
  const resolvedHeight = Math.max(height ?? 128, 16);
  const cacheKey = `${string}:${resolvedWidth}:${resolvedHeight}`;

  if (!avatarPromises.has(cacheKey)) {
    avatarPromises.set(
      cacheKey,
      generateAvatarFrames(string, resolvedWidth, resolvedHeight).catch(() => [
        EMPTY_IMAGE,
      ]),
    );
  }

  return avatarPromises.get(cacheKey);
};

export const getAvatar = async function (string, width, height) {
  const frames = await getAvatarFrames(string, width, height);
  return frames[0] || EMPTY_IMAGE;
};
