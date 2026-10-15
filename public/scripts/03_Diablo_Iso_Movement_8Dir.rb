#==============================================================================
# ** DIABLO II 2.5D ISOMETRIC ENGINE FOR RPG MAKER VX ACE (RGSS3)
#------------------------------------------------------------------------------
# Module: Diablo_Iso::Movement_8Dir
# File: 03_Diablo_Iso_Movement_8Dir.rb
# Engine: RPG Maker VX Ace (RGSS3 / Ruby 1.9.2)
# Author: Diablo II RGSS3 Conversion Suite
# Version: 2.1.0
# Description:
#   8-Directional Isometric Movement for RPG Maker VX Ace.
#   Maps keyboard arrow keys, numpad, and gamepad to true isometric axes.
#==============================================================================

class Game_CharacterBase
  # Extended 8 directions in RGSS3:
  # 2: South (Down)      4: West (Left)      6: East (Right)     8: North (Up)
  # 1: South-West        3: South-East       7: North-West       9: North-East

  # Convert character position into isometric screen coordinates
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

    # Check 8-dir input from keyboard or numpad
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
