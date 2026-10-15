#==============================================================================
# ** DIABLO II 2.5D ISOMETRIC ENGINE FOR RPG MAKER VX ACE (RGSS3)
#------------------------------------------------------------------------------
# Module: Diablo_Iso::Mouse_ClickToMove
# File: 04_Diablo_Iso_Mouse_ClickToMove.rb
#==============================================================================

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
