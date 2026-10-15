export type CharacterClass = 'barbarian' | 'sorceress' | 'necromancer' | 'paladin' | 'amazon';

export type Direction8 = 
  | 'south' 
  | 'south_west' 
  | 'west' 
  | 'north_west' 
  | 'north' 
  | 'north_east' 
  | 'east' 
  | 'south_east';

export interface Point2D {
  x: number;
  y: number;
}

export interface IsoTile {
  id: string;
  type: 'floor' | 'wall' | 'pillar' | 'stairs' | 'brazier' | 'chest' | 'altar';
  texture: string;
  elevation: number;
  passable: boolean;
  opacity?: number;
  animated?: boolean;
}

export interface MapData {
  width: number;
  height: number;
  name: string;
  theme: 'catacombs' | 'blood_moor' | 'lut_gholein' | 'kurast' | 'hellfire';
  tiles: (IsoTile | null)[][];
  entities: Entity[];
}

export interface Entity {
  id: string;
  name: string;
  type: 'player' | 'monster' | 'loot' | 'light_source';
  x: number;
  y: number;
  screenX?: number;
  screenY?: number;
  elevation: number;
  direction: Direction8;
  animFrame: number;
  classType?: CharacterClass;
  monsterType?: 'fallen' | 'skeleton' | 'zombie';
  health?: number;
  maxHealth?: number;
  isMoving?: boolean;
  targetX?: number;
  targetY?: number;
  opacity?: number;
}

export type ViewMode = 'isometric' | 'orthogonal' | 'split';

export interface Rgss3Script {
  id: string;
  title: string;
  filename: string;
  category: 'core' | 'renderer' | 'movement' | 'mouse' | 'lighting' | 'hud';
  description: string;
  version: string;
  code: string;
  instructions: string[];
}
