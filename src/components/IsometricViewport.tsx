import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CharacterClass, Direction8, Entity, IsoTile, MapData, ViewMode } from '../types/engine';
import {
  isoToScreen,
  screenToIso,
  angleToDirection8,
  calculateZDepth,
  ISO_CONFIG,
  isObscuringPlayer,
} from '../engine/isometricMath';
import {
  renderCatacombsTile,
  renderBloodMoorTile,
  renderHellfireTile,
  renderGothicWall,
  renderGothicPillar,
  renderBrazier,
  renderHeroCharacter,
  renderMonster,
  renderClickWaypoint,
  drawIsoDiamond,
} from '../engine/proceduralSprites';
import { soundManager } from '../engine/audioSynthesizer';
import { DiabloHUD } from './DiabloHUD';
import {
  Shield,
  Eye,
  Sliders,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Layers,
  MapPin,
  Crosshair,
} from 'lucide-react';

interface IsometricViewportProps {
  heroClass: CharacterClass;
  onClassChange: (cls: CharacterClass) => void;
  onCoordinatesChange?: (screen: { x: number; y: number }, iso: { x: number; y: number }, tile: { x: number; y: number }) => void;
}

export const IsometricViewport: React.FC<IsometricViewportProps> = ({
  heroClass,
  onClassChange,
  onCoordinatesChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const orthoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Engine state
  const [viewMode, setViewMode] = useState<ViewMode>('isometric');
  const [mapTheme, setMapTheme] = useState<'catacombs' | 'blood_moor' | 'hellfire'>('catacombs');
  const [zoom, setZoom] = useState<number>(1.25);
  const [enableTorch, setEnableTorch] = useState<boolean>(true);
  const [enableWallFade, setEnableWallFade] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [activeBrush, setActiveBrush] = useState<'inspect' | 'wall' | 'pillar' | 'brazier' | 'monster' | 'erase'>('inspect');

  // Player stats
  const [playerHp, setPlayerHp] = useState<number>(340);
  const [maxHp] = useState<number>(340);
  const [playerMp, setPlayerMp] = useState<number>(180);
  const [maxMp] = useState<number>(180);
  const [stamina, setStamina] = useState<number>(120);
  const [maxStamina] = useState<number>(120);
  const [gold, setGold] = useState<number>(12450);
  const [beltPotions, setBeltPotions] = useState<('health' | 'mana' | null)[]>([
    'health',
    'health',
    'mana',
    'mana',
  ]);
  const [isAttacking, setIsAttacking] = useState<boolean>(false);

  // Entities & Map data
  const MAP_SIZE = 14;
  const initialMapRef = useRef<MapData>({
    width: MAP_SIZE,
    height: MAP_SIZE,
    name: 'The Catacombs: Level 2',
    theme: 'catacombs',
    tiles: Array.from({ length: MAP_SIZE }, (_, y) =>
      Array.from({ length: MAP_SIZE }, (_, x) => {
        // Build perimeter walls & some pillars
        const isBorder = x === 0 || y === 0 || x === MAP_SIZE - 1 || y === MAP_SIZE - 1;
        const isPillar = (x === 4 && y === 4) || (x === 9 && y === 4) || (x === 4 && y === 9) || (x === 9 && y === 9);
        const isWallInner = (x === 6 && y >= 3 && y <= 5);
        const isBrazier = (x === 3 && y === 3) || (x === 10 && y === 10);

        if (isBorder || isWallInner) {
          return {
            id: `wall_${x}_${y}`,
            type: 'wall',
            texture: 'wall_stone',
            elevation: 0,
            passable: false,
          } as IsoTile;
        }
        if (isPillar) {
          return {
            id: `pillar_${x}_${y}`,
            type: 'pillar',
            texture: 'pillar_carved',
            elevation: 0,
            passable: false,
          } as IsoTile;
        }
        if (isBrazier) {
          return {
            id: `brazier_${x}_${y}`,
            type: 'brazier',
            texture: 'brazier_flame',
            elevation: 0,
            passable: false,
            animated: true,
          } as IsoTile;
        }

        return {
          id: `floor_${x}_${y}`,
          type: 'floor',
          texture: 'catacomb_stone',
          elevation: 0,
          passable: true,
        } as IsoTile;
      })
    ),
    entities: [
      {
        id: 'player_hero',
        name: 'The Hero',
        type: 'player',
        x: 6.5,
        y: 7.5,
        elevation: 0,
        direction: 'south',
        animFrame: 0,
        classType: 'barbarian',
        isMoving: false,
      },
      {
        id: 'mon_1',
        name: 'Fallen Imp',
        type: 'monster',
        monsterType: 'fallen',
        x: 8.5,
        y: 6.5,
        elevation: 0,
        direction: 'west',
        animFrame: 0,
      },
      {
        id: 'mon_2',
        name: 'Skeleton Archer',
        type: 'monster',
        monsterType: 'skeleton',
        x: 5.5,
        y: 3.5,
        elevation: 0,
        direction: 'south_east',
        animFrame: 0,
      },
      {
        id: 'mon_3',
        name: 'Rotting Zombie',
        type: 'monster',
        monsterType: 'zombie',
        x: 9.5,
        y: 8.5,
        elevation: 0,
        direction: 'north_west',
        animFrame: 0,
      },
    ],
  });

  const mapData = initialMapRef.current;
  const playerEntity = mapData.entities[0];

  // Destination & Waypoint tracking
  const targetPosRef = useRef<{ x: number; y: number } | null>(null);
  const waypointMarkerRef = useRef<{ x: number; y: number; age: number } | null>(null);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const animTickRef = useRef<number>(0);
  const lastFootstepTickRef = useRef<number>(0);

  // Mouse hover coordinate info
  const [hoverInfo, setHoverInfo] = useState<{
    screenX: number;
    screenY: number;
    isoX: number;
    isoY: number;
    tileX: number;
    tileY: number;
  }>({ screenX: 0, screenY: 0, isoX: 0, isoY: 0, tileX: 0, tileY: 0 });

  // Update hero class on entity
  useEffect(() => {
    playerEntity.classType = heroClass;
  }, [heroClass, playerEntity]);

  // Audio mute sync
  const toggleAudio = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    soundManager.setMuted(nextState);
    if (!nextState) {
      soundManager.startAmbient();
    }
  };

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotkeys for potions [1, 2, 3, 4]
      if (['1', '2', '3', '4'].includes(e.key)) {
        const slot = parseInt(e.key, 10) - 1;
        handleUsePotion(slot);
        return;
      }

      // Space: Attack
      if (e.code === 'Space') {
        handleAttack();
        return;
      }

      keysPressedRef.current[e.code] = true;
      keysPressedRef.current[e.key.toLowerCase()] = true;

      // Start ambient sound on first user action
      if (!isAudioMuted) {
        soundManager.startAmbient();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
      keysPressedRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isAudioMuted]);

  // Attack handler
  const handleAttack = useCallback(() => {
    if (isAttacking) return;
    setIsAttacking(true);
    soundManager.playSlash();
    setTimeout(() => {
      setIsAttacking(false);
    }, 280);
  }, [isAttacking]);

  // Use Potion handler
  const handleUsePotion = useCallback(
    (slotIndex: number) => {
      const potion = beltPotions[slotIndex];
      if (!potion) return;

      soundManager.playPotion();
      if (potion === 'health') {
        setPlayerHp((prev) => Math.min(maxHp, prev + 120));
      } else {
        setPlayerMp((prev) => Math.min(maxMp, prev + 90));
      }

      setBeltPotions((prev) => {
        const copy = [...prev];
        copy[slotIndex] = null;
        return copy;
      });
    },
    [beltPotions, maxHp, maxMp]
  );

  // Main Game Loop & Canvas Renderer
  useEffect(() => {
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const orthoCanvas = orthoCanvasRef.current;
    const orthoCtx = orthoCanvas ? orthoCanvas.getContext('2d') : null;

    const renderLoop = () => {
      animTickRef.current += 1;
      const tick = animTickRef.current;

      // -------------------------------------------------------------
      // 1. UPDATE PLAYER MOVEMENT (Keyboard 8-Way & Mouse Waypoint)
      // -------------------------------------------------------------
      const keys = keysPressedRef.current;
      const moveSpeed = 0.08;
      let moveDx = 0;
      let moveDy = 0;

      // Map keyboard input into Isometric Coordinate vectors:
      // In Isometric 2.5D:
      // UP moves North (-X, -Y in diamond grid)
      // DOWN moves South (+X, +Y in diamond grid)
      // LEFT moves West (-X, +Y in diamond grid)
      // RIGHT moves East (+X, -Y in diamond grid)
      const up = keys['KeyW'] || keys['ArrowUp'];
      const down = keys['KeyS'] || keys['ArrowDown'];
      const left = keys['KeyA'] || keys['ArrowLeft'];
      const right = keys['KeyD'] || keys['ArrowRight'];

      if (up && right) {
        // North-East -> isometric Y-
        moveDx = 0;
        moveDy = -moveSpeed;
        playerEntity.direction = 'north_east';
      } else if (up && left) {
        // North-West -> isometric X-
        moveDx = -moveSpeed;
        moveDy = 0;
        playerEntity.direction = 'north_west';
      } else if (down && right) {
        // South-East -> isometric X+
        moveDx = moveSpeed;
        moveDy = 0;
        playerEntity.direction = 'south_east';
      } else if (down && left) {
        // South-West -> isometric Y+
        moveDx = 0;
        moveDy = moveSpeed;
        playerEntity.direction = 'south_west';
      } else if (up) {
        // True North -> -X, -Y
        moveDx = -moveSpeed * 0.707;
        moveDy = -moveSpeed * 0.707;
        playerEntity.direction = 'north';
      } else if (down) {
        // True South -> +X, +Y
        moveDx = moveSpeed * 0.707;
        moveDy = moveSpeed * 0.707;
        playerEntity.direction = 'south';
      } else if (left) {
        // True West -> -X, +Y
        moveDx = -moveSpeed * 0.707;
        moveDy = moveSpeed * 0.707;
        playerEntity.direction = 'west';
      } else if (right) {
        // True East -> +X, -Y
        moveDx = moveSpeed * 0.707;
        moveDy = -moveSpeed * 0.707;
        playerEntity.direction = 'east';
      } else if (targetPosRef.current) {
        // Mouse click-to-move path interpolation
        const tx = targetPosRef.current.x;
        const ty = targetPosRef.current.y;
        const diffX = tx - playerEntity.x;
        const diffY = ty - playerEntity.y;
        const dist = Math.sqrt(diffX * diffX + diffY * diffY);

        if (dist > 0.15) {
          moveDx = (diffX / dist) * moveSpeed;
          moveDy = (diffY / dist) * moveSpeed;
          // Determine 8-way facing from angle in screen space
          const screenDx = (diffX - diffY);
          const screenDy = (diffX + diffY) * 0.5;
          const angle = Math.atan2(screenDy, screenDx);
          playerEntity.direction = angleToDirection8(angle);
        } else {
          // Reached destination
          targetPosRef.current = null;
        }
      }

      const isCurrentlyMoving = moveDx !== 0 || moveDy !== 0;
      playerEntity.isMoving = isCurrentlyMoving;

      if (isCurrentlyMoving) {
        // Proposed new coordinate
        const nextX = playerEntity.x + moveDx;
        const nextY = playerEntity.y + moveDy;

        // Collision detection against map bounds and impassable tiles
        const checkTileX = Math.floor(nextX);
        const checkTileY = Math.floor(nextY);

        if (
          checkTileX >= 1 &&
          checkTileX < MAP_SIZE - 1 &&
          checkTileY >= 1 &&
          checkTileY < MAP_SIZE - 1
        ) {
          const tile = mapData.tiles[checkTileY]?.[checkTileX];
          if (!tile || tile.passable) {
            playerEntity.x = nextX;
            playerEntity.y = nextY;
          }
        }

        // Animate walk cycle
        playerEntity.animFrame = (tick * 0.15) % 4;

        // Play footstep sound periodically
        if (tick - lastFootstepTickRef.current > 18) {
          soundManager.playFootstep();
          lastFootstepTickRef.current = tick;
        }

        // Drain stamina slightly while walking
        setStamina((prev) => Math.max(10, prev - 0.05));
      } else {
        // Regenerate stamina
        setStamina((prev) => Math.min(maxStamina, prev + 0.1));
      }

      // Update Waypoint Click Animation
      if (waypointMarkerRef.current) {
        waypointMarkerRef.current.age += 0.04;
        if (waypointMarkerRef.current.age >= 1.0) {
          waypointMarkerRef.current = null;
        }
      }

      // -------------------------------------------------------------
      // 2. ISOMETRIC CANVAS RENDERING
      // -------------------------------------------------------------
      const width = canvas.width;
      const height = canvas.height;

      // Dark dungeon clear
      ctx.fillStyle = '#080706';
      ctx.fillRect(0, 0, width, height);

      // Camera center focused smoothly on player
      const originX = width / 2;
      const originY = height / 2;

      // Player screen position in unscaled space
      const playerPos = isoToScreen(playerEntity.x, playerEntity.y, 0, 0, 0);

      ctx.save();
      // Apply Zoom & Camera Pan
      ctx.translate(originX, originY);
      ctx.scale(zoom, zoom);
      ctx.translate(-playerPos.x, -playerPos.y);

      // Collect all drawables for proper isometric Z-sorting
      interface Drawable {
        z: number;
        draw: () => void;
      }
      const drawables: Drawable[] = [];

      // A. Ground Floor Tiles
      for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
          const tile = mapData.tiles[y]?.[x];
          const pos = isoToScreen(x, y, 0, 0, 0);

          // Draw base floor diamond under everything
          drawables.push({
            z: calculateZDepth(x, y, -1, 0),
            draw: () => {
              if (mapTheme === 'catacombs') {
                const variant = (x * 7 + y * 13) % 4;
                renderCatacombsTile(ctx, pos.x, pos.y, variant);
              } else if (mapTheme === 'blood_moor') {
                const variant = (x * 3 + y * 5) % 2;
                renderBloodMoorTile(ctx, pos.x, pos.y, variant);
              } else {
                renderHellfireTile(ctx, pos.x, pos.y, tick);
              }
            },
          });

          // B. Wall / Pillar / Prop Tiles
          if (tile && !tile.passable) {
            // Check wall occlusion for transparency
            const occluding = enableWallFade && isObscuringPlayer(playerEntity.x, playerEntity.y, x, y);
            const opacity = occluding ? 0.35 : 1.0;

            if (tile.type === 'wall') {
              drawables.push({
                z: calculateZDepth(x, y, 0, 20),
                draw: () => {
                  const facing = (x + y) % 2 === 0 ? 'NW' : 'NE';
                  renderGothicWall(ctx, pos.x, pos.y, 44, facing, opacity);
                },
              });
            } else if (tile.type === 'pillar') {
              drawables.push({
                z: calculateZDepth(x, y, 0, 30),
                draw: () => {
                  renderGothicPillar(ctx, pos.x, pos.y, 52, opacity);
                },
              });
            } else if (tile.type === 'brazier') {
              drawables.push({
                z: calculateZDepth(x, y, 0, 15),
                draw: () => {
                  renderBrazier(ctx, pos.x, pos.y, tick);
                },
              });
            }
          }
        }
      }

      // C. Monsters / Entities
      for (let i = 1; i < mapData.entities.length; i++) {
        const ent = mapData.entities[i];
        const entPos = isoToScreen(ent.x, ent.y, 0, 0, 0);
        drawables.push({
          z: calculateZDepth(ent.x, ent.y, 0, 25),
          draw: () => {
            if (ent.monsterType) {
              renderMonster(ctx, entPos.x, entPos.y, ent.monsterType, tick);
            }
          },
        });
      }

      // D. The Hero Player Entity
      drawables.push({
        z: calculateZDepth(playerEntity.x, playerEntity.y, 0, 28),
        draw: () => {
          renderHeroCharacter(
            ctx,
            playerPos.x,
            playerPos.y,
            heroClass,
            playerEntity.direction,
            playerEntity.animFrame,
            playerEntity.isMoving,
            isAttacking
          );
        },
      });

      // E. Click Waypoint Marker
      if (waypointMarkerRef.current) {
        const wp = waypointMarkerRef.current;
        const wpPos = isoToScreen(wp.x, wp.y, 0, 0, 0);
        drawables.push({
          z: calculateZDepth(wp.x, wp.y, 0, 5),
          draw: () => {
            renderClickWaypoint(ctx, wpPos.x, wpPos.y, wp.age);
          },
        });
      }

      // Sort by Z and draw in ascending order
      drawables.sort((a, b) => a.z - b.z);
      drawables.forEach((item) => item.draw());

      ctx.restore();

      // -------------------------------------------------------------
      // 3. DIABLO II TORCHLIGHT RADIUS & DARK VIGNETTE
      // -------------------------------------------------------------
      if (enableTorch) {
        ctx.save();
        const flicker = Math.sin(tick * 0.22) * 5 + Math.cos(tick * 0.31) * 3;
        const torchRadius = 180 + flicker;

        // Dark ambient darkness overlay with radial transparent hole centered on hero (screen center)
        const darkGrad = ctx.createRadialGradient(
          originX,
          originY,
          torchRadius * 0.3,
          originX,
          originY,
          torchRadius
        );
        darkGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        darkGrad.addColorStop(0.65, 'rgba(8, 7, 6, 0.45)');
        darkGrad.addColorStop(0.9, 'rgba(6, 5, 4, 0.88)');
        darkGrad.addColorStop(1, 'rgba(4, 3, 3, 0.98)');

        ctx.fillStyle = darkGrad;
        ctx.fillRect(0, 0, width, height);

        // Torch amber warm highlight at inner core
        const warmGlow = ctx.createRadialGradient(
          originX,
          originY,
          0,
          originX,
          originY,
          torchRadius * 0.5
        );
        warmGlow.addColorStop(0, 'rgba(255, 180, 50, 0.08)');
        warmGlow.addColorStop(1, 'rgba(255, 120, 20, 0)');
        ctx.fillStyle = warmGlow;
        ctx.fillRect(0, 0, width, height);

        ctx.restore();
      }

      // -------------------------------------------------------------
      // 4. ORTHOGONAL 2D RPG MAKER VX ACE GRID (if active or split)
      // -------------------------------------------------------------
      if (orthoCtx && (viewMode === 'orthogonal' || viewMode === 'split')) {
        const oW = orthoCanvas!.width;
        const oH = orthoCanvas!.height;
        orthoCtx.fillStyle = '#1c1917';
        orthoCtx.fillRect(0, 0, oW, oH);

        const tileSize = 24;
        const offsetX = (oW - MAP_SIZE * tileSize) / 2;
        const offsetY = (oH - MAP_SIZE * tileSize) / 2;

        for (let y = 0; y < MAP_SIZE; y++) {
          for (let x = 0; x < MAP_SIZE; x++) {
            const tile = mapData.tiles[y]?.[x];
            const px = offsetX + x * tileSize;
            const py = offsetY + y * tileSize;

            if (tile && !tile.passable) {
              orthoCtx.fillStyle = tile.type === 'wall' ? '#44403c' : '#78716c';
            } else {
              orthoCtx.fillStyle = (x + y) % 2 === 0 ? '#292524' : '#1c1917';
            }
            orthoCtx.fillRect(px, py, tileSize, tileSize);
            orthoCtx.strokeStyle = '#0c0a09';
            orthoCtx.strokeRect(px, py, tileSize, tileSize);
          }
        }

        // Draw Player in Ortho 2D
        const playerGridPx = offsetX + playerEntity.x * tileSize;
        const playerGridPy = offsetY + playerEntity.y * tileSize;
        orthoCtx.fillStyle = '#dc2626';
        orthoCtx.beginPath();
        orthoCtx.arc(playerGridPx, playerGridPy, 5, 0, Math.PI * 2);
        orthoCtx.fill();
        orthoCtx.strokeStyle = '#fef08a';
        orthoCtx.lineWidth = 1.5;
        orthoCtx.stroke();

        // Direction line
        orthoCtx.fillStyle = '#fde047';
        orthoCtx.font = '9px monospace';
        orthoCtx.fillText(`[${playerEntity.x.toFixed(1)}, ${playerEntity.y.toFixed(1)}]`, 8, 16);
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [
    heroClass,
    viewMode,
    mapTheme,
    zoom,
    enableTorch,
    enableWallFade,
    isAttacking,
    maxStamina,
    mapData,
    playerEntity,
  ]);

  // Canvas Mouse Click Navigation & Level Editing
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const originX = canvas.width / 2;
    const originY = canvas.height / 2;

    const playerPos = isoToScreen(playerEntity.x, playerEntity.y, 0, 0, 0);

    // Unproject click position back into isometric world space
    const unscaledX = (clickX - originX) / zoom + playerPos.x;
    const unscaledY = (clickY - originY) / zoom + playerPos.y;

    const iso = screenToIso(unscaledX, unscaledY, 0, 0);
    const tileX = Math.round(iso.x);
    const tileY = Math.round(iso.y);

    if (activeBrush === 'inspect') {
      // Set destination for click-to-move
      targetPosRef.current = { x: iso.x, y: iso.y };
      waypointMarkerRef.current = { x: iso.x, y: iso.y, age: 0 };
      soundManager.playWaypointClick();
    } else {
      // Level Editor Paint Action
      if (tileX >= 1 && tileX < MAP_SIZE - 1 && tileY >= 1 && tileY < MAP_SIZE - 1) {
        if (activeBrush === 'wall') {
          mapData.tiles[tileY][tileX] = {
            id: `wall_${tileX}_${tileY}`,
            type: 'wall',
            texture: 'wall_stone',
            elevation: 0,
            passable: false,
          };
          soundManager.playFootstep();
        } else if (activeBrush === 'pillar') {
          mapData.tiles[tileY][tileX] = {
            id: `pillar_${tileX}_${tileY}`,
            type: 'pillar',
            texture: 'pillar_carved',
            elevation: 0,
            passable: false,
          };
          soundManager.playFootstep();
        } else if (activeBrush === 'brazier') {
          mapData.tiles[tileY][tileX] = {
            id: `brazier_${tileX}_${tileY}`,
            type: 'brazier',
            texture: 'brazier_flame',
            elevation: 0,
            passable: false,
            animated: true,
          };
          soundManager.playGold();
        } else if (activeBrush === 'erase') {
          mapData.tiles[tileY][tileX] = {
            id: `floor_${tileX}_${tileY}`,
            type: 'floor',
            texture: 'catacomb_stone',
            elevation: 0,
            passable: true,
          };
          soundManager.playFootstep();
        } else if (activeBrush === 'monster') {
          mapData.entities.push({
            id: `mon_${Date.now()}`,
            name: 'Spawned Imp',
            type: 'monster',
            monsterType: 'fallen',
            x: iso.x,
            y: iso.y,
            elevation: 0,
            direction: 'south',
            animFrame: 0,
          });
          soundManager.playSlash();
        }
      }
    }
  };

  // Canvas Mouse Move Inspector
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const originX = canvas.width / 2;
    const originY = canvas.height / 2;
    const playerPos = isoToScreen(playerEntity.x, playerEntity.y, 0, 0, 0);

    const unscaledX = (clickX - originX) / zoom + playerPos.x;
    const unscaledY = (clickY - originY) / zoom + playerPos.y;

    const iso = screenToIso(unscaledX, unscaledY, 0, 0);
    const tileX = Math.round(iso.x);
    const tileY = Math.round(iso.y);

    const info = {
      screenX: Math.round(clickX),
      screenY: Math.round(clickY),
      isoX: parseFloat(iso.x.toFixed(2)),
      isoY: parseFloat(iso.y.toFixed(2)),
      tileX,
      tileY,
    };
    setHoverInfo(info);
    if (onCoordinatesChange) {
      onCoordinatesChange({ x: info.screenX, y: info.screenY }, { x: info.isoX, y: info.isoY }, { x: tileX, y: tileY });
    }
  };

  return (
    <div className="flex flex-col w-full bg-stone-950 border border-stone-800 rounded-lg overflow-hidden shadow-2xl">
      {/* Engine Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-900 border-b border-stone-800 text-xs">
        {/* Left: Class Selection & Projection Mode */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-cinzel text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-500" /> Class:
          </span>
          <div className="flex rounded bg-stone-950 p-0.5 border border-stone-700">
            {(['barbarian', 'sorceress', 'necromancer', 'paladin', 'amazon'] as CharacterClass[]).map((cls) => (
              <button
                key={cls}
                onClick={() => onClassChange(cls)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-all ${
                  heroClass === cls
                    ? 'bg-amber-600/90 text-amber-100 font-bold shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Theme selection */}
          <div className="flex rounded bg-stone-950 p-0.5 border border-stone-700 ml-2">
            <button
              onClick={() => setMapTheme('catacombs')}
              className={`px-2 py-1 rounded text-[11px] font-medium ${
                mapTheme === 'catacombs' ? 'bg-stone-700 text-amber-200' : 'text-stone-400'
              }`}
            >
              Catacombs
            </button>
            <button
              onClick={() => setMapTheme('blood_moor')}
              className={`px-2 py-1 rounded text-[11px] font-medium ${
                mapTheme === 'blood_moor' ? 'bg-stone-700 text-amber-200' : 'text-stone-400'
              }`}
            >
              Blood Moor
            </button>
            <button
              onClick={() => setMapTheme('hellfire')}
              className={`px-2 py-1 rounded text-[11px] font-medium ${
                mapTheme === 'hellfire' ? 'bg-stone-700 text-amber-200' : 'text-stone-400'
              }`}
            >
              Hellfire
            </button>
          </div>
        </div>

        {/* Right: Viewport Toggles & Sound */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded bg-stone-950 p-0.5 border border-stone-700">
            <button
              onClick={() => setViewMode('isometric')}
              title="Classic Diablo II 2.5D Isometric Dimetric View"
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${
                viewMode === 'isometric' ? 'bg-amber-700 text-white' : 'text-stone-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> 2.5D Iso
            </button>
            <button
              onClick={() => setViewMode('split')}
              title="Dual View: Original VX Ace Grid vs Diablo 2.5D"
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${
                viewMode === 'split' ? 'bg-amber-700 text-white' : 'text-stone-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Split (Sync)
            </button>
            <button
              onClick={() => setViewMode('orthogonal')}
              title="Standard RPG Maker VX Ace 2D Orthogonal View"
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${
                viewMode === 'orthogonal' ? 'bg-amber-700 text-white' : 'text-stone-400'
              }`}
            >
              2D VX Ace
            </button>
          </div>

          {/* Torch Light toggle */}
          <button
            onClick={() => setEnableTorch(!enableTorch)}
            title="Toggle Diablo II Torch Light Radius"
            className={`p-1.5 rounded border ${
              enableTorch
                ? 'bg-amber-950/60 border-amber-600 text-amber-400'
                : 'bg-stone-950 border-stone-800 text-stone-500'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleAudio}
            title={isAudioMuted ? 'Unmute Sound' : 'Mute Sound'}
            className={`p-1.5 rounded border ${
              !isAudioMuted
                ? 'bg-stone-800 border-amber-700 text-amber-300'
                : 'bg-stone-950 border-stone-800 text-stone-500'
            }`}
          >
            {!isAudioMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Zoom In/Out */}
          <div className="flex items-center gap-1 text-[11px] font-mono bg-stone-950 px-2 py-1 rounded border border-stone-700">
            <button onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))} className="hover:text-amber-300">-</button>
            <span>{(zoom * 100).toFixed(0)}%</span>
            <button onClick={() => setZoom((z) => Math.min(2.0, z + 0.25))} className="hover:text-amber-300">+</button>
          </div>
        </div>
      </div>

      {/* Level Paint / Tool Selector Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-950/90 border-b border-stone-800/80 text-[11px] font-mono">
        <div className="flex items-center gap-1 text-stone-400">
          <span className="text-amber-500 font-semibold mr-1">ACTION BRUSH:</span>
          <button
            onClick={() => setActiveBrush('inspect')}
            className={`px-2 py-0.5 rounded border ${
              activeBrush === 'inspect'
                ? 'bg-amber-900/60 border-amber-500 text-amber-200'
                : 'border-stone-800 text-stone-400'
            }`}
          >
            🎯 Click-Move / Attack
          </button>
          <button
            onClick={() => setActiveBrush('wall')}
            className={`px-2 py-0.5 rounded border ${
              activeBrush === 'wall'
                ? 'bg-amber-900/60 border-amber-500 text-amber-200'
                : 'border-stone-800 text-stone-400'
            }`}
          >
            🧱 Place Wall
          </button>
          <button
            onClick={() => setActiveBrush('pillar')}
            className={`px-2 py-0.5 rounded border ${
              activeBrush === 'pillar'
                ? 'bg-amber-900/60 border-amber-500 text-amber-200'
                : 'border-stone-800 text-stone-400'
            }`}
          >
            🏛️ Place Pillar
          </button>
          <button
            onClick={() => setActiveBrush('brazier')}
            className={`px-2 py-0.5 rounded border ${
              activeBrush === 'brazier'
                ? 'bg-amber-900/60 border-amber-500 text-amber-200'
                : 'border-stone-800 text-stone-400'
            }`}
          >
            🔥 Place Brazier
          </button>
          <button
            onClick={() => setActiveBrush('monster')}
            className={`px-2 py-0.5 rounded border ${
              activeBrush === 'monster'
                ? 'bg-amber-900/60 border-amber-500 text-amber-200'
                : 'border-stone-800 text-stone-400'
            }`}
          >
            👹 Spawn Imp
          </button>
          <button
            onClick={() => setActiveBrush('erase')}
            className={`px-2 py-0.5 rounded border ${
              activeBrush === 'erase'
                ? 'bg-red-950/60 border-red-500 text-red-200'
                : 'border-stone-800 text-stone-400'
            }`}
          >
            🧹 Clear Tile
          </button>
        </div>

        {/* Live Coordinate Status Badge */}
        <div className="flex items-center gap-3 text-stone-400">
          <span>
            Iso: <strong className="text-amber-300">({hoverInfo.isoX}, {hoverInfo.isoY})</strong>
          </span>
          <span>
            VX Ace Tile: <strong className="text-emerald-400">[{hoverInfo.tileX}, {hoverInfo.tileY}]</strong>
          </span>
        </div>
      </div>

      {/* Canvas Viewport Area */}
      <div className="relative w-full h-[460px] bg-black flex items-center justify-center overflow-hidden">
        {/* Diablo Isometric Canvas */}
        <canvas
          ref={canvasRef}
          width={760}
          height={460}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          className="cursor-crosshair pixelated max-w-full max-h-full block select-none"
        />

        {/* Split Mode: Overlay Orthogonal VX Ace 2D Map */}
        {viewMode === 'split' && (
          <div className="absolute top-3 right-3 w-52 bg-stone-950/95 border-2 border-stone-700 rounded shadow-2xl p-2 z-30 pointer-events-none backdrop-blur-sm">
            <div className="text-[10px] font-cinzel text-amber-400 font-bold uppercase mb-1 flex items-center justify-between">
              <span>RPG Maker VX Ace Grid</span>
              <span className="text-[9px] text-stone-400 font-mono">32x32</span>
            </div>
            <canvas
              ref={orthoCanvasRef}
              width={190}
              height={190}
              className="border border-stone-800 rounded bg-stone-900 mx-auto block"
            />
            <div className="text-[9px] text-stone-400 mt-1 font-mono text-center">
              Red dot = $game_player [x, y]
            </div>
          </div>
        )}

        {/* In-game helper overlay banner */}
        <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-sm border border-stone-800/80 rounded px-2.5 py-1 text-[11px] font-mono text-stone-300 shadow pointer-events-none flex items-center gap-2">
          <span className="text-amber-400 font-bold">CONTROLS:</span>
          <span>Click to Move</span>
          <span>•</span>
          <span>WASD / Arrows (8-Dir)</span>
          <span>•</span>
          <span>Space (Attack)</span>
          <span>•</span>
          <span>1-4 (Potions)</span>
        </div>
      </div>

      {/* Classic Diablo II Gothic HUD Bar */}
      <DiabloHUD
        currentHp={playerHp}
        maxHp={maxHp}
        currentMp={playerMp}
        maxMp={maxMp}
        stamina={stamina}
        maxStamina={maxStamina}
        gold={gold}
        beltPotions={beltPotions}
        onUsePotion={handleUsePotion}
        onAttack={handleAttack}
        activeSkill={
          heroClass === 'barbarian'
            ? 'Whirlwind'
            : heroClass === 'sorceress'
            ? 'Fireball'
            : heroClass === 'necromancer'
            ? 'Bone Spear'
            : heroClass === 'paladin'
            ? 'Zeal'
            : 'Javelin Toss'
        }
      />
    </div>
  );
};
