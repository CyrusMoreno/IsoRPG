import React, { useState, useRef, useEffect } from 'react';
import { isoToScreen, screenToIso, ISO_CONFIG } from '../engine/isometricMath';
import { drawIsoDiamond, renderCatacombsTile } from '../engine/proceduralSprites';
import { Calculator, Compass, ArrowRight, Code, Layers } from 'lucide-react';

export const CoordinateSandbox: React.FC = () => {
  const [mapX, setMapX] = useState<number>(4);
  const [mapY, setMapY] = useState<number>(3);
  const [elevation, setElevation] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const screenCoords = isoToScreen(
    mapX,
    mapY,
    elevation,
    180, // Origin X centered in 360px canvas
    40,  // Origin Y
    ISO_CONFIG.TILE_WIDTH,
    ISO_CONFIG.TILE_HEIGHT,
    ISO_CONFIG.ELEVATION_STEP
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0908';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const originX = 180;
    const originY = 40;

    // Draw reference 6x6 isometric grid
    ctx.strokeStyle = '#22201d';
    ctx.lineWidth = 1;

    for (let y = 0; y <= 6; y++) {
      for (let x = 0; x <= 6; x++) {
        const p = isoToScreen(x, y, 0, originX, originY);
        drawIsoDiamond(ctx, p.x, p.y, 64, 32);
        ctx.stroke();
      }
    }

    // Highlight selected diamond tile
    renderCatacombsTile(ctx, screenCoords.x, screenCoords.y, 0);

    // Outline selected tile
    drawIsoDiamond(ctx, screenCoords.x, screenCoords.y, 64, 32);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Center point marker
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(screenCoords.x, screenCoords.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Label coordinates
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      `Tile [${mapX}, ${mapY}]`,
      screenCoords.x - 30,
      screenCoords.y - 18
    );
  }, [mapX, mapY, elevation, screenCoords.x, screenCoords.y]);

  return (
    <div className="flex flex-col w-full bg-stone-950 border border-stone-800 rounded-lg overflow-hidden shadow-2xl">
      <div className="p-4 bg-stone-900 border-b border-stone-800">
        <h2 className="font-cinzel text-lg font-bold text-amber-300 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-500" />
          Dimetric 2:1 Isometric Projection Matrix Math
        </h2>
        <p className="text-xs text-stone-400 mt-0.5">
          Mathematical breakdown of how RPG Maker VX Ace's 32x32 square grid is transformed into Diablo II's 64x32 diamond coordinates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-[#0c0a09]">
        {/* Left: Interactive Canvas Visualization */}
        <div className="flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 text-xs font-mono text-stone-400">
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Compass className="w-4 h-4 text-amber-500" /> Interactive Diamond Grid (6x6)
            </span>
            <span>Origin: (180, 40)</span>
          </div>

          <div className="border border-stone-800 rounded-lg overflow-hidden bg-black p-1 shadow-inner">
            <canvas
              ref={canvasRef}
              width={360}
              height={260}
              className="block pixelated"
            />
          </div>

          {/* Interactive Sliders */}
          <div className="w-full max-w-sm mt-4 space-y-3 bg-stone-900/60 p-4 rounded border border-stone-800 text-xs font-mono">
            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Map X Coordinate:</span>
                <span className="text-amber-400 font-bold">{mapX}</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="1"
                value={mapX}
                onChange={(e) => setMapX(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Map Y Coordinate:</span>
                <span className="text-amber-400 font-bold">{mapY}</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="1"
                value={mapY}
                onChange={(e) => setMapY(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Elevation Level (Z-Lift):</span>
                <span className="text-emerald-400 font-bold">+{elevation * 16}px (Tier {elevation})</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={elevation}
                onChange={(e) => setElevation(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Formulas & Live RGSS3 Code */}
        <div className="space-y-4">
          {/* Output Results Box */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-lg p-4 font-mono text-xs space-y-2">
            <div className="font-cinzel text-xs text-amber-300 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-500" /> Transformation Results
            </div>
            <div className="flex items-center justify-between p-2 bg-stone-950 rounded border border-stone-800">
              <span className="text-stone-400">RPG Maker Map Grid [X, Y]:</span>
              <span className="text-amber-300 font-bold">[{mapX}, {mapY}]</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-stone-950 rounded border border-stone-800">
              <span className="text-stone-400">Calculated Screen [X, Y]:</span>
              <span className="text-emerald-400 font-bold">
                ({screenCoords.x.toFixed(1)}, {screenCoords.y.toFixed(1)})
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-stone-950 rounded border border-stone-800">
              <span className="text-stone-400">Z-Sorting Depth Value:</span>
              <span className="text-blue-400 font-bold">
                {(mapX + mapY) * 100 + elevation * 1000}
              </span>
            </div>
          </div>

          {/* Mathematical Formulas */}
          <div className="bg-stone-900/60 border border-stone-800 rounded-lg p-4 font-mono text-xs space-y-3">
            <div className="text-amber-400 font-bold font-cinzel text-xs flex items-center gap-1.5">
              <Code className="w-4 h-4" /> RGSS3 Ruby Math Reference
            </div>

            <div className="p-2.5 bg-stone-950 rounded border border-stone-800/80 space-y-1">
              <div className="text-stone-400 text-[11px]">// 1. Isometric to Screen (Rendering):</div>
              <div className="text-amber-200">
                screen_x = (x - y) * (TILE_WIDTH / 2)
              </div>
              <div className="text-amber-200">
                screen_y = (x + y) * (TILE_HEIGHT / 2) - (elevation * 16)
              </div>
            </div>

            <div className="p-2.5 bg-stone-950 rounded border border-stone-800/80 space-y-1">
              <div className="text-stone-400 text-[11px]">// 2. Screen to Isometric (Mouse Click):</div>
              <div className="text-emerald-300">
                iso_x = ( (screen_x / 32) + (screen_y / 16) ) / 2
              </div>
              <div className="text-emerald-300">
                iso_y = ( (screen_y / 16) - (screen_x / 32) ) / 2
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
