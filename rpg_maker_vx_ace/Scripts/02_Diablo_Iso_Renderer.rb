#==============================================================================
# ** DIABLO II 2.5D ISOMETRIC ENGINE FOR RPG MAKER VX ACE (RGSS3)
#------------------------------------------------------------------------------
# Module: Diablo_Iso::Renderer
# File: 02_Diablo_Iso_Renderer.rb
#==============================================================================

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
