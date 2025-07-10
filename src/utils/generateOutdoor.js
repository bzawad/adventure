// Outdoor area generation using hybrid approach:
// 1. Generate traditional dungeon foundation (same as caverns)
// 2. Transform rooms to organic outdoor areas
// 3. Widen corridors to natural paths
// 4. Apply organic growth for natural appearance
import { addOutdoorLabels, assignAreaIds } from "./labelUtils";

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

// Main outdoor generation function
export function generateOutdoor(width = GRID_WIDTH, height = GRID_HEIGHT) {
  // Use hybrid approach for reliable connectivity
  const foundation = generateTraditionalFoundation();
  const areas = transformRoomsToOutdoorAreas(foundation.grid, foundation.rooms);
  transformCorridorsToPaths(foundation.grid, foundation.corridors);
  applyOrganicGrowth(foundation.grid, areas);
  // Fill in random tileX/tileY for remaining walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (foundation.grid[y][x].type === "outdoor_shrub") {
        foundation.grid[y][x].tileX = randomInt(0, 3);
        foundation.grid[y][x].tileY = randomInt(0, 3);
      }
    }
  }
  // Add rivers based on map features
  const waterAreas = areas.filter((a) => a.isWater);
  const mountainAreas = areas.filter((a) => a.isMountain);

  // If there's both a mountain and a lake, create a river from mountain to lake
  if (mountainAreas.length > 0 && waterAreas.length > 0) {
    const mountainArea = mountainAreas[0]; // Take the first mountain
    const waterArea = waterAreas[Math.floor(Math.random() * waterAreas.length)]; // Pick a random lake
    const mountainCenter = areaCenter(mountainArea);
    const waterCenter = areaCenter(waterArea);
    carveRiver(foundation.grid, mountainCenter, waterCenter);
  }

  // Add a river between water areas if there are 2+ water areas
  if (waterAreas.length >= 2) {
    // Pick two water areas (randomly)
    const [a1, a2] =
      waterAreas.length === 2
        ? waterAreas
        : [
            waterAreas[0],
            waterAreas[1 + Math.floor(Math.random() * (waterAreas.length - 1))],
          ];
    const c1 = areaCenter(a1);
    const c2 = areaCenter(a2);
    carveRiver(foundation.grid, c1, c2);
  }

  // Generate radiation zone
  const radiationZone = generateRadiationZone(foundation.grid, areas);

  // Assign areaIds to all walkable tiles
  assignAreaIds(foundation.grid, "outdoor_area", "area");
  assignAreaIds(foundation.grid, "outdoor_road", "road");
  assignAreaIds(foundation.grid, "outdoor_lake", "lake");
  assignAreaIds(foundation.grid, "outdoor_mountain", "mountain");
  assignAreaIds(foundation.grid, "outdoor_river", "river");

  // Add labels
  const result = addOutdoorLabels(foundation.grid, areas, waterAreas);

  // Add radiation zone info to the result
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
