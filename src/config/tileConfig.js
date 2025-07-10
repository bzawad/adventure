// Centralized tile configuration for all map themes
// This file defines the properties of each tile type including walkable status and default images

export const TILE_CONFIG = {
  // Dungeon Tiles
  dungeon_floor: {
    walkable: true,
    image: "/images/tilesets/light_cobblestone.png",
    size: 32,
    tiles: 4,
  },
  dungeon_corridor: {
    walkable: true,
    image: "/images/tilesets/light_cobblestone.png",
    size: 32,
    tiles: 4,
  },
  dungeon_wall: {
    walkable: false,
    image: "/images/tilesets/dark_cobblestone.png",
    size: 32,
    tiles: 4,
  },

  // Cavern Tiles
  cavern_floor: {
    walkable: true,
    image: "/images/tilesets/light_brown_cavern.png",
    size: 32,
    tiles: 4,
  },
  cavern_corridor: {
    walkable: true,
    image: "/images/tilesets/light_brown_cavern.png",
    size: 32,
    tiles: 4,
  },
  cavern_wall: {
    walkable: false,
    image: "/images/tilesets/red_brown_cavern.png",
    size: 32,
    tiles: 4,
  },
  cavern_lake: {
    walkable: true,
    image: "/images/tilesets/calm_water.png",
    size: 32,
    tiles: 4,
  },
  cavern_river: {
    walkable: true,
    image: "/images/tilesets/river_water.png",
    size: 32,
    tiles: 4,
  },

  // Outdoor Tiles
  outdoor_area: {
    walkable: true,
    image: "/images/tilesets/dirt_and_grass.png",
    size: 32,
    tiles: 4,
  },
  outdoor_road: {
    walkable: true,
    image: "/images/tilesets/dirt_and_grass.png",
    size: 32,
    tiles: 4,
  },
  outdoor_shrub: {
    walkable: false,
    image: "/images/tilesets/green_shrubs.png",
    size: 32,
    tiles: 4,
  },
  outdoor_lake: {
    walkable: true,
    image: "/images/tilesets/calm_water.png",
    size: 32,
    tiles: 4,
  },
  outdoor_river: {
    walkable: true,
    image: "/images/tilesets/river_water.png",
    size: 32,
    tiles: 4,
  },
  outdoor_mountain: {
    walkable: true,
    image: "/images/tilesets/mountains.png",
    size: 32,
    tiles: 4,
  },

  // City Tiles
  city_road: {
    walkable: true,
    image: "/images/tilesets/dirt_and_grass.png",
    size: 32,
    tiles: 4,
  },
  city_shrub: {
    walkable: false,
    image: "/images/tilesets/green_shrubs.png",
    size: 32,
    tiles: 4,
  },
  city_floor: {
    walkable: true,
    image: "/images/tilesets/wood_boards.png",
    size: 32,
    tiles: 4,
  },
  city_wall: {
    walkable: false,
    image: "/images/tilesets/dark_square_stones.png",
    size: 32,
    tiles: 4,
  },

  // Label Tiles (overlay on existing tiles)
  dungeon_room_label: {
    walkable: true, // inherits from underlying tile
    image: "/images/tilesets/light_cobblestone.png", // match dungeon_floor
    size: 32,
    tiles: 4,
    isLabel: true,
  },
  dungeon_corridor_label: {
    walkable: true,
    image: "/images/tilesets/light_cobblestone.png", // match dungeon_floor
    size: 32,
    tiles: 4,
    isLabel: true,
  },
  cavern_chamber_label: {
    walkable: true,
    image: "/images/tilesets/light_brown_cavern.png",
    size: 32,
    tiles: 4,
    isLabel: true,
  },
  cavern_tunnel_label: {
    walkable: true,
    image: "/images/tilesets/light_brown_cavern.png",
    size: 32,
    tiles: 4,
    isLabel: true,
  },
  cavern_lake_label: {
    walkable: true,
    image: "/images/tilesets/calm_water.png",
    size: 32,
    tiles: 4,
    isLabel: true,
  },
  cavern_river_label: {
    walkable: true,
    image: "/images/tilesets/river_water.png",
    size: 32,
    tiles: 4,
    isLabel: true,
  },
  outdoor_area_label: {
    walkable: true,
    image: "/images/tilesets/dirt_and_grass.png",
    size: 32,
    tiles: 4,
    isLabel: true,
  },
  outdoor_road_label: {
    walkable: true,
    image: "/images/tilesets/dirt_and_grass.png",
    size: 32,
    tiles: 4,
    isLabel: true,
  },
  outdoor_lake_label: {
    walkable: true,
    image: "/images/tilesets/calm_water.png",
    size: 32,
    tiles: 4,
    isLabel: true,
  },
  outdoor_river_label: {
    walkable: true,
    image: "/images/tilesets/river_water.png",
    size: 32,
    tiles: 4,
    isLabel: true,
  },
  city_road_label: {
    walkable: true,
    image: "/images/tilesets/dark_cobblestone.png",
    size: 32,
    tiles: 4,
    isLabel: true,
  },
  city_building_label: {
    walkable: true,
    image: "/images/tilesets/wood_boards.png",
    size: 32,
    tiles: 4,
    isLabel: true,
  },
  outdoor_mountain_label: {
    walkable: true,
    image: "/images/tilesets/mountains.png",
    size: 32,
    tiles: 4,
    isLabel: true,
  },
};

// Helper function to get tile configuration
export function getTileConfig(tileType) {
  return TILE_CONFIG[tileType] || null;
}

// Helper function to check if a tile type is walkable
export function isTileWalkable(tileType) {
  const config = getTileConfig(tileType);
  return config ? config.walkable : false;
}

// Helper function to get tile image
export function getTileImage(tileType) {
  const config = getTileConfig(tileType);
  return config ? config.image : null;
}
