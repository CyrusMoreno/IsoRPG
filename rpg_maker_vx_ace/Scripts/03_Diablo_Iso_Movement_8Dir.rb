#==============================================================================
# ** DIABLO II 2.5D ISOMETRIC ENGINE FOR RPG MAKER VX ACE (RGSS3)
#------------------------------------------------------------------------------
# Module: Diablo_Iso::Movement_8Dir
# File: 03_Diablo_Iso_Movement_8Dir.rb
#==============================================================================

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
