// City map generation using a grid-based urban layout algorithm:
// 1. Fill entire map with shrubs (non-walkable)
// 2. Divide map into uniform grid of rectangular building blocks
// 3. Carve 2-tile wide roads between blocks
// 4. Place buildings in 70% of blocks with doors connecting to roads
import { addCityLabels, assignAreaIds } from "./labelUtils";

const GRID_WIDTH = 60;
const GRID_HEIGHT = 60;
const BLOCK_WIDTH = 12;
const BLOCK_HEIGHT = 10;
const ROAD_WIDTH = 2;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createEmptyGrid(width, height, fillType = "city_shrub") {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      type: fillType,
      tileX: 0,
      tileY: 0,
    })),
  );
}

function calculateBuildingBlocks(width, height) {
  const blocksX = Math.floor((width - ROAD_WIDTH) / (BLOCK_WIDTH + ROAD_WIDTH));
  const blocksY = Math.floor(
    (height - ROAD_WIDTH) / (BLOCK_HEIGHT + ROAD_WIDTH),
  );
  const blocks = [];
  for (let bx = 0; bx < blocksX; bx++) {
    for (let by = 0; by < blocksY; by++) {
      const x = bx * (BLOCK_WIDTH + ROAD_WIDTH) + ROAD_WIDTH;
      const y = by * (BLOCK_HEIGHT + ROAD_WIDTH) + ROAD_WIDTH;
      blocks.push({
        x,
        y,
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        block_x: bx,
        block_y: by,
      });
    }
  }
  return blocks;
}

function carveRoads(grid, blocks, width, height) {
  // Carve horizontal roads
  const roadYPositions = [0];
  blocks.forEach((block) => {
    roadYPositions.push(block.y - ROAD_WIDTH, block.y + block.height);
  });
  const uniqueY = [...new Set(roadYPositions)].filter(
    (y) => y >= 0 && y < height - ROAD_WIDTH + 1,
  );
  uniqueY.forEach((y) => {
    for (let roadY = y; roadY < y + ROAD_WIDTH; roadY++) {
      if (roadY >= 0 && roadY < height) {
        for (let x = 0; x < width; x++) {
          if (grid[roadY][x].type === "city_shrub") {
            grid[roadY][x].type = "city_road";
          }
        }
      }
    }
  });
  // Carve vertical roads
  const roadXPositions = [0];
  blocks.forEach((block) => {
    roadXPositions.push(block.x - ROAD_WIDTH, block.x + block.width);
  });
  const uniqueX = [...new Set(roadXPositions)].filter(
    (x) => x >= 0 && x < width - ROAD_WIDTH + 1,
  );
  uniqueX.forEach((x) => {
    for (let roadX = x; roadX < x + ROAD_WIDTH; roadX++) {
      if (roadX >= 0 && roadX < width) {
        for (let y = 0; y < height; y++) {
          if (grid[y][roadX].type === "city_shrub") {
            grid[y][roadX].type = "city_road";
          }
        }
      }
    }
  });
}

function placeBuildings(grid, blocks) {
  const placedBuildings = [];
  blocks.forEach((block) => {
    if (Math.random() <= 0.7) {
      // Place building (70% chance)
      const minBuildingWidth = 4;
      const minBuildingHeight = 4;
      const maxBuildingWidth = block.width - 2;
      const maxBuildingHeight = block.height - 2;
      const buildingWidth = randomInt(minBuildingWidth, maxBuildingWidth);
      const buildingHeight = randomInt(minBuildingHeight, maxBuildingHeight);
      const buildingX = block.x + Math.floor((block.width - buildingWidth) / 2);
      const buildingY =
        block.y + Math.floor((block.height - buildingHeight) / 2);
      // Place floor tiles in the interior
      const floorCells = [];
      for (let x = buildingX + 1; x < buildingX + buildingWidth - 1; x++) {
        for (let y = buildingY + 1; y < buildingY + buildingHeight - 1; y++) {
          if (
            grid[y][x].type === "city_shrub" ||
            grid[y][x].type === "city_road" ||
            grid[y][x].type === "city_wall"
          ) {
            grid[y][x].type = "city_floor";
            grid[y][x].tileX = randomInt(0, 3);
            grid[y][x].tileY = randomInt(0, 3);
            floorCells.push({ x, y });
          }
        }
      }
      // Place wall tiles around the perimeter
      const wallCells = [];
      for (let x = buildingX; x < buildingX + buildingWidth; x++) {
        wallCells.push({ x, y: buildingY });
        wallCells.push({ x, y: buildingY + buildingHeight - 1 });
      }
      for (let y = buildingY; y < buildingY + buildingHeight; y++) {
        wallCells.push({ x: buildingX, y });
        wallCells.push({ x: buildingX + buildingWidth - 1, y });
      }
      // Exclude corners for possible doors
      const possibleDoors = wallCells.filter(({ x, y }) => {
        const isLeft =
          x === buildingX &&
          y > buildingY &&
          y < buildingY + buildingHeight - 1;
        const isRight =
          x === buildingX + buildingWidth - 1 &&
          y > buildingY &&
          y < buildingY + buildingHeight - 1;
        const isTop =
          y === buildingY && x > buildingX && x < buildingX + buildingWidth - 1;
        const isBottom =
          y === buildingY + buildingHeight - 1 &&
          x > buildingX &&
          x < buildingX + buildingWidth - 1;
        return isLeft || isRight || isTop || isBottom;
      });
      // Pick a random door and determine its side
      const door = possibleDoors[randomInt(0, possibleDoors.length - 1)];
      let doorSide = null;
      if (door.y === buildingY) doorSide = "top";
      else if (door.y === buildingY + buildingHeight - 1) doorSide = "bottom";
      else if (door.x === buildingX) doorSide = "left";
      else if (door.x === buildingX + buildingWidth - 1) doorSide = "right";
      // Place the door (as road)
      if (door) {
        if (
          grid[door.y][door.x].type === "city_shrub" ||
          grid[door.y][door.x].type === "city_wall"
        ) {
          grid[door.y][door.x].type = "city_road";
        }
        // Carve a path from the door to the nearest road
        carvePathToRoad(grid, door, doorSide, grid[0].length, grid.length);
      }
      // Place wall tiles (skip door)
      wallCells.forEach(({ x, y }) => {
        if (!door || x !== door.x || y !== door.y) {
          if (grid[y][x].type !== "city_floor") {
            grid[y][x].type = "city_wall";
            grid[y][x].tileX = randomInt(0, 3);
            grid[y][x].tileY = randomInt(0, 3);
          }
        }
      });
      placedBuildings.push({
        type: "building",
        x: buildingX,
        y: buildingY,
        width: buildingWidth,
        height: buildingHeight,
        floorCells,
        wallCells,
        door,
      });
    }
  });
  return placedBuildings;
}

// Carve a straight path from the door to the nearest road tile in the direction the door faces
function carvePathToRoad(grid, door, side, width, height) {
  let { x, y } = door;
  if (side === "top") {
    for (let yy = y - 1; yy >= 0; yy--) {
      if (grid[yy][x].type === "city_road") break;
      if (
        grid[yy][x].type === "city_shrub" ||
        grid[yy][x].type === "city_wall"
      ) {
        grid[yy][x].type = "city_road";
      }
    }
  } else if (side === "bottom") {
    for (let yy = y + 1; yy < height; yy++) {
      if (grid[yy][x].type === "city_road") break;
      if (
        grid[yy][x].type === "city_shrub" ||
        grid[yy][x].type === "city_wall"
      ) {
        grid[yy][x].type = "city_road";
      }
    }
  } else if (side === "left") {
    for (let xx = x - 1; xx >= 0; xx--) {
      if (grid[y][xx].type === "city_road") break;
      if (
        grid[y][xx].type === "city_shrub" ||
        grid[y][xx].type === "city_wall"
      ) {
        grid[y][xx].type = "city_road";
      }
    }
  } else if (side === "right") {
    for (let xx = x + 1; xx < width; xx++) {
      if (grid[y][xx].type === "city_road") break;
      if (
        grid[y][xx].type === "city_shrub" ||
        grid[y][xx].type === "city_wall"
      ) {
        grid[y][xx].type = "city_road";
      }
    }
  }
}

// Add organic variation to shrub/road boundaries
function addShrubRoadVariation(grid) {
  const height = grid.length;
  const width = grid[0].length;
  // Collect all shrub positions before making any changes
  const shrubPositions = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].type === "city_shrub") {
        shrubPositions.push({ x, y });
      }
    }
  }
  // For each shrub, check if adjacent to a road
  shrubPositions.forEach(({ x, y }) => {
    const neighbors = [
      [x, y - 1], // up
      [x, y + 1], // down
      [x - 1, y], // left
      [x + 1, y], // right
    ];
    const isAdjacentToRoad = neighbors.some(
      ([nx, ny]) =>
        nx >= 0 &&
        nx < width &&
        ny >= 0 &&
        ny < height &&
        grid[ny][nx].type === "city_road",
    );
    if (isAdjacentToRoad && Math.random() < 0.2) {
      grid[y][x].type = "city_road";
    }
  });
}

export function generateCity(width = GRID_WIDTH, height = GRID_HEIGHT) {
  // 1. Fill entire map with shrubs
  const grid = createEmptyGrid(width, height, "city_shrub");
  // 2. Divide map into uniform grid of rectangular building blocks
  const blocks = calculateBuildingBlocks(width, height);
  // 3. Carve 2-tile wide roads between blocks
  carveRoads(grid, blocks, width, height);
  // 4. Place buildings in 70% of blocks
  const placedBuildings = placeBuildings(grid, blocks);
  // Fill in random tileX/tileY for all tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].tileX === 0 && grid[y][x].tileY === 0) {
        grid[y][x].tileX = randomInt(0, 3);
        grid[y][x].tileY = randomInt(0, 3);
      }
    }
  }
  // Add organic shrub/road boundary variation
  addShrubRoadVariation(grid);
  // Assign areaIds to all walkable tiles
  assignAreaIds(grid, "city_floor", "building");
  assignAreaIds(grid, "city_road", "road");
  // Add labels
  return addCityLabels(grid, placedBuildings);
}

// Returns CSS background-position for a 4x4 tileset (32px tiles)
export function getTileBackgroundPosition(tileX, tileY) {
  const size = 32; // each tile is 32x32px
  return `${-tileX * size}px ${-tileY * size}px`;
}
