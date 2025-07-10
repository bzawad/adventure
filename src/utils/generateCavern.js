// Cavern generation using hybrid approach:
// 1. Generate traditional dungeon foundation
// 2. Transform rooms to organic cavern chambers
// 3. Widen corridors to natural passages
// 4. Apply organic growth for natural appearance
import { addCavernLabels, assignAreaIds } from "./labelUtils";

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

function generateRooms() {
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

function roomCenter(room) {
  return {
    x: room.x + Math.floor(room.width / 2),
    y: room.y + Math.floor(room.height / 2),
  };
}

function carveHorizontalCorridor(grid, x1, x2, y) {
  const path = [];
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
    if (grid[y][x].type === "cavern_wall") {
      grid[y][x].type = "cavern_corridor";
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
    if (grid[y][x].type === "cavern_wall") {
      grid[y][x].type = "cavern_corridor";
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

// Generate organic chamber cells based on traditional room bounds
function generateOrganicChamber(room) {
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

// Transform traditional rooms into organic cavern chambers
function transformRoomsToCaverns(grid, rooms) {
  const caverns = rooms.map((room, index) => {
    const cells = generateOrganicChamber(room);
    return { cells, number: `A${index + 1}` };
  });

  // Enhance grid with organic shapes
  caverns.forEach((cavern) => {
    cavern.cells.forEach(({ x, y }) => {
      if (
        grid[y] &&
        grid[y][x] &&
        (grid[y][x].type === "cavern_wall" ||
          grid[y][x].type === "cavern_corridor")
      ) {
        grid[y][x].type = "cavern_floor";
        grid[y][x].tileX = randomInt(0, 3);
        grid[y][x].tileY = randomInt(0, 3);
      }
    });
  });

  return caverns;
}

// Convert straight corridors into wider, more natural passages
function transformCorridorsToPassages(grid, corridors) {
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
              grid[pos.y][pos.x].type === "cavern_wall"
            ) {
              grid[pos.y][pos.x].type = "cavern_corridor";
              grid[pos.y][pos.x].tileX = randomInt(0, 3);
              grid[pos.y][pos.x].tileY = randomInt(0, 3);
            }
          }
        });
      }
    });
  });
}

// Apply organic blob growth around the foundation caverns
function applyOrganicGrowth(grid, caverns) {
  caverns.forEach((cavern) => {
    // Apply organic blob growth around cavern cells
    const seedCount = Math.min(3, Math.floor(cavern.cells.length / 8));
    const seeds = cavern.cells
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
              grid[newY][newX].type === "cavern_wall"
            ) {
              grid[newY][newX].type = "cavern_floor";
              grid[newY][newX].tileX = randomInt(0, 3);
              grid[newY][newX].tileY = randomInt(0, 3);
            }
          }
        });
      });
    }
  });
}

// Helper: Find center of a cavern
function cavernCenter(cavern) {
  const n = cavern.cells.length;
  const sum = cavern.cells.reduce(
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

// Generate traditional dungeon foundation
function generateTraditionalFoundation() {
  const grid = createEmptyGrid(GRID_WIDTH, GRID_HEIGHT);
  const rooms = generateRooms();
  const corridors = connectRooms(grid, rooms);

  return { grid, rooms, corridors };
}

// Post-generation cleanup to remove isolated single tiles and unreachable areas
function cleanupCavernMap(grid) {
  const height = grid.length;
  const width = grid[0].length;

  // Define walkable tile types for caverns
  const walkableTypes = [
    "cavern_floor",
    "cavern_corridor",
    "cavern_lake",
    "cavern_river",
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

  // Convert isolated tiles to walls
  tilesToRemove.forEach(({ x, y }) => {
    grid[y][x].type = "cavern_wall";
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

        // If area has only 1 tile, convert it to wall
        if (area.length === 1) {
          const { x: tileX, y: tileY } = area[0];
          grid[tileY][tileX].type = "cavern_wall";
          grid[tileY][tileX].tileX = randomInt(0, 3);
          grid[tileY][tileX].tileY = randomInt(0, 3);
          delete grid[tileY][tileX].originalType;
        }
      }
    }
  }

  // Third pass: Aggressively remove single corridor tiles
  const corridorTilesToRemove = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        grid[y][x].type === "cavern_corridor" ||
        (grid[y][x].originalType &&
          grid[y][x].originalType === "cavern_corridor")
      ) {
        const adjacentCorridors = getAdjacentSameTypeCount(
          x,
          y,
          "cavern_corridor",
        );
        // Remove single corridor tiles that have no adjacent corridors
        if (adjacentCorridors === 0) {
          corridorTilesToRemove.push({ x, y });
        }
      }
    }
  }

  // Convert single corridor tiles to walls
  corridorTilesToRemove.forEach(({ x, y }) => {
    grid[y][x].type = "cavern_wall";
    grid[y][x].tileX = randomInt(0, 3);
    grid[y][x].tileY = randomInt(0, 3);
    delete grid[y][x].originalType;
  });

  // Fourth pass: Remove small corridor areas (less than 3 tiles)
  const corridorVisited = Array.from({ length: height }, () =>
    Array(width).fill(false),
  );

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        !corridorVisited[y][x] &&
        (grid[y][x].type === "cavern_corridor" ||
          (grid[y][x].originalType &&
            grid[y][x].originalType === "cavern_corridor"))
      ) {
        // Flood fill to find connected corridor area
        const corridorArea = [];
        const stack = [{ x, y }];
        corridorVisited[y][x] = true;

        while (stack.length > 0) {
          const current = stack.pop();
          corridorArea.push(current);

          // Check 4-directional neighbors for same corridor type
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
              !corridorVisited[ny][nx] &&
              (grid[ny][nx].type === "cavern_corridor" ||
                (grid[ny][nx].originalType &&
                  grid[ny][nx].originalType === "cavern_corridor"))
            ) {
              corridorVisited[ny][nx] = true;
              stack.push({ x: nx, y: ny });
            }
          });
        }

        // If corridor area has less than 3 tiles, convert to walls
        if (corridorArea.length < 3) {
          corridorArea.forEach(({ x: tileX, y: tileY }) => {
            grid[tileY][tileX].type = "cavern_wall";
            grid[tileY][tileX].tileX = randomInt(0, 3);
            grid[tileY][tileX].tileY = randomInt(0, 3);
            delete grid[tileY][tileX].originalType;
          });
        }
      }
    }
  }
}

// Main cavern generation function
export function generateCavern(width = GRID_WIDTH, height = GRID_HEIGHT) {
  // Use hybrid approach for reliable connectivity
  const foundation = generateTraditionalFoundation();
  const caverns = transformRoomsToCaverns(foundation.grid, foundation.rooms);
  transformCorridorsToPassages(foundation.grid, foundation.corridors);
  applyOrganicGrowth(foundation.grid, caverns);

  // Add lakes to some caverns (similar to outdoor lakes)
  const lakeCaverns = [];
  caverns.forEach((cavern) => {
    // 30% chance for a cavern to become a lake
    if (Math.random() < 0.3) {
      cavern.cells.forEach(({ x, y }) => {
        if (foundation.grid[y] && foundation.grid[y][x]) {
          foundation.grid[y][x].type = "cavern_lake";
          foundation.grid[y][x].tileX = randomInt(0, 3);
          foundation.grid[y][x].tileY = randomInt(0, 3);
        }
      });
      lakeCaverns.push(cavern);
    }
  });

  // Generate rivers between lakes (only one river per map)
  if (lakeCaverns.length >= 2) {
    // Randomly select two different lake caverns
    const lake1 = lakeCaverns[Math.floor(Math.random() * lakeCaverns.length)];
    const remainingLakes = lakeCaverns.filter((lake) => lake !== lake1);
    const lake2 =
      remainingLakes[Math.floor(Math.random() * remainingLakes.length)];

    const center1 = cavernCenter(lake1);
    const center2 = cavernCenter(lake2);
    carveRiver(foundation.grid, center1, center2);
  }

  // Fill in random tileX/tileY for remaining walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (foundation.grid[y][x].type === "cavern_wall") {
        foundation.grid[y][x].tileX = randomInt(0, 3);
        foundation.grid[y][x].tileY = randomInt(0, 3);
      }
    }
  }

  // Cleanup isolated tiles and unreachable areas
  cleanupCavernMap(foundation.grid);

  // Assign areaIds to all walkable tiles
  assignAreaIds(foundation.grid, "cavern_floor", "chamber");
  assignAreaIds(foundation.grid, "cavern_corridor", "corridor");
  assignAreaIds(foundation.grid, "cavern_lake", "lake");
  assignAreaIds(foundation.grid, "cavern_river", "river");

  // Add labels
  return addCavernLabels(foundation.grid, caverns, lakeCaverns);
}

// Returns CSS background-position for a 4x4 tileset (32px tiles)
export function getTileBackgroundPosition(tileX, tileY) {
  const size = 32; // each tile is 32x32px
  return `${-tileX * size}px ${-tileY * size}px`;
}
