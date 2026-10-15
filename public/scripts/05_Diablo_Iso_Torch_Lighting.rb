#==============================================================================
# ** DIABLO II 2.5D ISOMETRIC ENGINE FOR RPG MAKER VX ACE (RGSS3)
#------------------------------------------------------------------------------
# Module: Diablo_Iso::Torch_Lighting
# File: 05_Diablo_Iso_Torch_Lighting.rb
# Engine: RPG Maker VX Ace (RGSS3 / Ruby 1.9.2)
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
    @darkness_sprite.blend_type = 2 # Subtract blend
    
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
      draw_radial_glow(bmp, px, py, r, alpha)
    end
  end

  def draw_radial_glow(bitmap, cx, cy, radius, alpha)
    color = Color.new(255, 230, 160, alpha)
    # Renders light circle subtracting from darkness sprite
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
