import React from 'react';
import { soundManager } from '../engine/audioSynthesizer';

interface DiabloHUDProps {
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  stamina: number;
  maxStamina: number;
  gold: number;
  beltPotions: ('health' | 'mana' | null)[];
  onUsePotion: (slotIndex: number) => void;
  onAttack: () => void;
  activeSkill: string;
}

export const DiabloHUD: React.FC<DiabloHUDProps> = ({
  currentHp,
  maxHp,
  currentMp,
  maxMp,
  stamina,
  maxStamina,
  gold,
  beltPotions,
  onUsePotion,
  onAttack,
  activeSkill,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
  const mpPercent = Math.max(0, Math.min(100, (currentMp / maxMp) * 100));
  const staminaPercent = Math.max(0, Math.min(100, (stamina / maxStamina) * 100));

  return (
    <div className="relative w-full select-none">
      {/* Stone Border Arch Header */}
      <div className="flex items-center justify-between px-3 py-1 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-t border-b border-amber-900/60 shadow-inner text-xs font-cinzel text-amber-200/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
          <span className="tracking-wider uppercase font-semibold">Diablo II 2.5D RGSS3 HUD</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-amber-400">💰 {gold.toLocaleString()} GOLD</span>
          <span className="text-stone-400">SKILL: <strong className="text-amber-300">{activeSkill}</strong></span>
        </div>
      </div>

      {/* Main HUD Bar */}
      <div className="relative flex items-end justify-between h-20 px-2 sm:px-6 bg-[#0f0d0c] border-t-2 border-stone-800 shadow-2xl">
        {/* Background filigree texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#2a221b_1px,transparent_1px)] [background-size:8px_8px] opacity-40 pointer-events-none"></div>

        {/* ================= LEFT: HEALTH GLOBE ================= */}
        <div className="relative z-10 flex flex-col items-center -top-3">
          {/* Demon Gargoyle Ornate Frame */}
          <div className="relative w-20 h-20 rounded-full border-4 border-stone-800 shadow-[0_0_15px_rgba(0,0,0,0.9)] bg-black overflow-hidden flex items-center justify-center ring-2 ring-amber-900/40">
            {/* Liquid Fill with wave animation */}
            <div
              className="absolute bottom-0 w-full bg-gradient-to-t from-red-950 via-red-700 to-red-500 transition-all duration-300 ease-out"
              style={{ height: `${hpPercent}%` }}
            >
              {/* Liquid surface wave ripple */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-red-300/40 blur-[1px]"></div>
            </div>

            {/* Glass bubble reflection highlights */}
            <div className="absolute top-1 left-2 w-8 h-4 rounded-full bg-white/20 blur-[1px] transform -rotate-12 pointer-events-none"></div>
            <div className="absolute bottom-1 right-2 w-4 h-2 rounded-full bg-red-200/20 blur-[1px] pointer-events-none"></div>

            {/* HP Text */}
            <div className="relative z-20 text-center font-cinzel text-xs font-bold text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              <div>{currentHp}</div>
              <div className="text-[9px] text-red-200/90 font-mono tracking-tighter">LIFE</div>
            </div>
          </div>
        </div>

        {/* ================= CENTER: BELT SLOTS & CONTROLS ================= */}
        <div className="relative z-10 flex flex-col items-center gap-1 pb-2">
          {/* Stamina Meter */}
          <div className="w-64 h-2 bg-stone-950 border border-stone-700 rounded-sm overflow-hidden p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-all duration-150"
              style={{ width: `${staminaPercent}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-stone-400 font-mono -mt-0.5 tracking-tight">
            STAMINA {Math.round(stamina)}/{maxStamina}
          </div>

          {/* Belt Slots [1] [2] [3] [4] + Skill Buttons */}
          <div className="flex items-center gap-2">
            {/* Left Click Skill (Attack) */}
            <button
              onClick={() => {
                soundManager.playSlash();
                onAttack();
              }}
              title="Left Click: Attack (Space)"
              className="group relative w-11 h-11 bg-stone-900 border-2 border-stone-700 hover:border-amber-600 rounded flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95"
            >
              <span className="text-base">⚔️</span>
              <span className="absolute bottom-0.5 text-[8px] font-mono text-amber-400/90 group-hover:text-amber-200">
                [L-CLK]
              </span>
            </button>

            {/* Potion Slots 1-4 */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-stone-950/90 border border-stone-800 rounded">
              {beltPotions.map((potion, idx) => (
                <button
                  key={idx}
                  onClick={() => onUsePotion(idx)}
                  disabled={!potion}
                  title={`Belt Slot ${idx + 1}: ${potion ? (potion === 'health' ? 'Health Potion' : 'Mana Potion') : 'Empty'} (Press ${idx + 1})`}
                  className={`relative w-9 h-11 border rounded flex flex-col items-center justify-between p-1 transition-all ${
                    potion === 'health'
                      ? 'bg-red-950/40 border-red-800 hover:border-red-500 shadow-[0_0_8px_rgba(220,38,38,0.25)]'
                      : potion === 'mana'
                      ? 'bg-blue-950/40 border-blue-800 hover:border-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.25)]'
                      : 'bg-stone-900 border-stone-800 opacity-60'
                  }`}
                >
                  <span className="text-xs">
                    {potion === 'health' ? '🧪' : potion === 'mana' ? '🔷' : '·'}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-amber-400">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>

            {/* Right Click Skill (Town Portal / Spell) */}
            <button
              onClick={() => {
                soundManager.playPotion();
              }}
              title="Right Click: Secondary Skill"
              className="group relative w-11 h-11 bg-stone-900 border-2 border-stone-700 hover:border-blue-600 rounded flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95"
            >
              <span className="text-base">🔮</span>
              <span className="absolute bottom-0.5 text-[8px] font-mono text-blue-400/90 group-hover:text-blue-200">
                [R-CLK]
              </span>
            </button>
          </div>
        </div>

        {/* ================= RIGHT: MANA GLOBE ================= */}
        <div className="relative z-10 flex flex-col items-center -top-3">
          {/* Angel Ornate Frame */}
          <div className="relative w-20 h-20 rounded-full border-4 border-stone-800 shadow-[0_0_15px_rgba(0,0,0,0.9)] bg-black overflow-hidden flex items-center justify-center ring-2 ring-blue-900/40">
            {/* Liquid Fill with wave animation */}
            <div
              className="absolute bottom-0 w-full bg-gradient-to-t from-blue-950 via-blue-700 to-blue-500 transition-all duration-300 ease-out"
              style={{ height: `${mpPercent}%` }}
            >
              {/* Liquid surface wave ripple */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-blue-300/40 blur-[1px]"></div>
            </div>

            {/* Glass bubble reflection highlights */}
            <div className="absolute top-1 right-2 w-8 h-4 rounded-full bg-white/20 blur-[1px] transform rotate-12 pointer-events-none"></div>
            <div className="absolute bottom-1 left-2 w-4 h-2 rounded-full bg-blue-200/20 blur-[1px] pointer-events-none"></div>

            {/* MP Text */}
            <div className="relative z-20 text-center font-cinzel text-xs font-bold text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              <div>{currentMp}</div>
              <div className="text-[9px] text-blue-200/90 font-mono tracking-tighter">MANA</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
