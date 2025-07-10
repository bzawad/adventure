// Outdoor area generation using hybrid approach:
// 1. Generate traditional dungeon foundation (same as caverns)
// 2. Transform rooms to organic outdoor areas
// 3. Widen corridors to natural paths
// 4. Apply organic growth for natural appearance
import { addOutdoorLabels, assignAreaIds, addCavernLabels } from "./labelUtils";
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
  widenHexCorridorsOrPaths
} from "./mapGeneratorUtils";

const MIN_ROOM_SIZE = 5;
const MAX_ROOM_SIZE = 9;
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

function carveHorizontalCorridor(grid, x1, x2, y) {
  const path = [];
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
    if (
      grid[y][x].type === "outdoor_shrub" ||
      grid[y][x].type === "outdoor_road"
    ) {
      grid[y][x].type = "outdoor_road";
      grid[y][x].tileX = randomInt(0, 3);
      grid[y][x].tileY = randomInt(0, 3);
    }
    path.push({ x, y });
  }
  return path;
}

function carveVerticalCorridor(grid, y1, y2, x) {
  const path = [];
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
    if (
      grid[y][x].type === "outdoor_shrub" ||
      grid[y][x].type === "outdoor_road"
    ) {
      grid[y][x].type = "outdoor_road";
      grid[y][x].tileX = randomInt(0, 3);
      grid[y][x].tileY = randomInt(0, 3);
    }
    path.push({ x, y });
  }
  return path;
}

function createCorridor(grid, from, to) {
  let path = [];
  if (Math.random() < 0.5) {
    path = path.concat(carveHorizontalCorridor(grid, from.x, to.x, from.y));
    path = path.concat(carveVerticalCorridor(grid, from.y, to.y, to.x));
  } else {
    path = path.concat(carveVerticalCorridor(grid, from.y, to.y, from.x));
    path = path.concat(carveHorizontalCorridor(grid, from.x, to.x, to.y));
  }
  return path;
}

function connectRooms(grid, rooms) {
  if (rooms.length < 2) return [];
  const corridors = [];
  // Connect each room to the next, and the last to the first (loop)
  for (let i = 0; i < rooms.length; i++) {
    const curr = roomCenter(rooms[i]);
    const next = roomCenter(rooms[(i + 1) % rooms.length]);
    const path = createCorridor(grid, curr, next);
    corridors.push({ number: `C${i + 1}`, path });
  }
  return corridors;
}

// Generate organic area cells based on traditional room bounds
function generateOrganicArea(room) {
  const cells = [];
  // Base cells from the room
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      cells.push({ x, y });
    }
  }
  // Add organic expansion around the room
  const expandedCells = [...cells];
  cells.forEach(({ x, y }) => {
    // Randomly add adjacent cells for organic shape
    const adjacent = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ];
    adjacent.forEach((pos) => {
      if (
        Math.random() < 0.4 &&
        pos.x >= 0 &&
        pos.x < GRID_WIDTH &&
        pos.y >= 0 &&
        pos.y < GRID_HEIGHT
      ) {
        expandedCells.push(pos);
      }
    });
  });
  // Remove duplicates
  return expandedCells.filter(
    (cell, index, self) =>
      index === self.findIndex((c) => c.x === cell.x && c.y === cell.y),
  );
}

// Transform traditional rooms into organic outdoor areas
function transformRoomsToOutdoorAreas(grid, rooms) {
  let mountainPlaced = false;

  const areas = rooms.map((room, index) => {
    const cells = generateOrganicArea(room);

    // Check if this room could be a mountain (max size of 9)
    const isMaxSize =
      room.width === MAX_ROOM_SIZE && room.height === MAX_ROOM_SIZE;
    const isMountain = isMaxSize && !mountainPlaced && Math.random() < 0.5;

    if (isMountain) {
      mountainPlaced = true;
    }

    // 1 in 8 chance this area is water (but not if it's a mountain)
    const isWater = !isMountain && Math.random() < 0.125;

    return { cells, number: `A${index + 1}`, isWater, isMountain };
  });

  // Enhance grid with organic shapes
  areas.forEach((area) => {
    area.cells.forEach(({ x, y }) => {
      if (grid[y] && grid[y][x]) {
        if (area.isMountain) {
          if (
            grid[y][x].type !== "outdoor_mountain" &&
            grid[y][x].type !== "outdoor_river" &&
            grid[y][x].type !== "outdoor_lake"
          ) {
            grid[y][x].type = "outdoor_mountain";
            grid[y][x].tileX = randomInt(0, 3);
            grid[y][x].tileY = randomInt(0, 3);
          }
        } else if (area.isWater) {
          if (
            grid[y][x].type !== "outdoor_mountain" &&
            grid[y][x].type !== "outdoor_river"
          ) {
            grid[y][x].type = "outdoor_lake";
            grid[y][x].tileX = randomInt(0, 3);
            grid[y][x].tileY = randomInt(0, 3);
          }
        } else {
          if (
            grid[y][x].type === "outdoor_shrub" ||
            grid[y][x].type === "outdoor_road"
          ) {
            grid[y][x].type = "outdoor_area";
            grid[y][x].tileX = randomInt(0, 3);
            grid[y][x].tileY = randomInt(0, 3);
          }
        }
      }
    });
  });
  return areas;
}

// Convert straight corridors into wider, more natural paths
function transformCorridorsToPaths(grid, corridors) {
  corridors.forEach((corridor) => {
    corridor.path.forEach(({ x, y }) => {
      if (grid[y] && grid[y][x]) {
        // Add adjacent cells for width
        const adjacent = [
          { x: x - 1, y },
          { x: x + 1, y },
          { x, y: y - 1 },
          { x, y: y + 1 },
        ];
        adjacent.forEach((pos) => {
          if (
            pos.x > 0 &&
            pos.x < GRID_WIDTH - 1 &&
            pos.y > 0 &&
            pos.y < GRID_HEIGHT - 1 &&
            Math.random() < 0.5
          ) {
            if (
              grid[pos.y] &&
              grid[pos.y][pos.x] &&
              grid[pos.y][pos.x].type === "outdoor_shrub"
            ) {
              grid[pos.y][pos.x].type = "outdoor_road";
              grid[pos.y][pos.x].tileX = randomInt(0, 3);
              grid[pos.y][pos.x].tileY = randomInt(0, 3);
            }
          }
        });
      }
    });
  });
}

// Apply organic blob growth around the foundation areas
function applyOrganicGrowth(grid, areas) {
  areas.forEach((area) => {
    // Apply organic blob growth around area cells
    const seedCount = Math.min(3, Math.floor(area.cells.length / 8));
    const seeds = area.cells
      .sort(() => Math.random() - 0.5)
      .slice(0, seedCount);
    // Grow blobs from seed points
    for (let iteration = 0; iteration < 2; iteration++) {
      seeds.forEach(({ x, y }) => {
        const directions = [
          [-1, -1],
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
          [1, 1],
        ];
        // Randomly select 4 directions
        const randomDirections = directions
          .sort(() => Math.random() - 0.5)
          .slice(0, 4);
        randomDirections.forEach(([dx, dy]) => {
          const newX = x + dx;
          const newY = y + dy;
          if (
            newX > 0 &&
            newX < GRID_WIDTH - 1 &&
            newY > 0 &&
            newY < GRID_HEIGHT - 1 &&
            Math.random() < 0.6
          ) {
            if (
              grid[newY] &&
              grid[newY][newX] &&
              grid[newY][newX].type === "outdoor_shrub"
            ) {
              grid[newY][newX].type = "outdoor_area";
              grid[newY][newX].tileX = randomInt(0, 3);
              grid[newY][newX].tileY = randomInt(0, 3);
            }
          }
        });
      });
    }
  });
}

// Generate traditional dungeon foundation
function generateTraditionalFoundation() {
  const grid = createEmptyGrid(GRID_WIDTH, GRID_HEIGHT);
  const rooms = generateRooms();
  const corridors = connectRooms(grid, rooms);
  return { grid, rooms, corridors };
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

// Post-generation cleanup to remove isolated single tiles and unreachable areas
function cleanupOutdoorMap(grid) {
  const height = grid.length;
  const width = grid[0].length;

  // Define walkable tile types for outdoor maps
  const walkableTypes = [
    "outdoor_area",
    "outdoor_road",
    "outdoor_lake",
    "outdoor_mountain",
    "outdoor_river",
  ];

  // Helper function to check if a tile is walkable
  const isWalkable = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    return (
      walkableTypes.includes(grid[y][x].type) ||
      (grid[y][x].originalType &&
        walkableTypes.includes(grid[y][x].originalType))
    );
  };

  // Helper function to get adjacent walkable neighbors (north, east, south, west only)
  const getAdjacentWalkableCount = (x, y) => {
    const directions = [
      [0, -1], // north
      [1, 0], // east
      [0, 1], // south
      [-1, 0], // west
    ];
    return directions.filter(([dx, dy]) => isWalkable(x + dx, y + dy)).length;
  };

  // Helper function to get adjacent tiles of same type
  const getAdjacentSameTypeCount = (x, y, tileType) => {
    const directions = [
      [0, -1], // north
      [1, 0], // east
      [0, 1], // south
      [-1, 0], // west
    ];
    return directions.filter(([dx, dy]) => {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) return false;
      return (
        grid[ny][nx].type === tileType ||
        (grid[ny][nx].originalType && grid[ny][nx].originalType === tileType)
      );
    }).length;
  };

  // First pass: Remove isolated single tiles (no adjacent walkable tiles)
  const tilesToRemove = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isWalkable(x, y)) {
        const adjacentCount = getAdjacentWalkableCount(x, y);
        if (adjacentCount === 0) {
          tilesToRemove.push({ x, y });
        }
      }
    }
  }

  // Convert isolated tiles to shrubs
  tilesToRemove.forEach(({ x, y }) => {
    grid[y][x].type = "outdoor_shrub";
    grid[y][x].tileX = randomInt(0, 3);
    grid[y][x].tileY = randomInt(0, 3);
    delete grid[y][x].originalType;
  });

  // Second pass: Remove single-tile areas (areas with only 1 tile)
  const visited = Array.from({ length: height }, () =>
    Array(width).fill(false),
  );

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!visited[y][x] && isWalkable(x, y)) {
        // Flood fill to find connected area
        const area = [];
        const stack = [{ x, y }];
        visited[y][x] = true;

        while (stack.length > 0) {
          const current = stack.pop();
          area.push(current);

          // Check 4-directional neighbors
          const directions = [
            [0, -1],
            [1, 0],
            [0, 1],
            [-1, 0],
          ];

          directions.forEach(([dx, dy]) => {
            const nx = current.x + dx;
            const ny = current.y + dy;

            if (
              nx >= 0 &&
              nx < width &&
              ny >= 0 &&
              ny < height &&
              !visited[ny][nx] &&
              isWalkable(nx, ny)
            ) {
              visited[ny][nx] = true;
              stack.push({ x: nx, y: ny });
            }
          });
        }

        // If area has only 1 tile, convert it to shrub
        if (area.length === 1) {
          const { x: tileX, y: tileY } = area[0];
          grid[tileY][tileX].type = "outdoor_shrub";
          grid[tileY][tileX].tileX = randomInt(0, 3);
          grid[tileY][tileX].tileY = randomInt(0, 3);
          delete grid[tileY][tileX].originalType;
        }
      }
    }
  }

  // Third pass: Aggressively remove single road tiles and small road areas
  const roadTilesToRemove = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        grid[y][x].type === "outdoor_road" ||
        (grid[y][x].originalType && grid[y][x].originalType === "outdoor_road")
      ) {
        const adjacentRoads = getAdjacentSameTypeCount(x, y, "outdoor_road");
        // Remove single road tiles that have no adjacent roads
        if (adjacentRoads === 0) {
          roadTilesToRemove.push({ x, y });
        }
      }
    }
  }

  // Convert single road tiles to shrubs
  roadTilesToRemove.forEach(({ x, y }) => {
    grid[y][x].type = "outdoor_shrub";
    grid[y][x].tileX = randomInt(0, 3);
    grid[y][x].tileY = randomInt(0, 3);
    delete grid[y][x].originalType;
  });

  // Fourth pass: Remove small road areas (less than 3 tiles)
  const roadVisited = Array.from({ length: height }, () =>
    Array(width).fill(false),
  );

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        !roadVisited[y][x] &&
        (grid[y][x].type === "outdoor_road" ||
          (grid[y][x].originalType &&
            grid[y][x].originalType === "outdoor_road"))
      ) {
        // Flood fill to find connected road area
        const roadArea = [];
        const stack = [{ x, y }];
        roadVisited[y][x] = true;

        while (stack.length > 0) {
          const current = stack.pop();
          roadArea.push(current);

          // Check 4-directional neighbors for same road type
          const directions = [
            [0, -1],
            [1, 0],
            [0, 1],
            [-1, 0],
          ];

          directions.forEach(([dx, dy]) => {
            const nx = current.x + dx;
            const ny = current.y + dy;

            if (
              nx >= 0 &&
              nx < width &&
              ny >= 0 &&
              ny < height &&
              !roadVisited[ny][nx] &&
              (grid[ny][nx].type === "outdoor_road" ||
                (grid[ny][nx].originalType &&
                  grid[ny][nx].originalType === "outdoor_road"))
            ) {
              roadVisited[ny][nx] = true;
              stack.push({ x: nx, y: ny });
            }
          });
        }

        // If road area has less than 3 tiles, convert to shrubs
        if (roadArea.length < 3) {
          roadArea.forEach(({ x: tileX, y: tileY }) => {
            grid[tileY][tileX].type = "outdoor_shrub";
            grid[tileY][tileX].tileX = randomInt(0, 3);
            grid[tileY][tileX].tileY = randomInt(0, 3);
            delete grid[tileY][tileX].originalType;
          });
        }
      }
    }
  }
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
    }
  });

  // 9. Generate rivers between lakes (only one river per map)
  if (lakeAreas.length >= 2) {
    const lake1 = lakeAreas[Math.floor(Math.random() * lakeAreas.length)];
    const remainingLakes = lakeAreas.filter((lake) => lake !== lake1);
    const lake2 = remainingLakes[Math.floor(Math.random() * remainingLakes.length)];
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
    walkableTypes: ["outdoor_area", "outdoor_road", "outdoor_lake", "outdoor_mountain", "outdoor_river"],
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

// Hex-based room generation
function generateHexRooms() {
  const rooms = [];
  let attempts = 0;
  while (rooms.length < MAX_ROOMS && attempts < MAX_ATTEMPTS) {
    const width = randomInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
    const height = randomInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
    const x = randomInt(1, GRID_WIDTH - width - 2);
    const y = randomInt(1, GRID_HEIGHT - height - 2);
    const newRoom = { x, y, width, height };
    if (!roomOverlaps(newRoom, rooms)) {
      rooms.push(newRoom);
    }
    attempts++;
  }
  return rooms;
}

// Hex-based organic area generation
function generateHexOrganicArea(room) {
  const cells = [];
  // Base cells from the room
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      cells.push({ x, y });
    }
  }

  // Add organic expansion using hex neighbors
  const expandedCells = [...cells];
  cells.forEach(({ x, y }) => {
    const hex = gridToHexCoords(x, y);
    const neighbors = hexNeighbors(hex);

    neighbors.forEach((neighbor) => {
      const gridPos = hexToGridCoords(neighbor.q, neighbor.r);
      if (
        Math.random() < 0.4 &&
        gridPos.x >= 0 &&
        gridPos.x < GRID_WIDTH &&
        gridPos.y >= 0 &&
        gridPos.y < GRID_HEIGHT
      ) {
        expandedCells.push(gridPos);
      }
    });
  });

  // Remove duplicates
  return expandedCells.filter(
    (cell, index, self) =>
      index === self.findIndex((c) => c.x === cell.x && c.y === cell.y),
  );
}

// Hex-based corridor carving
function carveHexHorizontalCorridor(grid, x1, x2, y) {
  const path = [];
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
    if (
      grid[y][x].type === "outdoor_shrub" ||
      grid[y][x].type === "outdoor_road"
    ) {
      grid[y][x].type = "outdoor_road";
      grid[y][x].tileX = randomInt(0, 3);
      grid[y][x].tileY = randomInt(0, 3);
    }
    path.push({ x, y });
  }
  return path;
}

function carveHexVerticalCorridor(grid, y1, y2, x) {
  const path = [];
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
    if (
      grid[y][x].type === "outdoor_shrub" ||
      grid[y][x].type === "outdoor_road"
    ) {
      grid[y][x].type = "outdoor_road";
      grid[y][x].tileX = randomInt(0, 3);
      grid[y][x].tileY = randomInt(0, 3);
    }
    path.push({ x, y });
  }
  return path;
}

function createHexCorridor(grid, from, to) {
  let path = [];
  if (Math.random() < 0.5) {
    path = path.concat(carveHexHorizontalCorridor(grid, from.x, to.x, from.y));
    path = path.concat(carveHexVerticalCorridor(grid, from.y, to.y, to.x));
  } else {
    path = path.concat(carveHexVerticalCorridor(grid, from.y, to.y, from.x));
    path = path.concat(carveHexHorizontalCorridor(grid, from.x, to.x, to.y));
  }
  return path;
}

function connectHexRooms(grid, rooms) {
  if (rooms.length < 2) return [];
  const corridors = [];
  // Connect each room to the next, and the last to the first (loop)
  for (let i = 0; i < rooms.length; i++) {
    const curr = roomCenter(rooms[i]);
    const next = roomCenter(rooms[(i + 1) % rooms.length]);
    const path = createHexCorridor(grid, curr, next);
    corridors.push({ number: `C${i + 1}`, path });
  }
  return corridors;
}

// Hex-based room transformation
function transformHexRoomsToOutdoorAreas(grid, rooms) {
  let mountainPlaced = false;

  const areas = rooms.map((room, index) => {
    const cells = generateHexOrganicArea(room);

    // Check if this room could be a mountain (max size of 9)
    const isMaxSize =
      room.width === MAX_ROOM_SIZE && room.height === MAX_ROOM_SIZE;
    const isMountain = isMaxSize && !mountainPlaced && Math.random() < 0.5;

    if (isMountain) {
      mountainPlaced = true;
    }

    // 1 in 8 chance this area is water (but not if it's a mountain)
    const isWater = !isMountain && Math.random() < 0.125;

    return { cells, number: `A${index + 1}`, isWater, isMountain };
  });

  // Enhance grid with organic shapes
  areas.forEach((area) => {
    area.cells.forEach(({ x, y }) => {
      if (grid[y] && grid[y][x]) {
        if (area.isMountain) {
          if (
            grid[y][x].type !== "outdoor_mountain" &&
            grid[y][x].type !== "outdoor_river" &&
            grid[y][x].type !== "outdoor_lake"
          ) {
            grid[y][x].type = "outdoor_mountain";
            grid[y][x].tileX = randomInt(0, 3);
            grid[y][x].tileY = randomInt(0, 3);
          }
        } else if (area.isWater) {
          if (
            grid[y][x].type !== "outdoor_mountain" &&
            grid[y][x].type !== "outdoor_river"
          ) {
            grid[y][x].type = "outdoor_lake";
            grid[y][x].tileX = randomInt(0, 3);
            grid[y][x].tileY = randomInt(0, 3);
          }
        } else {
          if (
            grid[y][x].type === "outdoor_shrub" ||
            grid[y][x].type === "outdoor_road"
          ) {
            grid[y][x].type = "outdoor_area";
            grid[y][x].tileX = randomInt(0, 3);
            grid[y][x].tileY = randomInt(0, 3);
          }
        }
      }
    });
  });
  return areas;
}

// Hex-based corridor transformation
function transformHexCorridorsToPaths(grid, corridors) {
  corridors.forEach((corridor) => {
    corridor.path.forEach(({ x, y }) => {
      if (grid[y] && grid[y][x]) {
        // Add adjacent cells using hex neighbors
        const hex = gridToHexCoords(x, y);
        const neighbors = hexNeighbors(hex);

        neighbors.forEach((neighbor) => {
          const gridPos = hexToGridCoords(neighbor.q, neighbor.r);
          if (
            gridPos.x > 0 &&
            gridPos.x < GRID_WIDTH - 1 &&
            gridPos.y > 0 &&
            gridPos.y < GRID_HEIGHT - 1 &&
            Math.random() < 0.5
          ) {
            if (
              grid[gridPos.y] &&
              grid[gridPos.y][gridPos.x] &&
              grid[gridPos.y][gridPos.x].type === "outdoor_shrub"
            ) {
              grid[gridPos.y][gridPos.x].type = "outdoor_road";
              grid[gridPos.y][gridPos.x].tileX = randomInt(0, 3);
              grid[gridPos.y][gridPos.x].tileY = randomInt(0, 3);
            }
          }
        });
      }
    });
  });
}

// Hex-based organic growth
function applyHexOrganicGrowth(grid, areas) {
  areas.forEach((area) => {
    // Apply organic blob growth around area cells
    const seedCount = Math.min(3, Math.floor(area.cells.length / 8));
    const seeds = area.cells
      .sort(() => Math.random() - 0.5)
      .slice(0, seedCount);

    // Grow blobs from seed points using hex neighbors
    for (let iteration = 0; iteration < 2; iteration++) {
      seeds.forEach(({ x, y }) => {
        const hex = gridToHexCoords(x, y);
        const neighbors = hexNeighbors(hex);

        // Randomly select 4 directions
        const randomNeighbors = neighbors
          .sort(() => Math.random() - 0.5)
          .slice(0, 4);

        randomNeighbors.forEach((neighbor) => {
          const gridPos = hexToGridCoords(neighbor.q, neighbor.r);
          if (
            gridPos.x > 0 &&
            gridPos.x < GRID_WIDTH - 1 &&
            gridPos.y > 0 &&
            gridPos.y < GRID_HEIGHT - 1 &&
            Math.random() < 0.6
          ) {
            if (
              grid[gridPos.y] &&
              grid[gridPos.y][gridPos.x] &&
              grid[gridPos.y][gridPos.x].type === "outdoor_shrub"
            ) {
              grid[gridPos.y][gridPos.x].type = "outdoor_area";
              grid[gridPos.y][gridPos.x].tileX = randomInt(0, 3);
              grid[gridPos.y][gridPos.x].tileY = randomInt(0, 3);
            }
          }
        });
      });
    }
  });
}

// Hex-based river carving
function carveHexRiver(grid, from, to, riverType = "outdoor_river", lakeType = "outdoor_lake") {
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

// Hex-based traditional foundation
function generateHexTraditionalFoundation() {
  const grid = createHexEmptyGrid(GRID_WIDTH, GRID_HEIGHT);
  const rooms = generateHexRooms();
  const corridors = connectHexRooms(grid, rooms);
  return { grid, rooms, corridors };
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
    }
  });

  // 9. Generate rivers between lakes (only one river per map)
  if (lakeAreas.length >= 2) {
    const lake1 = lakeAreas[Math.floor(Math.random() * lakeAreas.length)];
    const remainingLakes = lakeAreas.filter((lake) => lake !== lake1);
    const lake2 = remainingLakes[Math.floor(Math.random() * remainingLakes.length)];
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
    walkableTypes: ["outdoor_area", "outdoor_road", "outdoor_lake", "outdoor_mountain", "outdoor_river"],
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
