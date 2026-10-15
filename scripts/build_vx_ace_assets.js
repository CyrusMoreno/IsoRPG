import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Helper to create a PNG buffer
function createPng(width, height, getPixel) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c >>> 0;
  }
  function crc32(buf, start, len) {
    let c = 0xffffffff;
    for (let i = start; i < start + len; i++) {
      c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(typeStr, dataBuf) {
    const len = dataBuf ? dataBuf.length : 0;
    const chunk = Buffer.alloc(12 + len);
    chunk.writeUInt32BE(len, 0);
    chunk.write(typeStr, 4, 4, 'ascii');
    if (dataBuf) {
      dataBuf.copy(chunk, 8);
    }
    const crcVal = crc32(chunk, 4, 4 + len);
    chunk.writeUInt32BE(crcVal, 8 + len);
    return chunk;
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflated),
    makeChunk('IEND', null),
  ]);
}

// 2D Drawing Buffer Helper
class CanvasBuffer {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const idx = (y * this.w + x) * 4;
    // Alpha blending
    const srcA = a / 255;
    const dstA = this.data[idx + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA <= 0) return;

    this.data[idx] = Math.round((r * srcA + this.data[idx] * dstA * (1 - srcA)) / outA);
    this.data[idx + 1] = Math.round((g * srcA + this.data[idx + 1] * dstA * (1 - srcA)) / outA);
    this.data[idx + 2] = Math.round((b * srcA + this.data[idx + 2] * dstA * (1 - srcA)) / outA);
    this.data[idx + 3] = Math.round(outA * 255);
  }

  getPixel(x, y) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return [0, 0, 0, 0];
    const idx = (y * this.w + x) * 4;
    return [this.data[idx], this.data[idx + 1], this.data[idx + 2], this.data[idx + 3]];
  }

  fillRect(rx, ry, rw, rh, r, g, b, a = 255) {
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        this.setPixel(x, y, r, g, b, a);
      }
    }
  }

  // Draw 64x32 dimetric diamond
  drawIsoDiamond(cx, cy, w, h, fillRgb, borderRgb) {
    const halfW = w / 2;
    const halfH = h / 2;
    const [fr, fg, fb] = fillRgb;
    const [br, bg, bb] = borderRgb || fillRgb;

    for (let y = cy - halfH; y <= cy + halfH; y++) {
      const dy = Math.abs(y - cy);
      const spanX = Math.round((1 - dy / halfH) * halfW);
      for (let x = cx - spanX; x <= cx + spanX; x++) {
        const isBorder = (x === cx - spanX || x === cx + spanX || y === cy - halfH || y === cy + halfH);
        if (isBorder && borderRgb) {
          this.setPixel(x, y, br, bg, bb, 255);
        } else {
          // Shading gradient from top to bottom
          const shade = 1.0 - (y - (cy - halfH)) / (h * 1.5) * 0.3;
          this.setPixel(x, y, Math.round(fr * shade), Math.round(fg * shade), Math.round(fb * shade), 255);
        }
      }
    }
  }
}

// ----------------------------------------------------------------------------
// 1. GENERATE TILES_B.PNG (512x512 standard RPG Maker VX Ace sheet)
// ----------------------------------------------------------------------------
console.log('Generating Diablo_Isometric_Tileset_B.png (512x512)...');
const tileBuf = new CanvasBuffer(512, 512);

// Slot 0,0: Catacombs Flagstone (64x32 diamond)
tileBuf.drawIsoDiamond(32, 16, 62, 30, [45, 43, 40], [18, 17, 16]);
// Mortar lines inside flagstone
for (let i = -14; i <= 14; i++) {
  tileBuf.setPixel(32 + i, 16 + Math.round(i * 0.5), 25, 23, 21, 200);
  tileBuf.setPixel(32 + i, 16 - Math.round(i * 0.5), 25, 23, 21, 200);
}
// Stone specular highlight
for (let i = -24; i < 0; i++) {
  tileBuf.setPixel(32 + i, 16 + Math.round(i * 0.45), 85, 80, 75, 120);
}

// Slot 1,0: Cracked Flagstone
tileBuf.drawIsoDiamond(96, 16, 62, 30, [45, 43, 40], [18, 17, 16]);
// Deep Chiseled crack
tileBuf.setPixel(92, 12, 10, 10, 10);
tileBuf.setPixel(94, 15, 10, 10, 10);
tileBuf.setPixel(97, 17, 10, 10, 10);
tileBuf.setPixel(101, 19, 10, 10, 10);

// Slot 2,0: Blood-stained Catacomb Floor
tileBuf.drawIsoDiamond(160, 16, 62, 30, [45, 43, 40], [18, 17, 16]);
// Blood puddle
for (let dy = -4; dy <= 4; dy++) {
  for (let dx = -6; dx <= 6; dx++) {
    if (dx * dx + dy * dy * 2 <= 20) {
      tileBuf.setPixel(160 + dx, 16 + dy, 110, 20, 20, 210);
      tileBuf.setPixel(160 + dx, 17 + dy, 60, 10, 10, 240);
    }
  }
}

// Slot 3,0: Blood Moor Mud & Grass
tileBuf.drawIsoDiamond(224, 16, 62, 30, [42, 45, 26], [16, 18, 10]);
// Mud tufts
tileBuf.fillRect(220, 14, 3, 2, 60, 45, 28);
tileBuf.fillRect(228, 16, 4, 2, 55, 40, 25);
tileBuf.fillRect(215, 18, 2, 2, 70, 75, 40);

// Slot 4,0: Hellfire Obsidian & Magma Fissure
tileBuf.drawIsoDiamond(288, 16, 62, 30, [26, 22, 22], [12, 10, 10]);
// Lava fissure
for (let i = -18; i <= 18; i++) {
  const fy = 16 + Math.round(Math.sin(i * 0.3) * 3);
  tileBuf.setPixel(288 + i, fy, 255, 80, 10);
  tileBuf.setPixel(288 + i, fy + 1, 255, 220, 40);
}

// Row 2: Gothic 2.5D Walls (West & East facets)
// West Facet Wall (64x64)
const wx = 32, wy = 72;
tileBuf.drawIsoDiamond(wx, wy - 32, 62, 30, [70, 66, 62], [24, 22, 20]);
// Front-left wall face
for (let y = wy - 32; y < wy + 16; y++) {
  for (let x = wx - 30; x <= wx; x++) {
    const dy = (x - (wx - 30)) * 0.5;
    if (y >= wy - 32 + dy && y <= wy + dy) {
      const brick = ((Math.floor(y / 8) + Math.floor(x / 16)) % 2 === 0) ? 5 : 0;
      tileBuf.setPixel(x, y, 40 + brick, 38 + brick, 35 + brick);
    }
  }
}

// Cathedral Pillar (Carved Gargoyle Column)
const px = 128, py = 80;
// Base shadow
for (let dy = -4; dy <= 4; dy++) {
  for (let dx = -10; dx <= 10; dx++) {
    if (dx*dx + dy*dy*4 <= 100) tileBuf.setPixel(px + dx, py + dy, 0, 0, 0, 140);
  }
}
tileBuf.drawIsoDiamond(px, py - 4, 34, 16, [38, 36, 34], [16, 14, 13]);
tileBuf.fillRect(px - 7, py - 52, 14, 48, 55, 52, 48);
// Shaft highlights & fluting
tileBuf.fillRect(px - 4, py - 50, 3, 44, 75, 71, 66);
tileBuf.fillRect(px + 1, py - 50, 2, 44, 30, 28, 26);
// Capital Top
tileBuf.drawIsoDiamond(px, py - 54, 32, 16, [68, 64, 60], [20, 18, 16]);

// Flaming Brazier Prop
const bx = 192, by = 76;
tileBuf.fillRect(bx - 2, by - 8, 4, 10, 20, 18, 17); // Tripod stem
tileBuf.fillRect(bx - 8, by - 14, 16, 6, 35, 32, 30); // Bowl
// Fire flame
for (let dy = -10; dy <= 0; dy++) {
  for (let dx = -5; dx <= 5; dx++) {
    if (dx*dx + dy*dy <= 30) {
      const isCore = (dx*dx + dy*dy <= 8);
      tileBuf.setPixel(bx + dx, by - 16 + dy, isCore ? 255 : 255, isCore ? 240 : 100, isCore ? 120 : 15);
    }
  }
}

// ----------------------------------------------------------------------------
// 2. GENERATE $Diablo_Barbarian_8DIR.png (3 cols x 8 rows = 96x384 px)
// ----------------------------------------------------------------------------
console.log('Generating $Diablo_Barbarian_8DIR.png (96x384)...');
const charW = 32;
const charH = 48;
const charBuf = new CanvasBuffer(charW * 3, charH * 8);

function drawBarbarianSprite(buf, cx, cy, dirIdx, frameIdx) {
  // dirIdx: 0:South, 1:SW, 2:West, 3:NW, 4:North, 5:NE, 6:East, 7:SE
  // Ground shadow
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -7; dx <= 7; dx++) {
      if (dx*dx + dy*dy*4 <= 49) buf.setPixel(cx + dx, cy + dy, 0, 0, 0, 120);
    }
  }

  const bob = (frameIdx !== 1) ? -1 : 0;
  const legOffset = (frameIdx === 0) ? -2 : (frameIdx === 2) ? 2 : 0;
  const py = cy - 24 + bob;

  // Leather kilt
  buf.fillRect(cx - 5, py + 12, 10, 6, 50, 32, 18);

  // Boots
  buf.fillRect(cx - 4, py + 18 + legOffset, 3, 5, 80, 50, 25);
  buf.fillRect(cx + 1, py + 18 - legOffset, 3, 5, 80, 50, 25);

  // Muscular Torso (Tanned Skin)
  buf.fillRect(cx - 6, py + 4, 12, 9, 184, 128, 82);

  // Blue war paint across chest (front/diagonal directions)
  if (dirIdx <= 2 || dirIdx >= 6) {
    buf.fillRect(cx - 4, py + 7, 8, 2, 40, 110, 180);
    buf.fillRect(cx - 1, py + 5, 2, 6, 40, 110, 180);
  }

  // Steel Pauldrons
  buf.fillRect(cx - 8, py + 3, 3, 3, 90, 88, 85);
  buf.fillRect(cx + 5, py + 3, 3, 3, 90, 88, 85);

  // Horned Great Helm
  buf.fillRect(cx - 4, py - 3, 8, 7, 100, 96, 92);
  // Visor / Face
  if (dirIdx <= 2 || dirIdx >= 6) {
    buf.fillRect(cx - 2, py + 1, 4, 2, 20, 18, 16);
  }
  // Bone Horns
  buf.setPixel(cx - 5, py - 2, 210, 195, 160);
  buf.setPixel(cx - 6, py - 4, 210, 195, 160);
  buf.setPixel(cx + 4, py - 2, 210, 195, 160);
  buf.setPixel(cx + 5, py - 4, 210, 195, 160);

  // Massive Two-Handed Broadsword
  const isFacingLeft = (dirIdx >= 1 && dirIdx <= 3);
  const swordX = isFacingLeft ? cx - 8 : cx + 6;
  // Blade
  buf.fillRect(swordX, py - 12, 2, 22, 215, 212, 208);
  // Gold Crossguard
  buf.fillRect(swordX - 2, py + 8, 6, 2, 180, 145, 50);
}

for (let dir = 0; dir < 8; dir++) {
  for (let col = 0; col < 3; col++) {
    const cx = col * charW + 16;
    const cy = dir * charH + 44;
    drawBarbarianSprite(charBuf, cx, cy, dir, col);
  }
}

// ----------------------------------------------------------------------------
// 3. GENERATE $Diablo_Barbarian_4DIR.png (Standard VX Ace 3x4 = 96x192 px)
// ----------------------------------------------------------------------------
console.log('Generating $Diablo_Barbarian_4DIR.png (96x192)...');
const char4Buf = new CanvasBuffer(charW * 3, charH * 4);
// VX Ace standard 4 directions:
// Row 0: Down (South)
// Row 1: Left (West)
// Row 2: Right (East)
// Row 3: Up (North)
const dirMap4 = [0, 2, 6, 4]; // Map into our 8-dir indexes
for (let row = 0; row < 4; row++) {
  const dirIdx = dirMap4[row];
  for (let col = 0; col < 3; col++) {
    const cx = col * charW + 16;
    const cy = row * charH + 44;
    drawBarbarianSprite(char4Buf, cx, cy, dirIdx, col);
  }
}

// ----------------------------------------------------------------------------
// 4. WRITE PNG FILES TO DISK
// ----------------------------------------------------------------------------
const targetDirs = [
  path.resolve('./public/assets'),
  path.resolve('./rpg_maker_vx_ace/Graphics/Tilesets'),
  path.resolve('./rpg_maker_vx_ace/Graphics/Characters'),
];

targetDirs.forEach((d) => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

// Encode PNG buffers
const tilesetPng = createPng(512, 512, (x, y) => tileBuf.getPixel(x, y));
const char8Png = createPng(96, 384, (x, y) => charBuf.getPixel(x, y));
const char4Png = createPng(96, 192, (x, y) => char4Buf.getPixel(x, y));

// Save Tileset
fs.writeFileSync(path.resolve('./public/assets/Diablo_Isometric_Tileset_B.png'), tilesetPng);
fs.writeFileSync(path.resolve('./rpg_maker_vx_ace/Graphics/Tilesets/Diablo_Isometric_Tileset_B.png'), tilesetPng);

// Save 8-Dir Character
fs.writeFileSync(path.resolve('./public/assets/$Diablo_Barbarian_8DIR.png'), char8Png);
fs.writeFileSync(path.resolve('./rpg_maker_vx_ace/Graphics/Characters/$Diablo_Barbarian_8DIR.png'), char8Png);

// Save Standard 4-Dir Character (Universal VX Ace Drop-in)
fs.writeFileSync(path.resolve('./public/assets/$Diablo_Barbarian_4DIR.png'), char4Png);
fs.writeFileSync(path.resolve('./rpg_maker_vx_ace/Graphics/Characters/$Diablo_Barbarian_4DIR.png'), char4Png);

console.log('SUCCESS! All compatible RPG Maker VX Ace PNG assets generated successfully.');
