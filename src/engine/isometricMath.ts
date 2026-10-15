import { Direction8, Point2D } from '../types/engine';

export const ISO_CONFIG = {
  TILE_WIDTH: 64,
  TILE_HEIGHT: 32,
  ELEVATION_STEP: 16,
  DIAGONAL_RATIO: 2.0, // 2:1 dimetric projection (classic Diablo II standard)
  ORTHO_TILE_SIZE: 32, // standard RPG Maker VX Ace grid tile size
};

/**
 * Transforms isometric world coordinates (x, y, elevation) into 2D screen coordinates.
 * This is the exact formula implemented in RGSS3:
 *   screen_x = (x - y) * (TILE_WIDTH / 2) + origin_x
 *   screen_y = (x + y) * (TILE_HEIGHT / 2) - (elevation * ELEVATION_STEP) + origin_y
 */
export function isoToScreen(
  x: number,
  y: number,
  elevation: number = 0,
  originX: number = 0,
  originY: number = 0,
  tileW: number = ISO_CONFIG.TILE_WIDTH,
  tileH: number = ISO_CONFIG.TILE_HEIGHT,
  elevStep: number = ISO_CONFIG.ELEVATION_STEP
): Point2D {
  const halfW = tileW / 2;
  const halfH = tileH / 2;
  const screenX = (x - y) * halfW + originX;
  const screenY = (x + y) * halfH - elevation * elevStep + originY;
  return { x: screenX, y: screenY };
}

/**
 * Transforms 2D screen coordinates into isometric world tile coordinates.
 * Inverts the dimetric projection matrix:
 *   iso_x = ( (screen_x - origin_x) / halfW + (screen_y - origin_y) / halfH ) / 2
 *   iso_y = ( (screen_y - origin_y) / halfH - (screen_x - origin_x) / halfW ) / 2
 */
export function screenToIso(
  screenX: number,
  screenY: number,
  originX: number = 0,
  originY: number = 0,
  tileW: number = ISO_CONFIG.TILE_WIDTH,
  tileH: number = ISO_CONFIG.TILE_HEIGHT
): Point2D {
  const halfW = tileW / 2;
  const halfH = tileH / 2;
  const dx = screenX - originX;
  const dy = screenY - originY;
  const isoX = (dx / halfW + dy / halfH) / 2;
  const isoY = (dy / halfH - dx / halfW) / 2;
  return { x: isoX, y: isoY };
}

/**
 * Converts standard RPG Maker VX Ace orthogonal coordinates (32x32) into Isometric coordinates
 */
export function orthoToIsoScreen(
  gridX: number,
  gridY: number,
  originX: number = 0,
  originY: number = 0
): Point2D {
  return isoToScreen(gridX, gridY, 0, originX, originY);
}

/**
 * Calculates Z-ordering depth for isometric sorting:
 * In isometric projection, sprites further down on screen or with higher (x + y) should render in front.
 * Elevation layers lift the sprite into its own z-slice.
 */
export function calculateZDepth(
  x: number,
  y: number,
  elevation: number = 0,
  subPriority: number = 0
): number {
  return Math.floor((x + y) * 100) + elevation * 1000 + subPriority;
}

/**
 * Determines 8-direction from angle (in radians)
 */
export function angleToDirection8(angleRad: number): Direction8 {
  // Normalize angle between 0 and 2*PI
  let angle = angleRad;
  while (angle < 0) angle += Math.PI * 2;
  while (angle >= Math.PI * 2) angle -= Math.PI * 2;

  // Segment circle into 8 slices of 45 degrees (PI/4)
  const slice = Math.PI / 4;
  const offset = slice / 2;
  const shifted = (angle + offset) % (Math.PI * 2);
  const index = Math.floor(shifted / slice);

  // In isometric projection:
  // 0 rad = East (X+, Y-)
  // PI/4 rad = South-East (X+)
  // PI/2 rad = South (X+, Y+)
  // 3*PI/4 rad = South-West (Y+)
  // PI rad = West (X-, Y+)
  // 5*PI/4 rad = North-West (X-)
  // 3*PI/2 rad = North (X-, Y-)
  // 7*PI/4 rad = North-East (Y-)
  const directions: Direction8[] = [
    'east',
    'south_east',
    'south',
    'south_west',
    'west',
    'north_west',
    'north',
    'north_east',
  ];

  return directions[index] || 'south';
}

/**
 * Direction vector in isometric space
 */
export function directionToVector(dir: Direction8): { dx: number; dy: number } {
  switch (dir) {
    case 'north':
      return { dx: -0.707, dy: -0.707 };
    case 'south':
      return { dx: 0.707, dy: 0.707 };
    case 'east':
      return { dx: 0.707, dy: -0.707 };
    case 'west':
      return { dx: -0.707, dy: 0.707 };
    case 'north_east':
      return { dx: 0, dy: -1 };
    case 'south_east':
      return { dx: 1, dy: 0 };
    case 'south_west':
      return { dx: 0, dy: 1 };
    case 'north_west':
      return { dx: -1, dy: 0 };
  }
}

/**
 * Calculates whether an entity at playerPos is obscured by a wall/prop at objPos
 */
export function isObscuringPlayer(
  playerX: number,
  playerY: number,
  objX: number,
  objY: number,
  objHeight: number = 1
): boolean {
  // If object is "in front" of player along projection (objX >= playerX and objY >= playerY)
  // and close enough to cast a visual occlusion shadow
  const dx = objX - playerX;
  const dy = objY - playerY;
  return dx >= 0 && dx <= 1.5 && dy >= 0 && dy <= 1.5 && (dx > 0 || dy > 0);
}
