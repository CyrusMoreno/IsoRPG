import { CharacterClass, Direction8 } from '../types/engine';

// Helper to draw an isometric diamond polygon
export function drawIsoDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number = 64,
  h: number = 32
) {
  const halfW = w / 2;
  const halfH = h / 2;
  ctx.beginPath();
  ctx.moveTo(x, y - halfH); // Top
  ctx.lineTo(x + halfW, y); // Right
  ctx.lineTo(x, y + halfH); // Bottom
  ctx.lineTo(x - halfW, y); // Left
  ctx.closePath();
}

/**
 * Render authentic Catacombs Flagstone Tile (64x32 diamond)
 */
export function renderCatacombsTile(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  variant: number = 0
) {
  const halfW = 32;
  const halfH = 16;

  // Base stone diamond
  drawIsoDiamond(ctx, cx, cy, 64, 32);
  const baseGrad = ctx.createLinearGradient(cx - halfW, cy - halfH, cx + halfW, cy + halfH);
  baseGrad.addColorStop(0, '#353330');
  baseGrad.addColorStop(0.5, '#282624');
  baseGrad.addColorStop(1, '#1a1918');
  ctx.fillStyle = baseGrad;
  ctx.fill();

  // Flagstone mortar lines (subdivided stones)
  ctx.strokeStyle = '#121110';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.save();
  ctx.clip(); // Keep within diamond

  // Internal stone slab seams
  ctx.beginPath();
  // Diagonal seam 1
  ctx.moveTo(cx - 16, cy - 8);
  ctx.lineTo(cx + 8, cy + 4);
  // Diagonal seam 2
  ctx.moveTo(cx - 8, cy + 4);
  ctx.lineTo(cx + 16, cy - 8);
  ctx.strokeStyle = '#161413';
  ctx.stroke();

  // Stone highlights
  ctx.beginPath();
  ctx.moveTo(cx - halfW + 4, cy - 1);
  ctx.lineTo(cx, cy - halfH + 2);
  ctx.strokeStyle = 'rgba(100, 95, 88, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Gritty noise / pebble specks
  const seed = (cx * 17 + cy * 31 + variant * 13) % 100;
  ctx.fillStyle = 'rgba(70, 65, 60, 0.35)';
  ctx.fillRect(cx - 10 + (seed % 15), cy - 4 + (seed % 9), 2, 2);
  ctx.fillRect(cx + 5 + (seed % 11), cy - 2 + (seed % 7), 2, 1);

  // Variant details (cracks or bloodstain)
  if (variant === 1) {
    // Dried bloodstain
    ctx.fillStyle = 'rgba(90, 15, 15, 0.55)';
    ctx.beginPath();
    ctx.arc(cx + 4, cy + 2, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (variant === 2) {
    // Chiseled crack
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 5);
    ctx.lineTo(cx - 2, cy - 1);
    ctx.lineTo(cx + 4, cy + 3);
    ctx.strokeStyle = '#0d0c0c';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (variant === 3) {
    // Mossy corner
    ctx.fillStyle = 'rgba(35, 55, 30, 0.4)';
    ctx.beginPath();
    ctx.arc(cx - 12, cy - 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Render Blood Moor / Rogue Encampment Mud & Grass Tile
 */
export function renderBloodMoorTile(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  variant: number = 0
) {
  drawIsoDiamond(ctx, cx, cy, 64, 32);
  const baseGrad = ctx.createLinearGradient(cx - 32, cy - 16, cx + 32, cy + 16);
  baseGrad.addColorStop(0, '#2d2e1b');
  baseGrad.addColorStop(0.5, '#222315');
  baseGrad.addColorStop(1, '#17180e');
  ctx.fillStyle = baseGrad;
  ctx.fill();

  ctx.strokeStyle = '#11120a';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.save();
  ctx.clip();

  // Dark muddy tufts
  ctx.fillStyle = '#3a3a22';
  for (let i = 0; i < 4; i++) {
    const rx = cx - 18 + ((i * 13 + variant * 7) % 36);
    const ry = cy - 8 + ((i * 11 + variant * 5) % 18);
    ctx.fillRect(rx, ry, 3, 2);
  }

  // Dirt patches
  ctx.fillStyle = 'rgba(54, 40, 25, 0.5)';
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy + 1, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (variant === 1) {
    // Bone fragment
    ctx.fillStyle = '#c5ba9e';
    ctx.fillRect(cx - 2, cy - 1, 5, 2);
    ctx.fillRect(cx - 3, cy - 2, 2, 4);
  }

  ctx.restore();
}

/**
 * Render Hellfire / Volcanic Basalt & Lava Tile
 */
export function renderHellfireTile(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  animTick: number = 0
) {
  drawIsoDiamond(ctx, cx, cy, 64, 32);
  ctx.fillStyle = '#181414';
  ctx.fill();

  ctx.strokeStyle = '#0f0a0a';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.save();
  ctx.clip();

  // Glowing lava fissure
  const pulse = Math.sin(animTick * 0.08) * 0.2 + 0.8;
  ctx.strokeStyle = `rgba(255, 90, 10, ${0.75 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy - 6);
  ctx.lineTo(cx - 4, cy + 2);
  ctx.lineTo(cx + 18, cy - 4);
  ctx.stroke();

  // Core hot yellow glow
  ctx.strokeStyle = `rgba(255, 220, 60, ${0.9 * pulse})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy - 5);
  ctx.lineTo(cx - 4, cy + 2);
  ctx.lineTo(cx + 16, cy - 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Render Gothic Wall Segment (Isometric 2.5D with 3D depth)
 */
export function renderGothicWall(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  wallHeight: number = 44,
  facing: 'NE' | 'NW' = 'NW',
  opacity: number = 1.0
) {
  ctx.save();
  ctx.globalAlpha = opacity;

  const halfW = 32;
  const halfH = 16;

  // Front facing facet
  ctx.beginPath();
  if (facing === 'NW') {
    // West-facing face (darker tone)
    ctx.moveTo(cx - halfW, cy);
    ctx.lineTo(cx, cy + halfH);
    ctx.lineTo(cx, cy + halfH - wallHeight);
    ctx.lineTo(cx - halfW, cy - wallHeight);
    ctx.closePath();
    const grad = ctx.createLinearGradient(cx - halfW, cy, cx, cy + halfH);
    grad.addColorStop(0, '#2b2927');
    grad.addColorStop(1, '#1c1b1a');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#121110';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Wall stone brick lines
    ctx.strokeStyle = 'rgba(15, 14, 13, 0.7)';
    for (let h = 10; h < wallHeight; h += 10) {
      ctx.beginPath();
      ctx.moveTo(cx - halfW, cy - h);
      ctx.lineTo(cx, cy + halfH - h);
      ctx.stroke();
    }
  } else {
    // East-facing face (slightly lighter from ambient light)
    ctx.moveTo(cx, cy + halfH);
    ctx.lineTo(cx + halfW, cy);
    ctx.lineTo(cx + halfW, cy - wallHeight);
    ctx.lineTo(cx, cy + halfH - wallHeight);
    ctx.closePath();
    const grad = ctx.createLinearGradient(cx, cy + halfH, cx + halfW, cy);
    grad.addColorStop(0, '#383533');
    grad.addColorStop(1, '#272523');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#151413';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Wall stone brick lines
    ctx.strokeStyle = 'rgba(20, 18, 17, 0.7)';
    for (let h = 10; h < wallHeight; h += 10) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + halfH - h);
      ctx.lineTo(cx + halfW, cy - h);
      ctx.stroke();
    }
  }

  // Wall Top Diamond Cap
  drawIsoDiamond(ctx, cx, cy - wallHeight, 64, 32);
  const topGrad = ctx.createLinearGradient(cx - halfW, cy - wallHeight - halfH, cx + halfW, cy - wallHeight + halfH);
  topGrad.addColorStop(0, '#4a4642');
  topGrad.addColorStop(1, '#343230');
  ctx.fillStyle = topGrad;
  ctx.fill();
  ctx.strokeStyle = '#181716';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/**
 * Render Gothic Stone Pillar with Gargoyle / Carved Details
 */
export function renderGothicPillar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pillarHeight: number = 52,
  opacity: number = 1.0
) {
  ctx.save();
  ctx.globalAlpha = opacity;

  // Pillar base shadow
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 18, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fill();

  // Base stepped pedestal
  drawIsoDiamond(ctx, cx, cy, 36, 18);
  ctx.fillStyle = '#262422';
  ctx.fill();
  ctx.strokeStyle = '#151413';
  ctx.stroke();

  // Column shaft
  const colW = 14;
  const colLeft = cx - colW / 2;
  const colGrad = ctx.createLinearGradient(colLeft, cy, colLeft + colW, cy);
  colGrad.addColorStop(0, '#2d2b28');
  colGrad.addColorStop(0.35, '#48443f');
  colGrad.addColorStop(0.7, '#35322e');
  colGrad.addColorStop(1, '#1b1a19');

  ctx.fillStyle = colGrad;
  ctx.fillRect(colLeft, cy - pillarHeight, colW, pillarHeight);

  ctx.strokeStyle = '#11100f';
  ctx.lineWidth = 1;
  ctx.strokeRect(colLeft, cy - pillarHeight, colW, pillarHeight);

  // Carved vertical fluting
  ctx.strokeStyle = 'rgba(20, 18, 16, 0.6)';
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - pillarHeight + 4);
  ctx.lineTo(cx - 3, cy - 2);
  ctx.moveTo(cx + 3, cy - pillarHeight + 4);
  ctx.lineTo(cx + 3, cy - 2);
  ctx.stroke();

  // Capital / Crown top
  drawIsoDiamond(ctx, cx, cy - pillarHeight, 32, 16);
  ctx.fillStyle = '#423e39';
  ctx.fill();
  ctx.strokeStyle = '#181615';
  ctx.stroke();

  ctx.restore();
}

/**
 * Render Animated Flaming Brazier
 */
export function renderBrazier(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  animTick: number = 0
) {
  // Ground shadow
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 14, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fill();

  // Iron tripod legs
  ctx.strokeStyle = '#151413';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 2);
  ctx.lineTo(cx - 5, cy - 10);
  ctx.moveTo(cx + 10, cy + 2);
  ctx.lineTo(cx + 5, cy - 10);
  ctx.moveTo(cx, cy + 4);
  ctx.lineTo(cx, cy - 10);
  ctx.stroke();

  // Iron bowl
  ctx.beginPath();
  ctx.ellipse(cx, cy - 10, 12, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#22201d';
  ctx.fill();
  ctx.strokeStyle = '#0f0e0d';
  ctx.stroke();

  // Animated flickering flame
  const flicker1 = Math.sin(animTick * 0.25) * 3;
  const flicker2 = Math.cos(animTick * 0.35) * 2;
  const flameH = 14 + flicker1;

  // Outer orange glow
  const flameGrad = ctx.createRadialGradient(cx, cy - 12 - flameH * 0.4, 2, cx, cy - 12 - flameH * 0.4, 16);
  flameGrad.addColorStop(0, 'rgba(255, 230, 80, 0.95)');
  flameGrad.addColorStop(0.4, 'rgba(255, 100, 10, 0.8)');
  flameGrad.addColorStop(0.8, 'rgba(180, 40, 5, 0.4)');
  flameGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy - 12);
  ctx.quadraticCurveTo(cx - 6 + flicker2, cy - 16 - flameH * 0.6, cx + flicker1 * 0.5, cy - 12 - flameH);
  ctx.quadraticCurveTo(cx + 6 - flicker2, cy - 16 - flameH * 0.6, cx + 9, cy - 12);
  ctx.closePath();
  ctx.fill();

  // Inner bright yellow spark
  ctx.fillStyle = '#fff4a0';
  ctx.beginPath();
  ctx.arc(cx + flicker2 * 0.5, cy - 14 - flameH * 0.3, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Render Diablo II Character Sprite in 8 directions with authentic 2.5D pre-rendered look
 */
export function renderHeroCharacter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  heroClass: CharacterClass,
  dir: Direction8,
  animFrame: number,
  isMoving: boolean = false,
  isAttacking: boolean = false
) {
  ctx.save();

  // Character soft contact shadow
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 12, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fill();

  // Walk cycle bobbing
  const bob = isMoving ? Math.sin(animFrame * Math.PI) * 2 : 0;
  const yOffset = cy - 24 + bob;

  // Determine facing flips / angles
  // In Diablo 2, sprites are mirrored for symmetric directions (East vs West)
  const isFacingWest = dir === 'west' || dir === 'north_west' || dir === 'south_west';
  const isFacingNorth = dir === 'north' || dir === 'north_east' || dir === 'north_west';

  if (heroClass === 'barbarian') {
    renderBarbarian(ctx, cx, yOffset, dir, isFacingWest, isFacingNorth, animFrame, isAttacking);
  } else if (heroClass === 'sorceress') {
    renderSorceress(ctx, cx, yOffset, dir, isFacingWest, isFacingNorth, animFrame, isAttacking);
  } else if (heroClass === 'necromancer') {
    renderNecromancer(ctx, cx, yOffset, dir, isFacingWest, isFacingNorth, animFrame, isAttacking);
  } else if (heroClass === 'paladin') {
    renderPaladin(ctx, cx, yOffset, dir, isFacingWest, isFacingNorth, animFrame, isAttacking);
  } else {
    renderAmazon(ctx, cx, yOffset, dir, isFacingWest, isFacingNorth, animFrame, isAttacking);
  }

  ctx.restore();
}

function renderBarbarian(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _dir: Direction8,
  facingWest: boolean,
  facingNorth: boolean,
  animFrame: number,
  isAttacking: boolean
) {
  ctx.save();
  if (facingWest) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.translate(-x, -y);
  }

  // Muscular Barbarian Torso (tanned bronze skin + leather straps)
  ctx.fillStyle = '#3c2415'; // Dark leather skirt/kilt
  ctx.fillRect(x - 6, y + 14, 12, 8);

  // Legs with fur boots
  const legSwing = Math.sin(animFrame * Math.PI) * 4;
  ctx.fillStyle = '#654321'; // Fur boots
  ctx.fillRect(x - 5, y + 20 + legSwing, 4, 6);
  ctx.fillRect(x + 2, y + 20 - legSwing, 4, 6);

  // Tanned Muscular Torso
  ctx.fillStyle = '#b88052';
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Blue war paint cross on chest (Barbarian signature)
  if (!facingNorth) {
    ctx.fillStyle = '#2b6fb3';
    ctx.fillRect(x - 4, y + 7, 8, 2);
    ctx.fillRect(x - 1, y + 4, 2, 7);
  }

  // Broad Shoulders & Iron Pauldrons
  ctx.fillStyle = '#4a4846';
  ctx.fillRect(x - 9, y + 3, 5, 4);
  ctx.fillRect(x + 4, y + 3, 5, 4);

  // Head with Horned Great Helm
  ctx.fillStyle = '#5c5956'; // Iron helmet
  ctx.beginPath();
  ctx.arc(x, y + 1, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Helmet Horns
  ctx.strokeStyle = '#c2b395'; // Bone horns
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x - 5, y + 1);
  ctx.quadraticCurveTo(x - 9, y - 4, x - 7, y - 7);
  ctx.moveTo(x + 5, y + 1);
  ctx.quadraticCurveTo(x + 9, y - 4, x + 7, y - 7);
  ctx.stroke();

  // Two-Handed Broadsword (Massive Zweihander)
  const attackAngle = isAttacking ? 0.8 : 0;
  ctx.save();
  ctx.translate(x + 6, y + 8);
  ctx.rotate(-0.35 + attackAngle);

  // Blade
  ctx.fillStyle = '#d6d3ce';
  ctx.fillRect(2, -20, 3.5, 24);
  // Blade tip
  ctx.beginPath();
  ctx.moveTo(2, -20);
  ctx.lineTo(3.7, -23);
  ctx.lineTo(5.5, -20);
  ctx.closePath();
  ctx.fillStyle = '#e8e5e0';
  ctx.fill();

  // Crossguard & Pommel
  ctx.fillStyle = '#9e8139'; // Brass hilt
  ctx.fillRect(-1, 2, 9, 2);
  ctx.fillStyle = '#2a1b0e'; // Leather grip
  ctx.fillRect(2.5, 4, 2.5, 6);
  ctx.restore();

  ctx.restore();
}

function renderSorceress(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _dir: Direction8,
  facingWest: boolean,
  _facingNorth: boolean,
  _animFrame: number,
  isAttacking: boolean
) {
  ctx.save();
  if (facingWest) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.translate(-x, -y);
  }

  // Mystic Sapphire Blue Robes
  const robeGrad = ctx.createLinearGradient(x - 8, y + 2, x + 8, y + 24);
  robeGrad.addColorStop(0, '#1d3e6d');
  robeGrad.addColorStop(1, '#0e1f38');

  ctx.beginPath();
  ctx.moveTo(x - 5, y + 6);
  ctx.lineTo(x - 8, y + 24);
  ctx.lineTo(x + 8, y + 24);
  ctx.lineTo(x + 5, y + 6);
  ctx.closePath();
  ctx.fillStyle = robeGrad;
  ctx.fill();

  // Gold waist sash
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(x - 6, y + 12, 12, 2.5);

  // Slender upper body
  ctx.fillStyle = '#c89574';
  ctx.fillRect(x - 4, y + 3, 8, 5);

  // Face & Raven Black Hair
  ctx.fillStyle = '#e5c4a8';
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();

  // Flowing black hair
  ctx.fillStyle = '#111116';
  ctx.beginPath();
  ctx.arc(x - 1, y - 1, 4.5, Math.PI * 0.8, Math.PI * 2.2);
  ctx.fill();

  // Wooden Staff with Glowing Arcane Orb
  ctx.strokeStyle = '#5a3818';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 7, y + 24);
  ctx.lineTo(x + 7, y - 8);
  ctx.stroke();

  // Glowing Orb atop staff
  const orbGrad = ctx.createRadialGradient(x + 7, y - 10, 1, x + 7, y - 10, 7);
  orbGrad.addColorStop(0, '#ffffff');
  orbGrad.addColorStop(0.3, isAttacking ? '#ff7722' : '#4deeea');
  orbGrad.addColorStop(0.8, isAttacking ? '#ff2200' : '#1b6ca8');
  orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(x + 7, y - 10, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderNecromancer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _dir: Direction8,
  facingWest: boolean,
  _facingNorth: boolean,
  _animFrame: number,
  isAttacking: boolean
) {
  ctx.save();
  if (facingWest) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.translate(-x, -y);
  }

  // Tattered Obsidian / Charcoal Coat
  ctx.fillStyle = '#18181a';
  ctx.beginPath();
  ctx.moveTo(x - 4, y + 5);
  ctx.lineTo(x - 7, y + 24);
  ctx.lineTo(x + 7, y + 24);
  ctx.lineTo(x + 4, y + 5);
  ctx.closePath();
  ctx.fill();

  // Bone Wand in main hand
  ctx.strokeStyle = '#d9d0b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 14);
  ctx.lineTo(x + 10, y - 2);
  ctx.stroke();

  // Wand bone tip
  ctx.fillStyle = isAttacking ? '#44ff88' : '#e3dcce';
  ctx.beginPath();
  ctx.arc(x + 10, y - 3, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Skull Shield on off-hand
  ctx.fillStyle = '#b8ae9a';
  ctx.beginPath();
  ctx.arc(x - 6, y + 10, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1b18'; // Eye sockets
  ctx.fillRect(x - 8, y + 9, 1.5, 2);
  ctx.fillRect(x - 5, y + 9, 1.5, 2);

  // Pale gaunt face with silver-white hair
  ctx.fillStyle = '#e8ded8';
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();

  // Long white hair
  ctx.fillStyle = '#f0ebe6';
  ctx.fillRect(x - 3.5, y - 4, 7, 3);
  ctx.fillRect(x - 4, y - 1, 2, 7);

  ctx.restore();
}

function renderPaladin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _dir: Direction8,
  facingWest: boolean,
  _facingNorth: boolean,
  _animFrame: number,
  _isAttacking: boolean
) {
  ctx.save();
  if (facingWest) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.translate(-x, -y);
  }

  // Steel Plate Armor with Holy Red Tabard
  ctx.fillStyle = '#4d5156'; // Steel greaves
  ctx.fillRect(x - 5, y + 18, 4, 6);
  ctx.fillRect(x + 1, y + 18, 4, 6);

  // Polished Breastplate
  ctx.fillStyle = '#7a8087';
  ctx.fillRect(x - 6, y + 4, 12, 12);

  // Red Tabard down chest
  ctx.fillStyle = '#8b1e1e';
  ctx.fillRect(x - 2, y + 4, 4, 15);

  // Golden Cross emblem on tabard
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(x - 3, y + 7, 6, 1.5);
  ctx.fillRect(x - 0.7, y + 5, 1.5, 6);

  // Kite Shield on left arm
  ctx.fillStyle = '#b8860b'; // Gold trim
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 6);
  ctx.lineTo(x - 2, y + 6);
  ctx.lineTo(x - 5, y + 17);
  ctx.closePath();
  ctx.fill();

  // Holy Longsword in right hand
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(x + 6, y - 2, 2.5, 16);

  // Head with Steel Closed Barbute
  ctx.fillStyle = '#8f959c';
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1e21'; // Visor slit
  ctx.fillRect(x - 2, y, 4, 1.2);

  ctx.restore();
}

function renderAmazon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _dir: Direction8,
  facingWest: boolean,
  _facingNorth: boolean,
  _animFrame: number,
  _isAttacking: boolean
) {
  ctx.save();
  if (facingWest) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.translate(-x, -y);
  }

  // Leather armor & battle skirt
  ctx.fillStyle = '#784d2b';
  ctx.fillRect(x - 5, y + 12, 10, 8);

  // Leather cuirass
  ctx.fillStyle = '#8c5a33';
  ctx.fillRect(x - 5, y + 4, 10, 8);

  // Golden Circlet & Blonde Hair
  ctx.fillStyle = '#f2c852'; // Golden hair ponytail
  ctx.beginPath();
  ctx.arc(x - 2, y - 3, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#eac8aa'; // Face
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d4af37'; // Golden Circlet
  ctx.fillRect(x - 3, y - 2, 6, 1.5);

  // Javelin in hand
  ctx.strokeStyle = '#c49a45';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x + 7, y + 18);
  ctx.lineTo(x + 7, y - 10);
  ctx.stroke();

  // Javelin spearhead
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.moveTo(x + 7, y - 14);
  ctx.lineTo(x + 5, y - 10);
  ctx.lineTo(x + 9, y - 10);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Render Diablo II Monster Sprite (Fallen, Skeleton, Zombie)
 */
export function renderMonster(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  monsterType: 'fallen' | 'skeleton' | 'zombie',
  animTick: number = 0
) {
  ctx.save();
  // Shadow
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 10, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fill();

  const wobble = Math.sin(animTick * 0.1) * 1.5;

  if (monsterType === 'fallen') {
    // Red imp devil with small dagger and wooden shield
    ctx.fillStyle = '#a62424'; // Red skin
    ctx.fillRect(cx - 4, cy - 12 + wobble, 8, 10);
    // Horned head
    ctx.beginPath();
    ctx.arc(cx, cy - 14 + wobble, 4, 0, Math.PI * 2);
    ctx.fill();
    // Yellow glowing eyes
    ctx.fillStyle = '#fff44f';
    ctx.fillRect(cx - 2, cy - 15 + wobble, 1.5, 1.5);
    ctx.fillRect(cx + 1, cy - 15 + wobble, 1.5, 1.5);
    // Dagger
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(cx + 4, cy - 9 + wobble, 6, 2);
  } else if (monsterType === 'skeleton') {
    // Bleached bone skeleton with rusted scimitar
    ctx.fillStyle = '#dcd7c5';
    // Ribcage & spine
    ctx.fillRect(cx - 1, cy - 14 + wobble, 2, 10);
    ctx.fillRect(cx - 4, cy - 12 + wobble, 8, 2);
    ctx.fillRect(cx - 3, cy - 9 + wobble, 6, 2);
    // Skull
    ctx.beginPath();
    ctx.arc(cx, cy - 16 + wobble, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1b18'; // Dark sockets
    ctx.fillRect(cx - 2, cy - 17 + wobble, 1.5, 1.5);
    ctx.fillRect(cx + 1, cy - 17 + wobble, 1.5, 1.5);
    // Curved rusty scimitar
    ctx.strokeStyle = '#856447';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy - 6 + wobble);
    ctx.quadraticCurveTo(cx + 10, cy - 10 + wobble, cx + 8, cy - 18 + wobble);
    ctx.stroke();
  } else {
    // Zombie - bloated decaying green corpse
    ctx.fillStyle = '#3f543f';
    ctx.fillRect(cx - 6, cy - 16 + wobble * 0.5, 12, 14);
    // Head
    ctx.fillStyle = '#4c634c';
    ctx.beginPath();
    ctx.arc(cx, cy - 18 + wobble * 0.5, 5, 0, Math.PI * 2);
    ctx.fill();
    // White milky eyes
    ctx.fillStyle = '#c0ccc0';
    ctx.fillRect(cx - 2, cy - 19 + wobble * 0.5, 1.5, 1.5);
  }

  ctx.restore();
}

/**
 * Render Click Waypoint (Classic Diablo II red / gold expanding diamond pulse)
 */
export function renderClickWaypoint(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  age: number
) {
  if (age >= 1.0) return;
  ctx.save();
  const radius = 10 + age * 16;
  const alpha = 1.0 - age;

  drawIsoDiamond(ctx, cx, cy, radius * 2, radius);
  ctx.strokeStyle = `rgba(220, 30, 30, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  drawIsoDiamond(ctx, cx, cy, radius * 1.2, radius * 0.6);
  ctx.strokeStyle = `rgba(255, 200, 50, ${alpha * 0.9})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}
