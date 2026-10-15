#==============================================================================
# ** DIABLO II 2.5D ISOMETRIC ENGINE FOR RPG MAKER VX ACE (RGSS3)
#------------------------------------------------------------------------------
# Module: Diablo_Iso::Core
# File: 01_Diablo_Iso_Core.rb
#==============================================================================

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
  attr_accessor :iso_origin_x
  attr_accessor :iso_origin_y

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
