==============================================================================
DIABLO II 2.5D ISOMETRIC ENGINE FOR RPG MAKER VX ACE (RGSS3)
==============================================================================

YES, ISOMETRIC VIEW IS 100% POSSIBLE ON RPG MAKER VX ACE!
Here is the exact explanation and quick setup guide:

HOW IT WORKS IN RPG MAKER VX ACE (RGSS3):
------------------------------------------------------------------------------
RPG Maker VX Ace runs on RGSS3 (Ruby 1.9.2).
The standard VX Ace engine uses an orthogonal 32x32 square grid in its built-in
C++ Tilemap class. However, RGSS3 gives full access to Viewports, Sprites, Bitmaps,
Game_Map, and Game_CharacterBase in pure Ruby.

To make RPG Maker VX Ace render in isometric 2.5D:
1. Coordinate Projection:
   Standard map coordinates (x, y) are converted into dimetric 2:1 screen coordinates:
     screen_x = (x - y) * 32
     screen_y = (x + y) * 16 - (elevation * 16)
2. Tilemap Override:
   In `Spriteset_Map`, we replace the orthogonal tilemap with 64x32 diamond sprites.
3. 8-Directional Movement:
   `Game_CharacterBase` and `Game_Player` input is remapped to diagonal isometric vectors.
4. Depth Sorting:
   Z-index is calculated dynamically using `screen_y * 10 + elevation * 1000 + priority`.

FILES INCLUDED IN THIS SUITE:
------------------------------------------------------------------------------
You can use the individual modules or the single All-In-One Master Script:

Option A: All-In-One Master Script (Recommended for beginners):
  - Diablo_II_Isometric_Master_Suite.rb

Option B: Individual Modular Scripts (Recommended for customization):
  - 01_Diablo_Iso_Core.rb               (Matrix math & projection formulas)
  - 02_Diablo_Iso_Renderer.rb           (Custom 2.5D tilemap & wall occlusion)
  - 03_Diablo_Iso_Movement_8Dir.rb      (8-direction input & collision)
  - 04_Diablo_Iso_Mouse_ClickToMove.rb  (Diablo mouse pathfinding via Win32API)
  - 05_Diablo_Iso_Torch_Lighting.rb     (Player torchlight & dark vignette)
  - 06_Diablo_Iso_HUD.rb                (Health/Mana glass orbs & potion belt)

HOW TO INSTALL IN RPG MAKER VX ACE:
------------------------------------------------------------------------------
1. Open your project in RPG Maker VX Ace.
2. Press F11 to open the Script Editor.
3. Scroll down the script list on the left to "▼ Materials".
4. Right-click an empty slot between "▼ Materials" and "▼ Main", and click "Insert".
5. Name the slot "Diablo_Isometric_Engine".
6. Copy the entire content of `Diablo_II_Isometric_Master_Suite.rb` (or each of the
   6 numbered scripts in order) and paste it into the editor.
7. Save the project and press F12 (Playtest)!

GRAPHICS FOLDERS:
------------------------------------------------------------------------------
- Graphics/Tilesets/   : Place 64x32 diamond tilesets (export from Asset Studio).
- Graphics/Characters/ : Place 8-directional character sheets ($Hero_8DIR.png).
- Graphics/System/     : Place Diablo HUD glass orbs (health_orb.png, mana_orb.png).
==============================================================================
