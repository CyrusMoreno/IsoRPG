#==============================================================================
# ** DIABLO II 2.5D ISOMETRIC ENGINE FOR RPG MAKER VX ACE (RGSS3)
#------------------------------------------------------------------------------
# Module: Diablo_Iso::Core
# File: 01_Diablo_Iso_Core.rb
# Engine: RPG Maker VX Ace (RGSS3 / Ruby 1.9.2)
# Author: Diablo II RGSS3 Conversion Suite
# Version: 2.1.0
# Description:
#   Transforms the standard 32x32 orthogonal grid of RPG Maker VX Ace into a
#   classic Diablo II 2.5D dimetric (2:1 aspect ratio) isometric projection.
#==============================================================================

module Diablo_Iso
  #============================================================================
  # CONFIGURATION
  #============================================================================
  # Standard isometric diamond dimensions (2:1 ratio)
  TILE_WIDTH           = 64    # Diamond width in pixels
  TILE_HEIGHT          = 32    # Diamond height in pixels (half of width)
  HALF_WIDTH           = TILE_WIDTH / 2
  HALF_HEIGHT          = TILE_HEIGHT / 2

  # Elevation height step (pixels shifted upward per elevation level)
  ELEVATION_STEP       = 16

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
  # Formula:
  #   screen_x = (x - y) * (TILE_WIDTH / 2)
  #   screen_y = (x + y) * (TILE_HEIGHT / 2) - (elevation * ELEVATION_STEP)
  def self.iso_to_screen(map_x, map_y, elevation = 0)
    screen_x = (map_x - map_y) * HALF_WIDTH
    screen_y = (map_x + map_y) * HALF_HEIGHT - (elevation * ELEVATION_STEP)
    return [screen_x, screen_y]
  end

  # Converts Screen Coordinates (pixels) back into Isometric Map Coordinates (floats)
  # Inverts the dimetric projection matrix:
  #   iso_x = ( (screen_x / HALF_WIDTH) + (screen_y / HALF_HEIGHT) ) / 2
  #   iso_y = ( (screen_y / HALF_HEIGHT) - (screen_x / HALF_WIDTH) ) / 2
  def self.screen_to_iso(screen_x, screen_y, elevation = 0)
    adjusted_y = screen_y + (elevation * ELEVATION_STEP)
    iso_x = ((screen_x.to_f / HALF_WIDTH) + (adjusted_y.to_f / HALF_HEIGHT)) / 2.0
    iso_y = ((adjusted_y.to_f / HALF_HEIGHT) - (screen_x.to_f / HALF_WIDTH)) / 2.0
    return [iso_x, iso_y]
  end

  # Snaps screen coordinate directly to integer tile index [map_x, map_y]
  def self.screen_to_tile(screen_x, screen_y)
    iso_x, iso_y = screen_to_iso(screen_x, screen_y)
    return [iso_x.round, iso_y.round]
  end

  # Calculates Z-depth for proper depth-sorting in isometric space
  # In 2.5D, tiles and characters further down the screen (greater screen_y)
  # or with higher elevation must be drawn on top of those behind them.
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
