// Centralized tile configuration for all map themes
// This file defines the properties of each tile type including walkable status and default images

export const TILE_CONFIG = {
    // Dungeon Tiles
    dungeon_floor: {
        walkable: true,
        image: "/images/tilesets/light_cracked_stone.png",
        size: 32,
        tiles: 4,
    },
    dungeon_corridor: {
        walkable: true,
        image: "/images/tilesets/light_cracked_stone.png",
        size: 32,
        tiles: 4,
    },
    dungeon_wall: {
        walkable: false,
        image: "/images/tilesets/dark_stone_with_vines.png",
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