// Cavern generation using hybrid approach:
// 1. Generate traditional dungeon foundation
// 2. Transform rooms to organic cavern chambers
// 3. Widen corridors to natural passages
// 4. Apply organic growth for natural appearance
import { addCavernLabels, assignAreaIds } from "./labelUtils";
import {
  generateGenericRooms,
  generateGenericOrganicArea,
  carveGenericCorridor,
  applyGenericOrganicGrowth,
  cleanupGenericMap,
  widenCorridorsOrPaths,
  carveGenericHexCorridor,
  applyGenericHexOrganicGrowth,
  cleanupGenericHexMap,
  widenHexCorridorsOrPaths,
} from "./mapGeneratorUtils";

const MIN_ROOM_SIZE = 4;
const MAX_ROOM_SIZE = 8;
const MAX_ROOMS = 8;
const MAX_ATTEMPTS = 50;
const GRID_WIDTH = 60;
const GRID_HEIGHT = 60;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createEmptyGrid(width, height) {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      type: "cavern_wall",
      tileX: 0,
      tileY: 0,
    })),
  );
}

function roomOverlaps(newRoom, rooms) {
  return rooms.some((room) => {
    // Add 1 cell buffer between rooms
    return !(
      newRoom.x + newRoom.width + 1 < room.x ||
      newRoom.x > room.x + room.width + 1 ||
      newRoom.y + newRoom.height + 1 < room.y ||
      newRoom.y > room.y + newRoom.height + 1
    );
  });
}

function roomCenter(room) {
  return {
    x: room.x + Math.floor(room.width / 2),
    y: room.y + Math.floor(room.height / 2),
  };
}

// Helper: Carve a river corridor between two points (preserves area continuity)
function carveRiver(grid, from, to) {
  let { x: x1, y: y1 } = from;
  let { x: x2, y: y2 } = to;
  // L-shaped path: horizontal then vertical or vice versa (randomize)
  if (Math.random() < 0.5) {
    // Horizontal then vertical
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      const width = Math.random() < 0.5 ? 1 : 2;
      for (let dy = 0; dy < width; dy++) {
        const yy = y1 + dy;
        if (grid[yy] && grid[yy][x] && grid[yy][x].type !== "cavern_lake") {
          // Store original type for area continuity
          const originalType = grid[yy][x].type;
          grid[yy][x].type = "cavern_river";
          grid[yy][x].originalType = originalType;
          grid[yy][x].tileX = randomInt(0, 3);
          grid[yy][x].tileY = randomInt(0, 3);
        }
      }
    }
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      const width = Math.random() < 0.5 ? 1 : 2;
      for (let dx = 0; dx < width; dx++) {
        const xx = x2 + dx;
        if (grid[y] && grid[y][xx] && grid[y][xx].type !== "cavern_lake") {
          // Store original type for area continuity
          const originalType = grid[y][xx].type;
          grid[y][xx].type = "cavern_river";
          grid[y][xx].originalType = originalType;
          grid[y][xx].tileX = randomInt(0, 3);
          grid[y][xx].tileY = randomInt(0, 3);
        }
      }
    }
  } else {
    // Vertical then horizontal
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      const width = Math.random() < 0.5 ? 1 : 2;
      for (let dx = 0; dx < width; dx++) {
        const xx = x1 + dx;
        if (grid[y] && grid[y][xx] && grid[y][xx].type !== "cavern_lake") {
          // Store original type for area continuity
          const originalType = grid[y][xx].type;
          grid[y][xx].type = "cavern_river";
          grid[y][xx].originalType = originalType;
          grid[y][xx].tileX = randomInt(0, 3);
          grid[y][xx].tileY = randomInt(0, 3);
        }
      }
    }
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      const width = Math.random() < 0.5 ? 1 : 2;
      for (let dy = 0; dy < width; dy++) {
        const yy = y2 + dy;
        if (grid[yy] && grid[yy][x] && grid[yy][x].type !== "cavern_lake") {
          // Store original type for area continuity
          const originalType = grid[yy][x].type;
          grid[yy][x].type = "cavern_river";
          grid[yy][x].originalType = originalType;
          grid[yy][x].tileX = randomInt(0, 3);
          grid[yy][x].tileY = randomInt(0, 3);
        }
      }
    }
  }
}

// Helper: Calculate center of an area
function areaCenter(area) {
  const center = area.cells.reduce(
    (acc, cell) => ({ x: acc.x + cell.x, y: acc.y + cell.y }),
    { x: 0, y: 0 },
  );
  center.x = Math.round(center.x / area.cells.length);
  center.y = Math.round(center.y / area.cells.length);
  return center;
}

// ===== HEX-BASED CAVERN GENERATOR =====

// Convert between hex and grid coordinates for display
function hexToGridCoords(q, r) {
  const x = q;
  const y = r + (q - (q & 1)) / 2;
  return { x, y };
}

function gridToHexCoords(x, y) {
  const q = x;
  const r = y - (x - (x & 1)) / 2;
  return { q, r };
}

function hexNeighbors(hex) {
  const directions = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];
  return directions.map((dir) => ({ q: hex.q + dir.q, r: hex.r + dir.r }));
}

// Hex-based grid creation
function createHexCavernEmptyGrid(width, height) {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      type: "cavern_wall",
      tileX: 0,
      tileY: 0,
    })),
  );
}

// Hex-based river carving
function carveHexRiver(
  grid,
  from,
  to,
  riverType = "cavern_river",
  lakeType = "cavern_lake",
) {
  let { x: x1, y: y1 } = from;
  let { x: x2, y: y2 } = to;

  // L-shaped path: horizontal then vertical or vice versa (randomize)
  if (Math.random() < 0.5) {
    // Horizontal then vertical
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      const width = Math.random() < 0.5 ? 1 : 2;
      for (let dy = 0; dy < width; dy++) {
        const yy = y1 + dy;
        if (grid[yy] && grid[yy][x] && grid[yy][x].type !== lakeType) {
          const originalType = grid[yy][x].type;
          grid[yy][x].type = riverType;
          grid[yy][x].originalType = originalType;
          grid[yy][x].tileX = randomInt(0, 3);
          grid[yy][x].tileY = randomInt(0, 3);
        }
      }
    }
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      const width = Math.random() < 0.5 ? 1 : 2;
      for (let dx = 0; dx < width; dx++) {
        const xx = x2 + dx;
        if (grid[y] && grid[y][xx] && grid[y][xx].type !== lakeType) {
          const originalType = grid[y][xx].type;
          grid[y][xx].type = riverType;
          grid[y][xx].originalType = originalType;
          grid[y][xx].tileX = randomInt(0, 3);
          grid[y][xx].tileY = randomInt(0, 3);
        }
      }
    }
  } else {
    // Vertical then horizontal
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      const width = Math.random() < 0.5 ? 1 : 2;
      for (let dx = 0; dx < width; dx++) {
        const xx = x1 + dx;
        if (grid[y] && grid[y][xx] && grid[y][xx].type !== lakeType) {
          const originalType = grid[y][xx].type;
          grid[y][xx].type = riverType;
          grid[y][xx].originalType = originalType;
          grid[y][xx].tileX = randomInt(0, 3);
          grid[y][xx].tileY = randomInt(0, 3);
        }
      }
    }
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      const width = Math.random() < 0.5 ? 1 : 2;
      for (let dy = 0; dy < width; dy++) {
        const yy = y2 + dy;
        if (grid[yy] && grid[yy][x] && grid[yy][x].type !== lakeType) {
          const originalType = grid[yy][x].type;
          grid[yy][x].type = riverType;
          grid[yy][x].originalType = originalType;
          grid[yy][x].tileX = randomInt(0, 3);
          grid[yy][x].tileY = randomInt(0, 3);
        }
      }
    }
  }
}

// Main cavern generation function
export function generateCavern(width = GRID_WIDTH, height = GRID_HEIGHT) {
  // 1. Create empty grid
  const grid = createEmptyGrid(width, height);

  // 2. Generate rooms
  const rooms = generateGenericRooms({
    minRoomSize: MIN_ROOM_SIZE,
    maxRoomSize: MAX_ROOM_SIZE,
    maxRooms: MAX_ROOMS,
    maxAttempts: MAX_ATTEMPTS,
    gridWidth: width,
    gridHeight: height,
    roomOverlaps,
    randomInt,
  });

  // 3. Transform rooms to organic cavern areas
  const caverns = rooms.map((room, index) => {
    const cells = generateGenericOrganicArea(room, width, height, randomInt);
    return { cells, number: `A${index + 1}` };
  });
  caverns.forEach((cavern) => {
    cavern.cells.forEach(({ x, y }) => {
      if (grid[y] && grid[y][x] && grid[y][x].type === "cavern_wall") {
        grid[y][x].type = "cavern_floor";
        grid[y][x].tileX = randomInt(0, 3);
        grid[y][x].tileY = randomInt(0, 3);
      }
    });
  });

  // 4. Connect rooms with corridors
  const corridors = [];
  for (let i = 0; i < rooms.length; i++) {
    const curr = roomCenter(rooms[i]);
    const next = roomCenter(rooms[(i + 1) % rooms.length]);
    const path = carveGenericCorridor(grid, curr, next, {
      wallType: "cavern_wall",
      corridorType: "cavern_corridor",
      randomInt,
    });
    corridors.push({ number: `C${i + 1}`, path });
  }

  // 5. Widen/organically grow corridors
  widenCorridorsOrPaths(grid, corridors, {
    shrubType: "cavern_wall",
    corridorType: "cavern_corridor",
    randomInt,
    gridWidth: width,
    gridHeight: height,
  });

  // 6. Apply organic growth
  applyGenericOrganicGrowth(grid, caverns, {
    shrubType: "cavern_wall",
    areaType: "cavern_floor",
    randomInt,
    gridWidth: width,
    gridHeight: height,
  });

  // 7. Add lakes to some caverns
  const lakeCaverns = [];
  caverns.forEach((cavern) => {
    if (Math.random() < 0.3) {
      cavern.cells.forEach(({ x, y }) => {
        if (grid[y] && grid[y][x]) {
          grid[y][x].type = "cavern_lake";
          grid[y][x].tileX = randomInt(0, 3);
          grid[y][x].tileY = randomInt(0, 3);
        }
      });
      lakeCaverns.push(cavern);
    }
  });

  // 8. Generate rivers between lakes (only one river per map)
  if (lakeCaverns.length >= 2) {
    const lake1 = lakeCaverns[Math.floor(Math.random() * lakeCaverns.length)];
    const remainingLakes = lakeCaverns.filter((lake) => lake !== lake1);
    const lake2 =
      remainingLakes[Math.floor(Math.random() * remainingLakes.length)];
    const center1 = areaCenter(lake1);
    const center2 = areaCenter(lake2);
    carveRiver(grid, center1, center2);
  }

  // 9. Fill in random tileX/tileY for remaining walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].type === "cavern_wall") {
        grid[y][x].tileX = randomInt(0, 3);
        grid[y][x].tileY = randomInt(0, 3);
      }
    }
  }

  // 10. Cleanup isolated tiles and unreachable areas (shared logic)
  cleanupGenericMap(grid, {
    walkableTypes: [
      "cavern_floor",
      "cavern_corridor",
      "cavern_lake",
      "cavern_river",
    ],
    shrubType: "cavern_wall",
    roadType: "cavern_corridor",
    minRoadArea: 3,
    randomInt,
  });

  // 11. Assign areaIds to all walkable tiles
  assignAreaIds(grid, "cavern_floor", "chamber");
  assignAreaIds(grid, "cavern_corridor", "corridor");
  assignAreaIds(grid, "cavern_lake", "lake");
  assignAreaIds(grid, "cavern_river", "river");

  // 12. Add labels
  return addCavernLabels(grid);
}

// Main hex cavern generation function
export function generateHexCavern(width = GRID_WIDTH, height = GRID_HEIGHT) {
  // 1. Create empty grid
  const grid = createHexCavernEmptyGrid(width, height);

  // 2. Generate rooms
  const rooms = generateGenericRooms({
    minRoomSize: MIN_ROOM_SIZE,
    maxRoomSize: MAX_ROOM_SIZE,
    maxRooms: MAX_ROOMS,
    maxAttempts: MAX_ATTEMPTS,
    gridWidth: width,
    gridHeight: height,
    roomOverlaps,
    randomInt,
  });

  // 3. Transform rooms to organic cavern areas
  const caverns = rooms.map((room, index) => {
    const cells = generateGenericOrganicArea(room, width, height, randomInt);
    return { cells, number: `A${index + 1}` };
  });
  caverns.forEach((cavern) => {
    cavern.cells.forEach(({ x, y }) => {
      if (grid[y] && grid[y][x] && grid[y][x].type === "cavern_wall") {
        grid[y][x].type = "cavern_floor";
        grid[y][x].tileX = randomInt(0, 3);
        grid[y][x].tileY = randomInt(0, 3);
      }
    });
  });

  // 4. Connect rooms with corridors
  const corridors = [];
  for (let i = 0; i < rooms.length; i++) {
    const curr = roomCenter(rooms[i]);
    const next = roomCenter(rooms[(i + 1) % rooms.length]);
    const path = carveGenericHexCorridor(grid, curr, next, {
      wallType: "cavern_wall",
      corridorType: "cavern_corridor",
      randomInt,
    });
    corridors.push({ number: `C${i + 1}`, path });
  }

  // 5. Widen/organically grow corridors
  widenHexCorridorsOrPaths(grid, corridors, {
    shrubType: "cavern_wall",
    corridorType: "cavern_corridor",
    randomInt,
    gridWidth: width,
    gridHeight: height,
    gridToHexCoords,
    hexNeighbors,
    hexToGridCoords,
  });

  // 6. Apply organic growth
  applyGenericHexOrganicGrowth(grid, caverns, {
    shrubType: "cavern_wall",
    areaType: "cavern_floor",
    randomInt,
    gridWidth: width,
    gridHeight: height,
    gridToHexCoords,
    hexNeighbors,
    hexToGridCoords,
  });

  // 7. Add lakes to some caverns
  const lakeCaverns = [];
  caverns.forEach((cavern) => {
    if (Math.random() < 0.3) {
      cavern.cells.forEach(({ x, y }) => {
        if (grid[y] && grid[y][x]) {
          grid[y][x].type = "cavern_lake";
          grid[y][x].tileX = randomInt(0, 3);
          grid[y][x].tileY = randomInt(0, 3);
        }
      });
      lakeCaverns.push(cavern);
    }
  });

  // 8. Generate rivers between lakes (only one river per map)
  if (lakeCaverns.length >= 2) {
    const lake1 = lakeCaverns[Math.floor(Math.random() * lakeCaverns.length)];
    const remainingLakes = lakeCaverns.filter((lake) => lake !== lake1);
    const lake2 =
      remainingLakes[Math.floor(Math.random() * remainingLakes.length)];
    const center1 = areaCenter(lake1);
    const center2 = areaCenter(lake2);
    carveHexRiver(grid, center1, center2, "cavern_river", "cavern_lake");
  }

  // 9. Fill in random tileX/tileY for remaining walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].type === "cavern_wall") {
        grid[y][x].tileX = randomInt(0, 3);
        grid[y][x].tileY = randomInt(0, 3);
      }
    }
  }

  // 10. Cleanup isolated tiles and unreachable areas (shared logic)
  cleanupGenericHexMap(grid, {
    walkableTypes: [
      "cavern_floor",
      "cavern_corridor",
      "cavern_lake",
      "cavern_river",
    ],
    shrubType: "cavern_wall",
    roadType: "cavern_corridor",
    minRoadArea: 3,
    randomInt,
    gridToHexCoords,
    hexNeighbors,
    hexToGridCoords,
  });

  // 11. Assign areaIds to all walkable tiles
  assignAreaIds(grid, "cavern_floor", "chamber");
  assignAreaIds(grid, "cavern_corridor", "corridor");
  assignAreaIds(grid, "cavern_lake", "lake");
  assignAreaIds(grid, "cavern_river", "river");

  // 12. Add labels
  return addCavernLabels(grid);
}
