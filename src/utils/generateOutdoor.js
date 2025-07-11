// Outdoor area generation using hybrid approach:
// 1. Generate traditional dungeon foundation (same as caverns)
// 2. Transform rooms to organic outdoor areas
// 3. Widen corridors to natural paths
// 4. Apply organic growth for natural appearance
import { addOutdoorLabels, assignAreaIds } from "./labelUtils";
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

const MIN_ROOM_SIZE = 5;
const MAX_ROOM_SIZE = 9;
const MAX_ROOMS = 9;
const MAX_ATTEMPTS = 50;
const GRID_WIDTH = 60;
const GRID_HEIGHT = 60;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createEmptyGrid(width, height) {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      type: "outdoor_shrub",
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

// Helper: Find center of an area
function areaCenter(area) {
  const n = area.cells.length;
  const sum = area.cells.reduce(
    (acc, cell) => ({ x: acc.x + cell.x, y: acc.y + cell.y }),
    { x: 0, y: 0 },
  );
  return { x: Math.round(sum.x / n), y: Math.round(sum.y / n) };
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
        if (grid[yy] && grid[yy][x] && grid[yy][x].type !== "outdoor_lake") {
          // Store original type for area continuity
          const originalType = grid[yy][x].type;
          grid[yy][x].type = "outdoor_river";
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
        if (grid[y] && grid[y][xx] && grid[y][xx].type !== "outdoor_lake") {
          // Store original type for area continuity
          const originalType = grid[y][xx].type;
          grid[y][xx].type = "outdoor_river";
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
        if (grid[y] && grid[y][xx] && grid[y][xx].type !== "outdoor_lake") {
          // Store original type for area continuity
          const originalType = grid[y][xx].type;
          grid[y][xx].type = "outdoor_river";
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
        if (grid[yy] && grid[yy][x] && grid[yy][x].type !== "outdoor_lake") {
          // Store original type for area continuity
          const originalType = grid[yy][x].type;
          grid[yy][x].type = "outdoor_river";
          grid[yy][x].originalType = originalType;
          grid[yy][x].tileX = randomInt(0, 3);
          grid[yy][x].tileY = randomInt(0, 3);
        }
      }
    }
  }
}

// Generate radiation zone - circular area with radius 7 (diameter 14)
function generateRadiationZone(grid, areas) {
  // Find a random area to place the radiation center
  const validAreas = areas.filter(
    (area) => area.cells.length > 0 && !area.isWater && !area.isMountain,
  );

  if (validAreas.length === 0) {
    return null; // No valid areas for radiation
  }

  // Pick a random area
  const targetArea = validAreas[Math.floor(Math.random() * validAreas.length)];

  // Find center of the target area
  const areaCenter = targetArea.cells.reduce(
    (acc, cell) => ({ x: acc.x + cell.x, y: acc.y + cell.y }),
    { x: 0, y: 0 },
  );
  areaCenter.x = Math.round(areaCenter.x / targetArea.cells.length);
  areaCenter.y = Math.round(areaCenter.y / targetArea.cells.length);

  // Add some randomness to the center position within the area
  const centerX = areaCenter.x + randomInt(-2, 2);
  const centerY = areaCenter.y + randomInt(-2, 2);

  const radius = 8;
  const radiationCells = [];

  // Generate circular radiation zone
  for (
    let y = Math.max(0, centerY - radius);
    y <= Math.min(GRID_HEIGHT - 1, centerY + radius);
    y++
  ) {
    for (
      let x = Math.max(0, centerX - radius);
      x <= Math.min(GRID_WIDTH - 1, centerX + radius);
      x++
    ) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distance <= radius) {
        // Mark tile as radioactive
        if (grid[y] && grid[y][x]) {
          grid[y][x].radioactive = true;
          radiationCells.push({ x, y });
        }
      }
    }
  }

  return {
    center: { x: centerX, y: centerY },
    radius: radius,
    cells: radiationCells,
  };
}

// Main outdoor generation function
export function generateOutdoor(width = GRID_WIDTH, height = GRID_HEIGHT) {
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

  // 3. Transform rooms to organic outdoor areas
  const areas = rooms.map((room, index) => {
    const cells = generateGenericOrganicArea(room, width, height, randomInt);
    return { cells, number: `A${index + 1}` };
  });
  areas.forEach((area) => {
    area.cells.forEach(({ x, y }) => {
      if (grid[y] && grid[y][x] && grid[y][x].type === "outdoor_shrub") {
        grid[y][x].type = "outdoor_area";
        grid[y][x].tileX = randomInt(0, 3);
        grid[y][x].tileY = randomInt(0, 3);
      }
    });
  });

  // 4. Connect rooms with roads
  const corridors = [];
  for (let i = 0; i < rooms.length; i++) {
    const curr = roomCenter(rooms[i]);
    const next = roomCenter(rooms[(i + 1) % rooms.length]);
    const path = carveGenericCorridor(grid, curr, next, {
      wallType: "outdoor_shrub",
      corridorType: "outdoor_road",
      randomInt,
    });
    corridors.push({ number: `C${i + 1}`, path });
  }

  // 5. Widen/organically grow roads
  widenCorridorsOrPaths(grid, corridors, {
    shrubType: "outdoor_shrub",
    corridorType: "outdoor_road",
    randomInt,
    gridWidth: width,
    gridHeight: height,
  });

  // 6. Apply organic growth
  applyGenericOrganicGrowth(grid, areas, {
    shrubType: "outdoor_shrub",
    areaType: "outdoor_area",
    randomInt,
    gridWidth: width,
    gridHeight: height,
  });

  // 7. Add lakes to some areas
  const lakeAreas = [];
  areas.forEach((area) => {
    if (Math.random() < 0.3) {
      area.cells.forEach(({ x, y }) => {
        if (grid[y] && grid[y][x]) {
          grid[y][x].type = "outdoor_lake";
          grid[y][x].tileX = randomInt(0, 3);
          grid[y][x].tileY = randomInt(0, 3);
        }
      });
      lakeAreas.push(area);
    }
  });

  // 8. Place mountains (outdoor only)
  let mountainPlaced = false;
  const mountainAreas = [];
  areas.forEach((area) => {
    // Place a mountain in one max-size area
    const isMaxSize = area.cells.length >= MAX_ROOM_SIZE * MAX_ROOM_SIZE;
    if (isMaxSize && !mountainPlaced && Math.random() < 0.5) {
      area.cells.forEach(({ x, y }) => {
        if (grid[y] && grid[y][x] && grid[y][x].type === "outdoor_area") {
          grid[y][x].type = "outdoor_mountain";
          grid[y][x].tileX = randomInt(0, 3);
          grid[y][x].tileY = randomInt(0, 3);
        }
      });
      mountainPlaced = true;
      mountainAreas.push(area);
    }
  });

  // 9. Generate rivers (prioritize mountains as sources, only one river per map)
  if (mountainAreas.length > 0 && lakeAreas.length > 0) {
    // River from mountain to lake (priority)
    const mountain = mountainAreas[0];
    const lake = lakeAreas[Math.floor(Math.random() * lakeAreas.length)];
    const mountainCenter = areaCenter(mountain);
    const lakeCenter = areaCenter(lake);
    carveRiver(grid, mountainCenter, lakeCenter);
  } else if (lakeAreas.length >= 2) {
    // River between lakes (only if no mountain-lake combination)
    const lake1 = lakeAreas[Math.floor(Math.random() * lakeAreas.length)];
    const remainingLakes = lakeAreas.filter((lake) => lake !== lake1);
    const lake2 =
      remainingLakes[Math.floor(Math.random() * remainingLakes.length)];
    const center1 = areaCenter(lake1);
    const center2 = areaCenter(lake2);
    carveRiver(grid, center1, center2);
  }

  // 10. Fill in random tileX/tileY for remaining shrubs
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].type === "outdoor_shrub") {
        grid[y][x].tileX = randomInt(0, 3);
        grid[y][x].tileY = randomInt(0, 3);
      }
    }
  }

  // 11. Generate radiation zone (outdoor only)
  const radiationZone = generateRadiationZone(grid, areas);

  // 12. Cleanup isolated tiles and unreachable areas (shared logic)
  cleanupGenericMap(grid, {
    walkableTypes: [
      "outdoor_area",
      "outdoor_road",
      "outdoor_lake",
      "outdoor_mountain",
      "outdoor_river",
    ],
    shrubType: "outdoor_shrub",
    roadType: "outdoor_road",
    minRoadArea: 3,
    randomInt,
  });

  // 13. Assign areaIds to all walkable tiles
  assignAreaIds(grid, "outdoor_area", "area");
  assignAreaIds(grid, "outdoor_road", "road");
  assignAreaIds(grid, "outdoor_lake", "lake");
  assignAreaIds(grid, "outdoor_mountain", "mountain");
  assignAreaIds(grid, "outdoor_river", "river");

  // 14. Add labels
  const result = addOutdoorLabels(grid, areas, lakeAreas);
  if (radiationZone) {
    result.radiationZone = radiationZone;
  }
  return result;
}

// Returns CSS background-position for a 4x4 tileset (32px tiles)
export function getTileBackgroundPosition(tileX, tileY) {
  const size = 32; // each tile is 32x32px
  return `${-tileX * size}px ${-tileY * size}px`;
}

// ===== HEX-BASED OUTDOOR GENERATOR =====

function hexDistance(a, b) {
  return (
    (Math.abs(a.q - b.q) +
      Math.abs(a.q + a.r - b.q - b.r) +
      Math.abs(a.r - b.r)) /
    2
  );
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

// Hex-based grid creation
function createHexEmptyGrid(width, height) {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      type: "outdoor_shrub",
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
  riverType = "outdoor_river",
  lakeType = "outdoor_lake",
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

// Hex-based radiation zone generation
function generateHexRadiationZone(grid, areas) {
  // Find a random area to place the radiation center
  const validAreas = areas.filter(
    (area) => area.cells.length > 0 && !area.isWater && !area.isMountain,
  );

  if (validAreas.length === 0) {
    return null; // No valid areas for radiation
  }

  // Pick a random area
  const targetArea = validAreas[Math.floor(Math.random() * validAreas.length)];

  // Find center of the target area
  const areaCenter = targetArea.cells.reduce(
    (acc, cell) => ({ x: acc.x + cell.x, y: acc.y + cell.y }),
    { x: 0, y: 0 },
  );
  areaCenter.x = Math.round(areaCenter.x / targetArea.cells.length);
  areaCenter.y = Math.round(areaCenter.y / targetArea.cells.length);

  // Add some randomness to the center position within the area
  const centerX = areaCenter.x + randomInt(-2, 2);
  const centerY = areaCenter.y + randomInt(-2, 2);

  const radius = 8;
  const radiationCells = [];

  // Generate circular radiation zone using hex distance
  for (
    let y = Math.max(0, centerY - radius);
    y <= Math.min(GRID_HEIGHT - 1, centerY + radius);
    y++
  ) {
    for (
      let x = Math.max(0, centerX - radius);
      x <= Math.min(GRID_WIDTH - 1, centerX + radius);
      x++
    ) {
      const centerHex = gridToHexCoords(centerX, centerY);
      const currentHex = gridToHexCoords(x, y);
      const distance = hexDistance(centerHex, currentHex);

      if (distance <= radius) {
        // Mark tile as radioactive
        if (grid[y] && grid[y][x]) {
          grid[y][x].radioactive = true;
          radiationCells.push({ x, y });
        }
      }
    }
  }

  return {
    center: { x: centerX, y: centerY },
    radius: radius,
    cells: radiationCells,
  };
}

// Main hex outdoor generation function
export function generateHexOutdoor(width = GRID_WIDTH, height = GRID_HEIGHT) {
  // 1. Create empty grid
  const grid = createHexEmptyGrid(width, height);

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

  // 3. Transform rooms to organic outdoor areas
  const areas = rooms.map((room, index) => {
    const cells = generateGenericOrganicArea(room, width, height, randomInt);
    return { cells, number: `A${index + 1}` };
  });
  areas.forEach((area) => {
    area.cells.forEach(({ x, y }) => {
      if (grid[y] && grid[y][x] && grid[y][x].type === "outdoor_shrub") {
        grid[y][x].type = "outdoor_area";
        grid[y][x].tileX = randomInt(0, 3);
        grid[y][x].tileY = randomInt(0, 3);
      }
    });
  });

  // 4. Connect rooms with roads
  const corridors = [];
  for (let i = 0; i < rooms.length; i++) {
    const curr = roomCenter(rooms[i]);
    const next = roomCenter(rooms[(i + 1) % rooms.length]);
    const path = carveGenericHexCorridor(grid, curr, next, {
      wallType: "outdoor_shrub",
      corridorType: "outdoor_road",
      randomInt,
    });
    corridors.push({ number: `C${i + 1}`, path });
  }

  // 5. Widen/organically grow roads
  widenHexCorridorsOrPaths(grid, corridors, {
    shrubType: "outdoor_shrub",
    corridorType: "outdoor_road",
    randomInt,
    gridWidth: width,
    gridHeight: height,
    gridToHexCoords,
    hexNeighbors,
    hexToGridCoords,
  });

  // 6. Apply organic growth
  applyGenericHexOrganicGrowth(grid, areas, {
    shrubType: "outdoor_shrub",
    areaType: "outdoor_area",
    randomInt,
    gridWidth: width,
    gridHeight: height,
    gridToHexCoords,
    hexNeighbors,
    hexToGridCoords,
  });

  // 7. Add lakes to some areas
  const lakeAreas = [];
  areas.forEach((area) => {
    if (Math.random() < 0.3) {
      area.cells.forEach(({ x, y }) => {
        if (grid[y] && grid[y][x]) {
          grid[y][x].type = "outdoor_lake";
          grid[y][x].tileX = randomInt(0, 3);
          grid[y][x].tileY = randomInt(0, 3);
        }
      });
      lakeAreas.push(area);
    }
  });

  // 8. Place mountains (outdoor only)
  let mountainPlaced = false;
  const mountainAreas = [];
  areas.forEach((area) => {
    // Place a mountain in one max-size area
    const isMaxSize = area.cells.length >= MAX_ROOM_SIZE * MAX_ROOM_SIZE;
    if (isMaxSize && !mountainPlaced && Math.random() < 0.5) {
      area.cells.forEach(({ x, y }) => {
        if (grid[y] && grid[y][x] && grid[y][x].type === "outdoor_area") {
          grid[y][x].type = "outdoor_mountain";
          grid[y][x].tileX = randomInt(0, 3);
          grid[y][x].tileY = randomInt(0, 3);
        }
      });
      mountainPlaced = true;
      mountainAreas.push(area);
    }
  });

  // 9. Generate rivers (prioritize mountains as sources, only one river per map)
  if (mountainAreas.length > 0 && lakeAreas.length > 0) {
    // River from mountain to lake (priority)
    const mountain = mountainAreas[0];
    const lake = lakeAreas[Math.floor(Math.random() * lakeAreas.length)];
    const mountainCenter = areaCenter(mountain);
    const lakeCenter = areaCenter(lake);
    carveHexRiver(
      grid,
      mountainCenter,
      lakeCenter,
      "outdoor_river",
      "outdoor_lake",
    );
  } else if (lakeAreas.length >= 2) {
    // River between lakes (only if no mountain-lake combination)
    const lake1 = lakeAreas[Math.floor(Math.random() * lakeAreas.length)];
    const remainingLakes = lakeAreas.filter((lake) => lake !== lake1);
    const lake2 =
      remainingLakes[Math.floor(Math.random() * remainingLakes.length)];
    const center1 = areaCenter(lake1);
    const center2 = areaCenter(lake2);
    carveHexRiver(grid, center1, center2, "outdoor_river", "outdoor_lake");
  }

  // 10. Fill in random tileX/tileY for remaining shrubs
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].type === "outdoor_shrub") {
        grid[y][x].tileX = randomInt(0, 3);
        grid[y][x].tileY = randomInt(0, 3);
      }
    }
  }

  // 11. Generate radiation zone (outdoor only)
  const radiationZone = generateHexRadiationZone(grid, areas);

  // 12. Cleanup isolated tiles and unreachable areas (shared logic)
  cleanupGenericHexMap(grid, {
    walkableTypes: [
      "outdoor_area",
      "outdoor_road",
      "outdoor_lake",
      "outdoor_mountain",
      "outdoor_river",
    ],
    shrubType: "outdoor_shrub",
    roadType: "outdoor_road",
    minRoadArea: 3,
    randomInt,
    gridToHexCoords,
    hexNeighbors,
    hexToGridCoords,
  });

  // 13. Assign areaIds to all walkable tiles
  assignAreaIds(grid, "outdoor_area", "area");
  assignAreaIds(grid, "outdoor_road", "road");
  assignAreaIds(grid, "outdoor_lake", "lake");
  assignAreaIds(grid, "outdoor_mountain", "mountain");
  assignAreaIds(grid, "outdoor_river", "river");

  // 14. Add labels
  const result = addOutdoorLabels(grid, areas, lakeAreas);
  if (radiationZone) {
    result.radiationZone = radiationZone;
  }
  return result;
}
