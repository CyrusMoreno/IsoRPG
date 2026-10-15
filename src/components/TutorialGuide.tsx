import React from 'react';
import { BookOpen, AlertCircle, CheckCircle, Flame, Layers, Compass, Code, HelpCircle } from 'lucide-react';

export const TutorialGuide: React.FC = () => {
  return (
    <div className="flex flex-col w-full bg-stone-950 border border-stone-800 rounded-lg overflow-hidden shadow-2xl text-stone-300">
      <div className="p-4 bg-stone-900 border-b border-stone-800">
        <h2 className="font-cinzel text-lg font-bold text-amber-300 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          RPG Maker VX Ace Integration & Setup Guide
        </h2>
        <p className="text-xs text-stone-400 mt-0.5">
          Step-by-step instructions for installing the Diablo II 2.5D Isometric Engine in RPG Maker VX Ace.
        </p>
      </div>

      <div className="p-6 space-y-8 bg-[#0c0a09]">
        {/* Step 1: Script Editor */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-stone-950 font-bold font-mono text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="font-cinzel text-base font-bold text-amber-200">
              Install the RGSS3 Script Suite in the Script Editor (F11)
            </h3>
          </div>
          <div className="ml-8 space-y-2 text-xs leading-relaxed text-stone-300 font-mono">
            <p>
              1. Open your project in <strong>RPG Maker VX Ace</strong>.
            </p>
            <p>
              2. Press <kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-amber-300 border border-stone-700">F11</kbd> to open the Script Editor.
            </p>
            <p>
              3. Scroll down the left pane until you locate the section labeled <strong>▼ Materials</strong>.
            </p>
            <p>
              4. Right-click in the empty space below <strong>▼ Materials</strong> and above <strong>▼ Main</strong>, then choose <strong>Insert</strong>.
            </p>
            <p>
              5. Insert the 6 Diablo scripts in this exact sequential order:
            </p>
            <div className="p-3 bg-stone-900 rounded border border-stone-800 text-amber-300 space-y-1">
              <div>① <code>Diablo_Iso_Core</code> (Math, constants, coordinate projection)</div>
              <div>② <code>Diablo_Iso_Renderer</code> (Replaces Spriteset_Map with 2.5D diamond tilemap)</div>
              <div>③ <code>Diablo_Iso_Movement_8Dir</code> (8-direction input and diagonal collision)</div>
              <div>④ <code>Diablo_Iso_Mouse_ClickToMove</code> (Point & click pathfinding via Win32API)</div>
              <div>⑤ <code>Diablo_Iso_Torch_Lighting</code> (Player torchlight radius and dark vignette)</div>
              <div>⑥ <code>Diablo_Iso_HUD</code> (Health and Mana glass orbs, belt slots, stamina)</div>
            </div>
            <p className="text-stone-400">
              <em>Tip: You can also download the <strong>All-In-One Master Script</strong> from the Scripts tab and paste it into a single slot.</em>
            </p>
          </div>
        </div>

        {/* Step 2: Assets placement */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-stone-950 font-bold font-mono text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="font-cinzel text-base font-bold text-amber-200">
              Placing Graphic Assets in Project Folders
            </h3>
          </div>
          <div className="ml-8 space-y-2 text-xs leading-relaxed font-mono">
            <p className="text-stone-300">
              Export the generated assets from the <strong>Asset Studio</strong> tab and place them into your RPG Maker VX Ace project directory:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-stone-900/80 border border-stone-800 rounded">
                <div className="text-amber-400 font-bold">Graphics/Tilesets/</div>
                <div className="text-stone-400 text-[11px] mt-1">
                  Place <code>Diablo_Isometric_Tileset_B.png</code> here. Contains 64x32 diamond floor tiles and walls.
                </div>
              </div>
              <div className="p-3 bg-stone-900/80 border border-stone-800 rounded">
                <div className="text-amber-400 font-bold">Graphics/Characters/</div>
                <div className="text-stone-400 text-[11px] mt-1">
                  Place <code>$Diablo_BARBARIAN_8DIR.png</code> and props like <code>!$Diablo_Brazier_Anim.png</code> here.
                </div>
              </div>
              <div className="p-3 bg-stone-900/80 border border-stone-800 rounded">
                <div className="text-amber-400 font-bold">Graphics/System/</div>
                <div className="text-stone-400 text-[11px] mt-1">
                  Place HUD orb masks and belt assets here for the Diablo interface script.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Database & Passability Setup */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-stone-950 font-bold font-mono text-xs flex items-center justify-center">
              3
            </span>
            <h3 className="font-cinzel text-base font-bold text-amber-200">
              Configuring Database Passability & Elevation Tags
            </h3>
          </div>
          <div className="ml-8 space-y-2 text-xs leading-relaxed font-mono text-stone-300">
            <p>
              1. Press <kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-amber-300 border border-stone-700">F10</kbd> to open the Database, and click the <strong>Tilesets</strong> tab.
            </p>
            <p>
              2. Assign your isometric tileset to <strong>B</strong> or <strong>E</strong> slot.
            </p>
            <p>
              3. Set <strong>Passability (O / X)</strong>: Floor diamonds must be marked with <span className="text-emerald-400 font-bold">O</span>, and walls/pillars must be marked with <span className="text-red-400 font-bold">X</span>.
            </p>
            <p>
              4. <strong>Elevation Tags:</strong> In event notes or map note tags, you can add <code>&lt;elevation: 1&gt;</code> or <code>&lt;elevation: 2&gt;</code> to elevate characters, stairs, or bridges by 16px steps.
            </p>
          </div>
        </div>

        {/* Step 4: Pro Tips & Diablo II Styling */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-stone-950 font-bold font-mono text-xs flex items-center justify-center">
              4
            </span>
            <h3 className="font-cinzel text-base font-bold text-amber-200">
              Diablo II Aesthetics & Fine-Tuning
            </h3>
          </div>
          <div className="ml-8 space-y-3 text-xs font-mono">
            <div className="p-3 bg-stone-900 rounded border border-stone-800 flex items-start gap-3">
              <Flame className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-bold">Wall Occlusion & Transparency:</strong>
                <p className="text-stone-400 mt-1">
                  In Diablo II, when the hero walks behind a cathedral pillar or gothic stone wall, the wall becomes translucent (opacity ~110). This prevents line-of-sight obstruction and gives the true 2.5D depth feel.
                </p>
              </div>
            </div>

            <div className="p-3 bg-stone-900 rounded border border-stone-800 flex items-start gap-3">
              <Compass className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-bold">Point-and-Click Movement vs Diagonal Keys:</strong>
                <p className="text-stone-400 mt-1">
                  Players can navigate using both mouse click-to-move (just like classic Diablo II) or keyboard arrow keys/WASD which automatically remap to 8 isometric directions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-3 border-t border-stone-800 pt-6">
          <h3 className="font-cinzel text-sm font-bold text-amber-300 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            Frequently Asked Questions
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 bg-stone-900/50 rounded border border-stone-800">
              <div className="text-amber-300 font-bold">Q: Will standard RPG Maker VX Ace events work in isometric view?</div>
              <div className="text-stone-400 mt-1">
                Yes! The <code>Diablo_Iso_Movement_8Dir</code> script overrides <code>Game_CharacterBase#screen_x</code> and <code>screen_y</code>, so standard events (NPCs, chests, transfer triggers) are automatically projected into their correct isometric diamond locations.
              </div>
            </div>

            <div className="p-3 bg-stone-900/50 rounded border border-stone-800">
              <div className="text-amber-300 font-bold">Q: Is this compatible with Yanfly or Victor Engine scripts?</div>
              <div className="text-stone-400 mt-1">
                Yes! Place the <code>Diablo_Iso</code> scripts below core message/system scripts and above any battle addons. Since the isometric math operates cleanly on <code>Spriteset_Map</code> and <code>Game_CharacterBase</code>, standard menu systems and battle systems function normally.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
