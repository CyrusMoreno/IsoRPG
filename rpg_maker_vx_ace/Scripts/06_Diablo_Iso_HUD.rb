#==============================================================================
# ** DIABLO II 2.5D ISOMETRIC ENGINE FOR RPG MAKER VX ACE (RGSS3)
#------------------------------------------------------------------------------
# Module: Diablo_Iso::HUD
# File: 06_Diablo_Iso_HUD.rb
#==============================================================================

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
