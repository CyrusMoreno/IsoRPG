import React, { useState, useRef, useEffect } from 'react';
import { CharacterClass, Direction8 } from '../types/engine';
import {
  renderCatacombsTile,
  renderBloodMoorTile,
  renderHellfireTile,
  renderGothicWall,
  renderGothicPillar,
  renderBrazier,
  renderHeroCharacter,
  renderMonster,
} from '../engine/proceduralSprites';
import { Download, Image, Layers, Sparkles, ZoomIn, Check, FolderDown } from 'lucide-react';

export const AssetStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tiles' | 'characters' | 'structures' | 'hud'>('tiles');
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('barbarian');
  const [previewZoom, setPreviewZoom] = useState<number>(2);
  const [exportedNotice, setExportedNotice] = useState<string | null>(null);

  // Hidden canvas for generating downloadable PNGs
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const notifyExport = (name: string) => {
    setExportedNotice(`Exported ${name}`);
    setTimeout(() => setExportedNotice(null), 3000);
  };

  /**
   * Generates and downloads an RPG Maker VX Ace 8-direction sprite sheet ($Character_8Dir.png)
   * RPG Maker character sheets with '$' filename prefix represent single characters.
   * For 8 directions, we export an 8-row x 3-column sheet (32x48 per frame or 48x64).
   */
  const exportCharacterSheet = (heroCls: CharacterClass) => {
    const canvas = exportCanvasRef.current;
    if (!canvas) return;

    const frameW = 48;
    const frameH = 64;
    const cols = 3; // 3 walk cycle frames
    const rows = 8; // 8 isometric directions

    canvas.width = frameW * cols;
    canvas.height = frameH * rows;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const directions: Direction8[] = [
      'south',
      'south_west',
      'west',
      'north_west',
      'north',
      'north_east',
      'east',
      'south_east',
    ];

    directions.forEach((dir, rowIdx) => {
      for (let col = 0; col < cols; col++) {
        const cx = col * frameW + frameW / 2;
        const cy = rowIdx * frameH + frameH - 12;
        const animFrame = col === 1 ? 0 : col === 0 ? 0.75 : 1.5;
        const isMoving = col !== 1;

        renderHeroCharacter(ctx, cx, cy, heroCls, dir, animFrame, isMoving, false);
      }
    });

    const link = document.createElement('a');
    link.download = `$Diablo_${heroCls.toUpperCase()}_8DIR.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    notifyExport(`$Diablo_${heroCls.toUpperCase()}_8DIR.png (Graphics/Characters/)`);
  };

  /**
   * Generates and downloads an Isometric Tileset Sheet for VX Ace (Graphics/Tilesets/TileB.png)
   */
  const exportTilesetSheet = () => {
    const canvas = exportCanvasRef.current;
    if (!canvas) return;

    // Standard RPG Maker VX Ace Tile sheet is 512x512
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Row 0: Catacombs Floor Variants (64x32 diamonds)
    for (let i = 0; i < 4; i++) {
      const cx = 32 + i * 64;
      const cy = 24;
      renderCatacombsTile(ctx, cx, cy, i);
    }

    // Row 1: Blood Moor Mud & Grass
    for (let i = 0; i < 4; i++) {
      const cx = 32 + i * 64;
      const cy = 64;
      renderBloodMoorTile(ctx, cx, cy, i);
    }

    // Row 2: Hellfire Lava Tiles
    for (let i = 0; i < 4; i++) {
      const cx = 32 + i * 64;
      const cy = 104;
      renderHellfireTile(ctx, cx, cy, i * 15);
    }

    // Row 3: Gothic Walls (NW and NE facets)
    renderGothicWall(ctx, 48, 180, 48, 'NW', 1.0);
    renderGothicWall(ctx, 128, 180, 48, 'NE', 1.0);

    // Row 4: Gothic Pillars & Braziers
    renderGothicPillar(ctx, 210, 180, 56, 1.0);
    renderBrazier(ctx, 280, 175, 10);

    const link = document.createElement('a');
    link.download = `Diablo_Isometric_Tileset_B.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    notifyExport(`Diablo_Isometric_Tileset_B.png (Graphics/Tilesets/)`);
  };

  /**
   * Generates and downloads Animated Brazier Prop sheet
   */
  const exportBrazierSheet = () => {
    const canvas = exportCanvasRef.current;
    if (!canvas) return;

    canvas.width = 128; // 4 frames of 32px
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let frame = 0; frame < 4; frame++) {
      renderBrazier(ctx, 16 + frame * 32, 40, frame * 8);
    }

    const link = document.createElement('a');
    link.download = `!$Diablo_Brazier_Anim.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    notifyExport(`!$Diablo_Brazier_Anim.png (Graphics/Characters/)`);
  };

  return (
    <div className="flex flex-col w-full bg-stone-950 border border-stone-800 rounded-lg overflow-hidden shadow-2xl">
      {/* Hidden canvas for PNG export generation */}
      <canvas ref={exportCanvasRef} className="hidden" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-stone-900 border-b border-stone-800">
        <div>
          <h2 className="font-cinzel text-lg font-bold text-amber-300 flex items-center gap-2">
            <Image className="w-5 h-5 text-amber-500" />
            Diablo II 2.5D Isometric Asset Studio
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Authentic pre-rendered style spritesets and isometric diamond tiles formatted for RPG Maker VX Ace.
          </p>
        </div>

        {/* Global Batch Export */}
        <div className="flex items-center gap-2">
          {exportedNotice && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-700 px-2.5 py-1 rounded flex items-center gap-1.5 animate-pulse">
              <Check className="w-3.5 h-3.5" />
              {exportedNotice}
            </span>
          )}
          <button
            onClick={() => {
              exportTilesetSheet();
              setTimeout(() => exportCharacterSheet('barbarian'), 200);
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-cinzel font-bold text-xs rounded shadow flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <FolderDown className="w-4 h-4" />
            Export Core VX Ace Asset Pack
          </button>
        </div>
      </div>

      {/* Studio Category Navigation */}
      <div className="flex items-center justify-between p-2 bg-stone-950 border-b border-stone-800 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('tiles')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 ${
              activeTab === 'tiles'
                ? 'bg-amber-900/60 text-amber-200 border border-amber-600 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> 64x32 Floor Tiles
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 ${
              activeTab === 'characters'
                ? 'bg-amber-900/60 text-amber-200 border border-amber-600 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> 8-Direction Characters
          </button>
          <button
            onClick={() => setActiveTab('structures')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 ${
              activeTab === 'structures'
                ? 'bg-amber-900/60 text-amber-200 border border-amber-600 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Walls, Pillars & Props
          </button>
        </div>

        {/* Zoom selector */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-stone-400">
          <ZoomIn className="w-3.5 h-3.5 mr-1" />
          <span>Zoom:</span>
          {[1, 2, 4].map((z) => (
            <button
              key={z}
              onClick={() => setPreviewZoom(z)}
              className={`px-1.5 py-0.5 rounded border ${
                previewZoom === z
                  ? 'bg-stone-800 border-amber-600 text-amber-300 font-bold'
                  : 'border-stone-800 text-stone-400'
              }`}
            >
              {z}x
            </button>
          ))}
        </div>
      </div>

      {/* Content Display Area */}
      <div className="p-6 bg-[#0c0a09]">
        {/* ================= TAB 1: 64x32 FLOOR TILES ================= */}
        {activeTab === 'tiles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-cinzel text-sm font-bold text-amber-200">
                  Dimetric Diamond Floor Tiles (64x32)
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Pre-rendered 2:1 ratio tiles ready for RPG Maker VX Ace TileA5 and TileB layers.
                </p>
              </div>
              <button
                onClick={exportTilesetSheet}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded border border-stone-700 font-mono text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Tileset Sheet (PNG)
              </button>
            </div>

            {/* Tile Grid Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Catacombs */}
              <div className="bg-stone-900/70 border border-stone-800 p-4 rounded-lg flex flex-col items-center">
                <span className="font-cinzel text-xs text-amber-300 font-bold mb-3">
                  Catacombs Flagstone
                </span>
                <div
                  className="p-3 bg-stone-950 rounded border border-stone-800 flex items-center justify-center pixelated"
                  style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center' }}
                >
                  <TilePreviewRenderer type="catacombs" />
                </div>
                <div className="mt-8 text-[11px] font-mono text-stone-400 text-center">
                  Flagstones with mortar seams, cracks, and dried blood variants.
                </div>
              </div>

              {/* Blood Moor */}
              <div className="bg-stone-900/70 border border-stone-800 p-4 rounded-lg flex flex-col items-center">
                <span className="font-cinzel text-xs text-amber-300 font-bold mb-3">
                  Blood Moor Mud & Grass
                </span>
                <div
                  className="p-3 bg-stone-950 rounded border border-stone-800 flex items-center justify-center pixelated"
                  style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center' }}
                >
                  <TilePreviewRenderer type="blood_moor" />
                </div>
                <div className="mt-8 text-[11px] font-mono text-stone-400 text-center">
                  Gothic wilderness with muddy tufts, marshy earth, and bone debris.
                </div>
              </div>

              {/* Hellfire Basalt */}
              <div className="bg-stone-900/70 border border-stone-800 p-4 rounded-lg flex flex-col items-center">
                <span className="font-cinzel text-xs text-amber-300 font-bold mb-3">
                  Hellfire / Volcanic Magma
                </span>
                <div
                  className="p-3 bg-stone-950 rounded border border-stone-800 flex items-center justify-center pixelated"
                  style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center' }}
                >
                  <TilePreviewRenderer type="hellfire" />
                </div>
                <div className="mt-8 text-[11px] font-mono text-stone-400 text-center">
                  Basalt volcanic stone with glowing lava fissures and heat veins.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: 8-DIRECTION CHARACTERS ================= */}
        {activeTab === 'characters' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-cinzel text-sm font-bold text-amber-200">
                  Diablo II 8-Direction Character Sheets
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Formatted as <code>$Hero_8DIR.png</code> for the RGSS3 8-direction movement script.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Select Class */}
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value as CharacterClass)}
                  className="bg-stone-900 border border-stone-700 text-amber-200 rounded px-2.5 py-1 text-xs font-cinzel font-bold"
                >
                  <option value="barbarian">Barbarian (Two-Handed Sword)</option>
                  <option value="sorceress">Sorceress (Staff & Aura)</option>
                  <option value="necromancer">Necromancer (Bone Wand)</option>
                  <option value="paladin">Paladin (Plate & Shield)</option>
                  <option value="amazon">Amazon (Javelin)</option>
                </select>

                <button
                  onClick={() => exportCharacterSheet(selectedClass)}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 text-stone-950 font-bold rounded font-mono text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export Sheet (PNG)
                </button>
              </div>
            </div>

            {/* 8-Direction Previews in Circle */}
            <div className="p-6 bg-stone-950 rounded-lg border border-stone-800 flex flex-col items-center justify-center">
              <div className="font-cinzel text-xs text-amber-300 font-bold mb-4">
                8-Directional Pose Matrix: {selectedClass.toUpperCase()}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {(
                  [
                    'south',
                    'south_west',
                    'west',
                    'north_west',
                    'north',
                    'north_east',
                    'east',
                    'south_east',
                  ] as Direction8[]
                ).map((dir) => (
                  <div
                    key={dir}
                    className="flex flex-col items-center p-2 bg-stone-900/80 rounded border border-stone-800"
                  >
                    <div
                      className="w-14 h-16 flex items-center justify-center pixelated"
                      style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center' }}
                    >
                      <CharacterFrameRenderer heroClass={selectedClass} direction={dir} />
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 mt-2 uppercase">
                      {dir.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-3 bg-stone-900/60 rounded border border-stone-800 max-w-lg text-center text-xs text-stone-300 font-mono">
                <span className="text-amber-400 font-bold">VX Ace Drop-in Path:</span>{' '}
                <code>YourProject/Graphics/Characters/$Diablo_{selectedClass.toUpperCase()}_8DIR.png</code>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: STRUCTURES & PROPS ================= */}
        {activeTab === 'structures' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-cinzel text-sm font-bold text-amber-200">
                  Gothic Walls, Pillars & Animated Props
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  High-profile architectural elements supporting RGSS3 wall cutaway alpha fading.
                </p>
              </div>
              <button
                onClick={exportBrazierSheet}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded border border-stone-700 font-mono text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Brazier Anim (PNG)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Gothic Pillar */}
              <div className="bg-stone-900/70 border border-stone-800 p-4 rounded-lg flex flex-col items-center">
                <span className="font-cinzel text-xs text-amber-300 font-bold mb-3">
                  Cathedral Pillar (Carved)
                </span>
                <div
                  className="h-28 flex items-center justify-center pixelated"
                  style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center' }}
                >
                  <PillarPreviewRenderer />
                </div>
                <div className="mt-4 text-[11px] font-mono text-stone-400 text-center">
                  Gargoyle stepped base with fluted column shaft and diamond cap.
                </div>
              </div>

              {/* Gothic Wall Segment */}
              <div className="bg-stone-900/70 border border-stone-800 p-4 rounded-lg flex flex-col items-center">
                <span className="font-cinzel text-xs text-amber-300 font-bold mb-3">
                  Gothic Masonry Wall
                </span>
                <div
                  className="h-28 flex items-center justify-center pixelated"
                  style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center' }}
                >
                  <WallPreviewRenderer />
                </div>
                <div className="mt-4 text-[11px] font-mono text-stone-400 text-center">
                  2.5D stone block wall designed for smooth isometric occlusion fading.
                </div>
              </div>

              {/* Flaming Brazier */}
              <div className="bg-stone-900/70 border border-stone-800 p-4 rounded-lg flex flex-col items-center">
                <span className="font-cinzel text-xs text-amber-300 font-bold mb-3">
                  Flaming Iron Brazier
                </span>
                <div
                  className="h-28 flex items-center justify-center pixelated"
                  style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center' }}
                >
                  <BrazierPreviewRenderer />
                </div>
                <div className="mt-4 text-[11px] font-mono text-stone-400 text-center">
                  Iron tripod brazier with animated flame sprites for dungeon illumination.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Canvas Preview Subcomponents
const TilePreviewRenderer: React.FC<{ type: 'catacombs' | 'blood_moor' | 'hellfire' }> = ({
  type,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (type === 'catacombs') renderCatacombsTile(ctx, cx, cy, 1);
    else if (type === 'blood_moor') renderBloodMoorTile(ctx, cx, cy, 0);
    else renderHellfireTile(ctx, cx, cy, 20);
  }, [type]);

  return <canvas ref={canvasRef} width={68} height={36} />;
};

const CharacterFrameRenderer: React.FC<{ heroClass: CharacterClass; direction: Direction8 }> = ({
  heroClass,
  direction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height - 10;

    renderHeroCharacter(ctx, cx, cy, heroClass, direction, 0, false, false);
  }, [heroClass, direction]);

  return <canvas ref={canvasRef} width={40} height={52} />;
};

const PillarPreviewRenderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height - 10;
    renderGothicPillar(ctx, cx, cy, 54, 1.0);
  }, []);

  return <canvas ref={canvasRef} width={48} height={76} />;
};

const WallPreviewRenderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height - 16;
    renderGothicWall(ctx, cx, cy, 46, 'NW', 1.0);
  }, []);

  return <canvas ref={canvasRef} width={68} height={76} />;
};

const BrazierPreviewRenderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height - 8;
      renderBrazier(ctx, cx, cy, tick);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} width={40} height={48} />;
};
