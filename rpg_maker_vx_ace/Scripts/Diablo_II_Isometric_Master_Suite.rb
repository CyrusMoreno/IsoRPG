#==============================================================================
# ** DIABLO II 2.5D ISOMETRIC MASTER ENGINE SUITE FOR RPG MAKER VX ACE
#------------------------------------------------------------------------------
# All 6 core modules bundled into a single master script.
# Insert this script below "▼ Materials" and above "▼ Main" in the Script Editor (F11).
# Compatible with RGSS3 / RPG Maker VX Ace (Ruby 1.9.2).
#==============================================================================

# 1. CORE MATH
module Diablo_Iso
  TILE_WIDTH           = 64
  TILE_HEIGHT          = 32
  HALF_WIDTH           = TILE_WIDTH / 2
  HALF_HEIGHT          = TILE_HEIGHT / 2
  ELEVATION_STEP       = 16
  WALL_OCCLUSION_ALPHA = 110
  CAMERA_SMOOTH_RATE   = 0.20
  TORCH_RADIUS         = 160
  TORCH_FLICKER        = true

  def self.iso_to_screen(map_x, map_y, elevation = 0)
    screen_x = (map_x - map_y) * HALF_WIDTH
    screen_y = (map_x + map_y) * HALF_HEIGHT - (elevation * ELEVATION_STEP)
    return [screen_x, screen_y]
  end

  def self.screen_to_iso(screen_x, screen_y, elevation = 0)
    adjusted_y = screen_y + (elevation * ELEVATION_STEP)
    iso_x = ((screen_x.to_f / HALF_WIDTH) + (adjusted_y.to_f / HALF_HEIGHT)) / 2.0
    iso_y = ((adjusted_y.to_f / HALF_HEIGHT) - (screen_x.to_f / HALF_WIDTH)) / 2.0
    return [iso_x, iso_y]
  end

  def self.screen_to_tile(screen_x, screen_y)
    iso_x, iso_y = screen_to_iso(screen_x, screen_y)
    return [iso_x.round, iso_y.round]
  end

  def self.calculate_z(screen_y, elevation = 0, priority = 0)
    return (screen_y * 10) + (elevation * 1000) + priority
  end

  def self.distance(x1, y1, x2, y2)
    Math.sqrt((x1 - x2)**2 + (y1 - y2)**2)
  end
end

class Game_Map
  attr_accessor :iso_origin_x, :iso_origin_y

  alias diablo_iso_setup_events setup_events
  def setup_events
    diablo_iso_setup_events
    @iso_origin_x = Graphics.width / 2
    @iso_origin_y = 64
  end

  def iso_display_x
    @display_x * Diablo_Iso::HALF_WIDTH
  end

  def iso_display_y
    @display_y * Diablo_Iso::HALF_HEIGHT
  end
end

# 2. ISOMETRIC TILEMAP RENDERER & OCCLUSION
class Spriteset_Map
  alias diablo_iso_create_tilemap create_tilemap
  def create_tilemap
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

    map_w = $game_map.width
    map_h = $game_map.height

    for x in 0...map_w
      for y in 0...map_h
        tile_id = $game_map.data[x, y, 0]
        wall_id = $game_map.data[x, y, 1]
        
        if tile_id && tile_id > 0
          sp = Sprite.new(@iso_viewport)
          sp.bitmap = Cache.tileset($game_map.tileset.tileset_names[0])
          sp.ox = Diablo_Iso::HALF_WIDTH
          sp.oy = Diablo_Iso::HALF_HEIGHT
          @iso_tile_sprites[[x, y, 0]] = sp
        end

        if wall_id && wall_id > 0
          wall_sp = Sprite.new(@iso_viewport)
          wall_sp.bitmap = Cache.tileset($game_map.tileset.tileset_names[1])
          wall_sp.ox = Diablo_Iso::HALF_WIDTH
          wall_sp.oy = Diablo_Iso::TILE_HEIGHT + 32
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

    @iso_tile_sprites.each do |(tx, ty, layer), sprite|
      sx, sy = Diablo_Iso.iso_to_screen(tx, ty)
      final_x = sx + cam_x
      final_y = sy + cam_y

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

    px = $game_player.real_x
    py = $game_player.real_y

    @iso_wall_sprites.each do |(wx, wy, wall_sp)|
      sx, sy = Diablo_Iso.iso_to_screen(wx, wy)
      final_x = sx + cam_x
      final_y = sy + cam_y

      wall_sp.x = final_x
      wall_sp.y = final_y
      wall_sp.z = Diablo_Iso.calculate_z(final_y, 1, 50)

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

# 3. 8-DIRECTIONAL MOVEMENT
class Game_CharacterBase
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

  alias diablo_iso_passable? passable?
  def passable?(x, y, d)
    case d
    when 1 then return diablo_iso_passable?(x, y, 2) && diablo_iso_passable?(x, y + 1, 4)
    when 3 then return diablo_iso_passable?(x, y, 2) && diablo_iso_passable?(x, y + 1, 6)
    when 7 then return diablo_iso_passable?(x, y, 8) && diablo_iso_passable?(x, y - 1, 4)
    when 9 then return diablo_iso_passable?(x, y, 8) && diablo_iso_passable?(x, y - 1, 6)
    else return diablo_iso_passable?(x, y, d)
    end
  end
end

class Game_Player < Game_Character
  def move_by_input
    return unless movable?
    return if $game_map.interpreter.running?

    dir = Input.dir8
    if dir > 0
      case dir
      when 8 then move_diagonal(4, 8)
      when 2 then move_diagonal(6, 2)
      when 4 then move_diagonal(4, 2)
      when 6 then move_diagonal(6, 8)
      when 7 then move_straight(4)
      when 9 then move_straight(8)
      when 1 then move_straight(2)
      when 3 then move_straight(6)
      end
    end
  end
end

# 4. MOUSE CLICK-TO-MOVE
module Diablo_Mouse
  GET_CURSOR_POS   = Win32API.new('user32', 'GetCursorPos', 'P', 'I') rescue nil
  SCREEN_TO_CLIENT = Win32API.new('user32', 'ScreenToClient', ['L', 'P'], 'I') rescue nil
  FIND_WINDOW      = Win32API.new('user32', 'FindWindowA', ['P', 'P'], 'L') rescue nil
  KEY_STATE        = Win32API.new('user32', 'GetAsyncKeyState', 'I', 'I') rescue nil

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
    (KEY_STATE.call(0x01) & 0x01) != 0
  end

  def self.shift_held?
    return false unless KEY_STATE
    (KEY_STATE.call(0x10) & 0x8000) != 0
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
      return if my >= Graphics.height - 50

      cam_x = (Graphics.width / 2) - ($game_map.display_x * Diablo_Iso::HALF_WIDTH)
      cam_y = (Graphics.height / 2) - ($game_map.display_y * Diablo_Iso::HALF_HEIGHT)

      rel_x = mx - cam_x
      rel_y = my - cam_y

      target_x, target_y = Diablo_Iso.screen_to_tile(rel_x, rel_y)

      if Diablo_Mouse.shift_held?
        turn_toward_tile(target_x, target_y)
        @animation_id = 1
      else
        @destination_x = target_x
        @destination_y = target_y
        Sound.play_cursor
      end
    end

    process_mouse_pathfinding if @destination_x
  end

  def turn_toward_tile(tx, ty)
    dx = tx - @x
    dy = ty - @y
  end

  def process_mouse_pathfinding
    return unless @destination_x
    if @x == @destination_x && @y == @destination_y
      @destination_x = nil
      @destination_y = nil
      return
    end

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

# 5. TORCH LIGHTING
class Spriteset_Map
  alias diablo_iso_create_lighting create_viewports
  def create_viewports
    diablo_iso_create_lighting
    create_torchlight_overlay
  end

  def create_torchlight_overlay
    @light_viewport = Viewport.new(0, 0, Graphics.width, Graphics.height)
    @light_viewport.z = 900

    @darkness_sprite = Sprite.new(@light_viewport)
    @darkness_sprite.bitmap = Bitmap.new(Graphics.width, Graphics.height)
    @darkness_sprite.blend_type = 2
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

# 6. GOTHIC HUD
class Scene_Map < Scene_Base
  alias diablo_iso_hud_start start
  def start
    diablo_iso_hud_start
    create_diablo_hud
  end

  def create_diablo_hud
    @hud_viewport = Viewport.new(0, 0, Graphics.width, Graphics.height)
    @hud_viewport.z = 1000

    @bar_sprite = Sprite.new(@hud_viewport)
    @bar_sprite.bitmap = Bitmap.new(Graphics.width, 48)
    @bar_sprite.y = Graphics.height - 48
    draw_stone_belt_bar(@bar_sprite.bitmap)

    @hp_orb = Sprite.new(@hud_viewport)
    @hp_orb.bitmap = Bitmap.new(72, 72)
    @hp_orb.x = 8
    @hp_orb.y = Graphics.height - 76

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

    draw_liquid_orb(@hp_orb.bitmap, actor.hp, actor.mhp, :life)
    draw_liquid_orb(@mp_orb.bitmap, actor.mp, actor.mmp, :mana)
  end

  def draw_liquid_orb(bitmap, current, max, type)
    bitmap.clear
    pct = [current.to_f / [max, 1].max, 1.0].min
    fill_h = (60 * pct).round

    fluid_color = (type == :life) ? Color.new(200, 20, 20, 240) : Color.new(20, 100, 230, 240)
    bitmap.fill_rect(10, 66 - fill_h, 52, fill_h, fluid_color)

    bitmap.font.size = 14
    bitmap.font.color = Color.new(255, 230, 180)
    bitmap.draw_text(0, 26, 72, 20, "#{current}/#{max}", 1)
  end

  def draw_stone_belt_bar(bitmap)
    bitmap.fill_rect(0, 0, bitmap.width, bitmap.height, Color.new(25, 22, 20))
    cx = bitmap.width / 2
    for slot in 0...4
      bx = cx - 70 + (slot * 36)
      bitmap.fill_rect(bx, 8, 30, 32, Color.new(12, 10, 10))
      bitmap.font.size = 12
      bitmap.font.color = Color.new(180, 160, 120)
      bitmap.draw_text(bx, 10, 30, 20, "#{slot + 1}", 1)
    end
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
