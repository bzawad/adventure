import { TILE_CONFIG } from "../config/tileConfig";

// Utility functions for adding labels to walkable areas

// Find the center of a room
export function roomCenter(room) {
  return {
    x: Math.floor(room.x + room.width / 2),
    y: Math.floor(room.y + room.height / 2),
  };
}

// Find the center of a cavern (collection of cells)
export function cavernCenter(cavern) {
  const n = cavern.cells.length;
  const sum = cavern.cells.reduce(
    (acc, cell) => ({ x: acc.x + cell.x, y: acc.y + cell.y }),
    { x: 0, y: 0 },
  );
  return { x: Math.round(sum.x / n), y: Math.round(sum.y / n) };
}

// Find a suitable position for a label near the center
export function findLabelPosition(grid, centerX, centerY, maxDistance = 3) {
  // Validate inputs
  if (!grid || !Array.isArray(grid) || grid.length === 0) return null;
  if (typeof centerX !== "number" || typeof centerY !== "number") return null;

  // Try the center first
  if (isValidLabelPosition(grid, centerX, centerY)) {
    return { x: centerX, y: centerY };
  }

  // Try positions in expanding circles around the center
  for (let distance = 1; distance <= maxDistance; distance++) {
    for (let dx = -distance; dx <= distance; dx++) {
      for (let dy = -distance; dy <= distance; dy++) {
        // Only check positions at the current distance
        if (Math.abs(dx) === distance || Math.abs(dy) === distance) {
          const x = centerX + dx;
          const y = centerY + dy;
          if (isValidLabelPosition(grid, x, y)) {
            return { x, y };
          }
        }
      }
    }
  }

  return null; // No suitable position found
}

// Check if a position is valid for placing a label
export function isValidLabelPosition(grid, x, y) {
  // Validate inputs
  if (!grid || !Array.isArray(grid) || grid.length === 0) return false;
  if (typeof x !== "number" || typeof y !== "number") return false;

  // Check bounds
  if (x < 0 || y < 0 || y >= grid.length || x >= grid[0].length) {
    return false;
  }

  const tile = grid[y][x];
  if (!tile) {
    return false;
  }

  // Use config to check walkability
  const config = TILE_CONFIG[tile.type];
  return config && config.walkable && !tile.type.includes("_label");
}

// Add labels to dungeon rooms and corridors
export function addDungeonLabels(grid, rooms) {
  const newGrid = JSON.parse(JSON.stringify(grid)); // Deep copy

  // Add room labels (areaId already assigned during generation)
  rooms.forEach((room, index) => {
    // Collect all room floor positions
    const positions = [];
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (newGrid[y][x].type === "dungeon_floor") {
          positions.push({ x, y });
        }
      }
    }
    const position = findLabelPositionForType(
      newGrid,
      positions,
      "dungeon_floor",
    );
    if (position) {
      newGrid[position.y][position.x].label = `R${index + 1}`;
    }
  });

  // Add corridor labels - group by areaId
  const corridorPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (newGrid[y][x].type === "dungeon_corridor") {
        corridorPositions.push({ x, y });
      }
    }
  }
  const corridorAreas = groupByAreaId(newGrid, corridorPositions, "corridor");
  corridorAreas.forEach((corridor, index) => {
    const position = findLabelPositionForType(
      newGrid,
      corridor,
      "dungeon_corridor",
    );
    if (position) {
      newGrid[position.y][position.x].label = `C${index + 1}`;
    }
  });

  return newGrid;
}

// Helper function to group positions by their areaId
function groupByAreaId(grid, positions, areaIdPrefix) {
  const groups = {};

  positions.forEach(({ x, y }) => {
    const tile = grid[y][x];
    if (tile.areaId && tile.areaId.startsWith(areaIdPrefix)) {
      if (!groups[tile.areaId]) {
        groups[tile.areaId] = [];
      }
      groups[tile.areaId].push({ x, y });
    }
  });

  return Object.values(groups);
}

// Add labels to cavern chambers, tunnels, lakes, and rivers
export function addCavernLabels(grid) {
  const newGrid = JSON.parse(JSON.stringify(grid));

  // Add chamber labels - group by areaId
  const chamberPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (newGrid[y][x].type === "cavern_floor") {
        chamberPositions.push({ x, y });
      }
    }
  }
  const chambers = groupByAreaId(newGrid, chamberPositions, "chamber");
  chambers.forEach((chamber, index) => {
    const position = findLabelPositionForType(newGrid, chamber, "cavern_floor");
    if (position) {
      newGrid[position.y][position.x].label = `C${index + 1}`;
    }
  });

  // Add tunnel labels - group by areaId
  const corridorPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (
        newGrid[y][x].type === "cavern_corridor" ||
        (newGrid[y][x].originalType &&
          newGrid[y][x].originalType === "cavern_corridor")
      ) {
        corridorPositions.push({ x, y });
      }
    }
  }
  const tunnels = groupByAreaId(newGrid, corridorPositions, "corridor");
  tunnels.forEach((tunnel, index) => {
    // Find a position that's actually a corridor tile (not a river) for the label
    const position = tunnel.find(
      ({ x, y }) => newGrid[y][x].type === "cavern_corridor",
    );
    if (position) {
      newGrid[position.y][position.x].label = `T${index + 1}`;
    }
  });

  // Add lake labels - group by areaId
  const lakePositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (newGrid[y][x].type === "cavern_lake") {
        lakePositions.push({ x, y });
      }
    }
  }
  const lakes = groupByAreaId(newGrid, lakePositions, "lake");
  lakes.forEach((lake, index) => {
    const position = findLabelPositionForType(newGrid, lake, "cavern_lake");
    if (position) {
      newGrid[position.y][position.x].label = `L${index + 1}`;
    }
  });

  // Add river labels - group by areaId
  const riverPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (newGrid[y][x].type === "cavern_river") {
        riverPositions.push({ x, y });
      }
    }
  }
  const rivers = groupByAreaId(newGrid, riverPositions, "river");
  rivers.forEach((river, index) => {
    const position = findLabelPositionForType(newGrid, river, "cavern_river");
    if (position) {
      newGrid[position.y][position.x].label = `V${index + 1}`;
    }
  });

  return newGrid;
}

// Add labels to outdoor areas, roads, lakes, and rivers
export function addOutdoorLabels(grid, rooms, lakeRooms = []) {
  const newGrid = JSON.parse(JSON.stringify(grid));

  // Add area labels (skip if all cells are lake tiles, or if area contains mountains)
  rooms.forEach((room, index) => {
    const area = room.cells ? room : null;
    const cells = area ? area.cells : [];
    const allLake = cells.every(
      ({ x, y }) => newGrid[y][x].type === "outdoor_lake",
    );
    const hasMountains = cells.some(
      ({ x, y }) => newGrid[y][x].type === "outdoor_mountain",
    );
    if (allLake || hasMountains) return;
    const positions = cells.filter(
      ({ x, y }) => newGrid[y][x].type === "outdoor_area",
    );
    const position = findLabelPositionForType(
      newGrid,
      positions,
      "outdoor_area",
    );
    if (position) {
      newGrid[position.y][position.x].label = `A${index + 1}`;
    }
  });

  // Add mountain labels - group by areaId
  const mountainPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (newGrid[y][x].type === "outdoor_mountain") {
        mountainPositions.push({ x, y });
      }
    }
  }
  const mountains = groupByAreaId(newGrid, mountainPositions, "mountain");
  mountains.forEach((mountain, index) => {
    const position = findLabelPositionForType(
      newGrid,
      mountain,
      "outdoor_mountain",
    );
    if (position) {
      newGrid[position.y][position.x].label = `M${index + 1}`;
    }
  });

  // Add road labels - group by areaId
  const roadPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (
        newGrid[y][x].type === "outdoor_road" ||
        (newGrid[y][x].originalType &&
          newGrid[y][x].originalType === "outdoor_road")
      ) {
        roadPositions.push({ x, y });
      }
    }
  }
  const roads = groupByAreaId(newGrid, roadPositions, "road");
  roads.forEach((road, index) => {
    const position = road.find(
      ({ x, y }) => newGrid[y][x].type === "outdoor_road",
    );
    if (position) {
      newGrid[position.y][position.x].label = `R${index + 1}`;
    }
  });

  // Add lake labels
  lakeRooms.forEach((lake, index) => {
    let cells;
    if (lake.cells) {
      cells = lake.cells;
    } else {
      cells = [];
      for (let y = lake.y; y < lake.y + lake.height; y++) {
        for (let x = lake.x; x < lake.x + lake.width; x++) {
          cells.push({ x, y });
        }
      }
    }
    const positions = cells.filter(
      ({ x, y }) => newGrid[y][x].type === "outdoor_lake",
    );
    const position = findLabelPositionForType(
      newGrid,
      positions,
      "outdoor_lake",
    );
    if (position) {
      newGrid[position.y][position.x].label = `L${index + 1}`;
    }
  });

  // Add river labels - group by areaId
  const riverPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (newGrid[y][x].type === "outdoor_river") {
        riverPositions.push({ x, y });
      }
    }
  }
  const rivers = groupByAreaId(newGrid, riverPositions, "river");
  rivers.forEach((river, index) => {
    const position = findLabelPositionForType(newGrid, river, "outdoor_river");
    if (position) {
      newGrid[position.y][position.x].label = `V${index + 1}`;
    }
  });

  return newGrid;
}

// Add labels to city roads and buildings
export function addCityLabels(grid) {
  const newGrid = JSON.parse(JSON.stringify(grid));

  // Add road labels - group by areaId
  const roadPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (newGrid[y][x].type === "city_road") {
        roadPositions.push({ x, y });
      }
    }
  }
  const roads = groupByAreaId(newGrid, roadPositions, "road");
  roads.forEach((road, index) => {
    const position = findLabelPositionForType(newGrid, road, "city_road");
    if (position) {
      newGrid[position.y][position.x].label = `R${index + 1}`;
    }
  });

  // Add building labels - group by areaId
  const buildingPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (newGrid[y][x].type === "city_floor") {
        buildingPositions.push({ x, y });
      }
    }
  }
  const buildings = groupByAreaId(newGrid, buildingPositions, "building");
  buildings.forEach((building, index) => {
    const position = findLabelPositionForType(newGrid, building, "city_floor");
    if (position) {
      newGrid[position.y][position.x].label = `B${index + 1}`;
    }
  });

  return newGrid;
}

// Helper: Find a suitable position for a label in a group of positions, only on the correct tile type
function findLabelPositionForType(grid, positions, requiredType) {
  // Try the center first
  const n = positions.length;
  const center = positions[Math.floor(n / 2)];
  if (center && grid[center.y][center.x].type === requiredType) {
    return center;
  }
  // Try all positions
  for (const pos of positions) {
    if (grid[pos.y][pos.x].type === requiredType) {
      return pos;
    }
  }
  return null;
}

// Utility: Assign areaIds to all contiguous regions of a given typePrefix
export function assignAreaIds(grid, typePrefix, idPrefix) {
  const height = grid.length;
  const width = grid[0].length;
  const visited = Array.from({ length: height }, () =>
    Array(width).fill(false),
  );
  let areaCount = 0;

  function floodFill(sx, sy) {
    const stack = [{ x: sx, y: sy }];
    const cells = [];
    visited[sy][sx] = true;
    while (stack.length > 0) {
      const { x, y } = stack.pop();
      cells.push({ x, y });
      [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 },
      ].forEach(({ x: nx, y: ny }) => {
        if (
          nx >= 0 &&
          nx < width &&
          ny >= 0 &&
          ny < height &&
          !visited[ny][nx] &&
          (grid[ny][nx].type.startsWith(typePrefix) ||
            (grid[ny][nx].originalType &&
              grid[ny][nx].originalType.startsWith(typePrefix)))
        ) {
          visited[ny][nx] = true;
          stack.push({ x: nx, y: ny });
        }
      });
    }
    return cells;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        !visited[y][x] &&
        (grid[y][x].type.startsWith(typePrefix) ||
          (grid[y][x].originalType &&
            grid[y][x].originalType.startsWith(typePrefix)))
      ) {
        areaCount++;
        const areaId = `${idPrefix}-${areaCount}`;
        const cells = floodFill(x, y);
        cells.forEach(({ x, y }) => {
          grid[y][x].areaId = areaId;
        });
      }
    }
  }
}
