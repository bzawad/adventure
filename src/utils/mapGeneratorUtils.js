// Shared generic map generation and cleanup utilities for both outdoor and cavern maps (square and hex)
// All logic is parameterized by tile type and options.

export function generateGenericRooms({
  minRoomSize,
  maxRoomSize,
  maxRooms,
  maxAttempts,
  gridWidth,
  gridHeight,
  roomOverlaps,
  randomInt,
}) {
  const rooms = [];
  let attempts = 0;
  while (rooms.length < maxRooms && attempts < maxAttempts) {
    const width = randomInt(minRoomSize, maxRoomSize);
    const height = randomInt(minRoomSize, maxRoomSize);
    const x = randomInt(1, gridWidth - width - 2);
    const y = randomInt(1, gridHeight - height - 2);
    const newRoom = { x, y, width, height };
    if (!roomOverlaps(newRoom, rooms)) {
      rooms.push(newRoom);
    }
    attempts++;
  }
  return rooms;
}

// Generic organic area/cavern growth
export function generateGenericOrganicArea(room, gridWidth, gridHeight) {
  const cells = [];
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      cells.push({ x, y });
    }
  }
  const expandedCells = [...cells];
  cells.forEach(({ x, y }) => {
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
        pos.x < gridWidth &&
        pos.y >= 0 &&
        pos.y < gridHeight
      ) {
        expandedCells.push(pos);
      }
    });
  });
  return expandedCells.filter(
    (cell, index, self) =>
      index === self.findIndex((c) => c.x === cell.x && c.y === cell.y),
  );
}

// Generic corridor/path carving for square grids
export function carveGenericCorridor(
  grid,
  from,
  to,
  { wallType, corridorType, randomInt, carveHorizontalFirst = true },
) {
  let path = [];
  if (carveHorizontalFirst ? Math.random() < 0.5 : Math.random() >= 0.5) {
    // Horizontal then vertical
    for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) {
      if (
        grid[from.y][x].type === wallType ||
        grid[from.y][x].type === corridorType
      ) {
        grid[from.y][x].type = corridorType;
        grid[from.y][x].tileX = randomInt(0, 3);
        grid[from.y][x].tileY = randomInt(0, 3);
      }
      path.push({ x, y: from.y });
    }
    for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y++) {
      if (
        grid[y][to.x].type === wallType ||
        grid[y][to.x].type === corridorType
      ) {
        grid[y][to.x].type = corridorType;
        grid[y][to.x].tileX = randomInt(0, 3);
        grid[y][to.x].tileY = randomInt(0, 3);
      }
      path.push({ x: to.x, y });
    }
  } else {
    // Vertical then horizontal
    for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y++) {
      if (
        grid[y][from.x].type === wallType ||
        grid[y][from.x].type === corridorType
      ) {
        grid[y][from.x].type = corridorType;
        grid[y][from.x].tileX = randomInt(0, 3);
        grid[y][from.x].tileY = randomInt(0, 3);
      }
      path.push({ x: from.x, y });
    }
    for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) {
      if (
        grid[to.y][x].type === wallType ||
        grid[to.y][x].type === corridorType
      ) {
        grid[to.y][x].type = corridorType;
        grid[to.y][x].tileX = randomInt(0, 3);
        grid[to.y][x].tileY = randomInt(0, 3);
      }
      path.push({ x, y: to.y });
    }
  }
  return path;
}

// Generic corridor/path carving for hex grids
export function carveGenericHexCorridor(
  grid,
  from,
  to,
  { wallType, corridorType, randomInt, carveHorizontalFirst = true },
) {
  let path = [];
  if (carveHorizontalFirst ? Math.random() < 0.5 : Math.random() >= 0.5) {
    // Horizontal then vertical
    for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) {
      if (
        grid[from.y][x].type === wallType ||
        grid[from.y][x].type === corridorType
      ) {
        grid[from.y][x].type = corridorType;
        grid[from.y][x].tileX = randomInt(0, 3);
        grid[from.y][x].tileY = randomInt(0, 3);
      }
      path.push({ x, y: from.y });
    }
    for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y++) {
      if (
        grid[y][to.x].type === wallType ||
        grid[y][to.x].type === corridorType
      ) {
        grid[y][to.x].type = corridorType;
        grid[y][to.x].tileX = randomInt(0, 3);
        grid[y][to.x].tileY = randomInt(0, 3);
      }
      path.push({ x: to.x, y });
    }
  } else {
    // Vertical then horizontal
    for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y++) {
      if (
        grid[y][from.x].type === wallType ||
        grid[y][from.x].type === corridorType
      ) {
        grid[y][from.x].type = corridorType;
        grid[y][from.x].tileX = randomInt(0, 3);
        grid[y][from.x].tileY = randomInt(0, 3);
      }
      path.push({ x: from.x, y });
    }
    for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) {
      if (
        grid[to.y][x].type === wallType ||
        grid[to.y][x].type === corridorType
      ) {
        grid[to.y][x].type = corridorType;
        grid[to.y][x].tileX = randomInt(0, 3);
        grid[to.y][x].tileY = randomInt(0, 3);
      }
      path.push({ x, y: to.y });
    }
  }
  return path;
}

// Generic organic blob growth for square grids
export function applyGenericOrganicGrowth(
  grid,
  areas,
  { shrubType, areaType, randomInt, gridWidth, gridHeight },
) {
  areas.forEach((area) => {
    const seedCount = Math.min(3, Math.floor(area.cells.length / 8));
    const seeds = area.cells
      .sort(() => Math.random() - 0.5)
      .slice(0, seedCount);
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
        const randomDirections = directions
          .sort(() => Math.random() - 0.5)
          .slice(0, 4);
        randomDirections.forEach(([dx, dy]) => {
          const newX = x + dx;
          const newY = y + dy;
          if (
            newX > 0 &&
            newX < gridWidth - 1 &&
            newY > 0 &&
            newY < gridHeight - 1 &&
            Math.random() < 0.6
          ) {
            if (
              grid[newY] &&
              grid[newY][newX] &&
              grid[newY][newX].type === shrubType
            ) {
              grid[newY][newX].type = areaType;
              grid[newY][newX].tileX = randomInt(0, 3);
              grid[newY][newX].tileY = randomInt(0, 3);
            }
          }
        });
      });
    }
  });
}

// Generic organic blob growth for hex grids
export function applyGenericHexOrganicGrowth(
  grid,
  areas,
  {
    shrubType,
    areaType,
    randomInt,
    gridWidth,
    gridHeight,
    gridToHexCoords,
    hexNeighbors,
    hexToGridCoords,
  },
) {
  areas.forEach((area) => {
    const seedCount = Math.min(3, Math.floor(area.cells.length / 8));
    const seeds = area.cells
      .sort(() => Math.random() - 0.5)
      .slice(0, seedCount);
    for (let iteration = 0; iteration < 2; iteration++) {
      seeds.forEach(({ x, y }) => {
        const hex = gridToHexCoords(x, y);
        const neighbors = hexNeighbors(hex);
        const randomNeighbors = neighbors
          .sort(() => Math.random() - 0.5)
          .slice(0, 4);
        randomNeighbors.forEach((neighbor) => {
          const gridPos = hexToGridCoords(neighbor.q, neighbor.r);
          if (
            gridPos.x > 0 &&
            gridPos.x < gridWidth - 1 &&
            gridPos.y > 0 &&
            gridPos.y < gridHeight - 1 &&
            Math.random() < 0.6
          ) {
            if (
              grid[gridPos.y] &&
              grid[gridPos.y][gridPos.x] &&
              grid[gridPos.y][gridPos.x].type === shrubType
            ) {
              grid[gridPos.y][gridPos.x].type = areaType;
              grid[gridPos.y][gridPos.x].tileX = randomInt(0, 3);
              grid[gridPos.y][gridPos.x].tileY = randomInt(0, 3);
            }
          }
        });
      });
    }
  });
}

// Shared utility: Widen/organically grow corridors/paths for square grids
export function widenCorridorsOrPaths(
  grid,
  corridors,
  { shrubType, corridorType, randomInt, gridWidth, gridHeight },
) {
  corridors.forEach((corridor) => {
    corridor.path.forEach(({ x, y }) => {
      const adjacent = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 },
      ];
      adjacent.forEach((pos) => {
        if (
          pos.x > 0 &&
          pos.x < gridWidth - 1 &&
          pos.y > 0 &&
          pos.y < gridHeight - 1 &&
          Math.random() < 0.5
        ) {
          if (
            grid[pos.y] &&
            grid[pos.y][pos.x] &&
            grid[pos.y][pos.x].type === shrubType
          ) {
            grid[pos.y][pos.x].type = corridorType;
            grid[pos.y][pos.x].tileX = randomInt(0, 3);
            grid[pos.y][pos.x].tileY = randomInt(0, 3);
          }
        }
      });
    });
  });
}

// Shared utility: Widen/organically grow corridors/paths for hex grids
export function widenHexCorridorsOrPaths(
  grid,
  corridors,
  {
    shrubType,
    corridorType,
    randomInt,
    gridWidth,
    gridHeight,
    gridToHexCoords,
    hexNeighbors,
    hexToGridCoords,
  },
) {
  corridors.forEach((corridor) => {
    corridor.path.forEach(({ x, y }) => {
      const hex = gridToHexCoords(x, y);
      const neighbors = hexNeighbors(hex);
      neighbors.forEach((neighbor) => {
        const gridPos = hexToGridCoords(neighbor.q, neighbor.r);
        if (
          gridPos.x > 0 &&
          gridPos.x < gridWidth - 1 &&
          gridPos.y > 0 &&
          gridPos.y < gridHeight - 1 &&
          Math.random() < 0.5
        ) {
          if (
            grid[gridPos.y] &&
            grid[gridPos.y][gridPos.x] &&
            grid[gridPos.y][gridPos.x].type === shrubType
          ) {
            grid[gridPos.y][gridPos.x].type = corridorType;
            grid[gridPos.y][gridPos.x].tileX = randomInt(0, 3);
            grid[gridPos.y][gridPos.x].tileY = randomInt(0, 3);
          }
        }
      });
    });
  });
}

// Generic post-generation cleanup for square grids
export function cleanupGenericMap(
  grid,
  { walkableTypes, shrubType, roadType, minRoadArea = 3, randomInt },
) {
  const height = grid.length;
  const width = grid[0].length;

  // Helper: is walkable
  const isWalkable = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    return (
      walkableTypes.includes(grid[y][x].type) ||
      (grid[y][x].originalType &&
        walkableTypes.includes(grid[y][x].originalType))
    );
  };

  // Helper: get adjacent walkable count (N/E/S/W)
  const getAdjacentWalkableCount = (x, y) => {
    const directions = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];
    return directions.filter(([dx, dy]) => isWalkable(x + dx, y + dy)).length;
  };

  // Helper: get adjacent same type count
  const getAdjacentSameTypeCount = (x, y, tileType) => {
    const directions = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
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

  // 1. Remove isolated single tiles
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
  tilesToRemove.forEach(({ x, y }) => {
    grid[y][x].type = shrubType;
    grid[y][x].tileX = randomInt(0, 3);
    grid[y][x].tileY = randomInt(0, 3);
    delete grid[y][x].originalType;
  });

  // 2. Remove single-tile areas
  const visited = Array.from({ length: height }, () =>
    Array(width).fill(false),
  );
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!visited[y][x] && isWalkable(x, y)) {
        const area = [];
        const stack = [{ x, y }];
        visited[y][x] = true;
        while (stack.length > 0) {
          const current = stack.pop();
          area.push(current);
          const directions = [
            [0, -1],
            [1, 0],
            [0, 1],
            [-1, 0],
          ];
          directions.forEach(([dx, dy]) => {
            const nx = current.x + dx,
              ny = current.y + dy;
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
        if (area.length === 1) {
          const { x: tileX, y: tileY } = area[0];
          grid[tileY][tileX].type = shrubType;
          grid[tileY][tileX].tileX = randomInt(0, 3);
          grid[tileY][tileX].tileY = randomInt(0, 3);
          delete grid[tileY][tileX].originalType;
        }
      }
    }
  }

  // 3. Remove single road/corridor tiles
  const roadTilesToRemove = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        grid[y][x].type === roadType ||
        (grid[y][x].originalType && grid[y][x].originalType === roadType)
      ) {
        const adjacentRoads = getAdjacentSameTypeCount(x, y, roadType);
        if (adjacentRoads === 0) {
          roadTilesToRemove.push({ x, y });
        }
      }
    }
  }
  roadTilesToRemove.forEach(({ x, y }) => {
    grid[y][x].type = shrubType;
    grid[y][x].tileX = randomInt(0, 3);
    grid[y][x].tileY = randomInt(0, 3);
    delete grid[y][x].originalType;
  });

  // 4. Remove small road/corridor areas
  const roadVisited = Array.from({ length: height }, () =>
    Array(width).fill(false),
  );
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        !roadVisited[y][x] &&
        (grid[y][x].type === roadType ||
          (grid[y][x].originalType && grid[y][x].originalType === roadType))
      ) {
        const roadArea = [];
        const stack = [{ x, y }];
        roadVisited[y][x] = true;
        while (stack.length > 0) {
          const current = stack.pop();
          roadArea.push(current);
          const directions = [
            [0, -1],
            [1, 0],
            [0, 1],
            [-1, 0],
          ];
          directions.forEach(([dx, dy]) => {
            const nx = current.x + dx,
              ny = current.y + dy;
            if (
              nx >= 0 &&
              nx < width &&
              ny >= 0 &&
              ny < height &&
              !roadVisited[ny][nx] &&
              (grid[ny][nx].type === roadType ||
                (grid[ny][nx].originalType &&
                  grid[ny][nx].originalType === roadType))
            ) {
              roadVisited[ny][nx] = true;
              stack.push({ x: nx, y: ny });
            }
          });
        }
        if (roadArea.length < minRoadArea) {
          roadArea.forEach(({ x: tileX, y: tileY }) => {
            grid[tileY][tileX].type = shrubType;
            grid[tileY][tileX].tileX = randomInt(0, 3);
            grid[tileY][tileX].tileY = randomInt(0, 3);
            delete grid[tileY][tileX].originalType;
          });
        }
      }
    }
  }
}

// Generic post-generation cleanup for hex grids
export function cleanupGenericHexMap(
  grid,
  {
    walkableTypes,
    shrubType,
    roadType,
    minRoadArea = 3,
    randomInt,
    gridToHexCoords,
    hexNeighbors,
    hexToGridCoords,
  },
) {
  const height = grid.length;
  const width = grid[0].length;

  // Helper: is walkable
  const isWalkable = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    return (
      walkableTypes.includes(grid[y][x].type) ||
      (grid[y][x].originalType &&
        walkableTypes.includes(grid[y][x].originalType))
    );
  };

  // Helper: get adjacent walkable count (hex neighbors)
  const getAdjacentWalkableCount = (x, y) => {
    const hex = gridToHexCoords(x, y);
    const neighbors = hexNeighbors(hex)
      .map(({ q, r }) => hexToGridCoords(q, r))
      .filter(({ x, y }) => x >= 0 && x < width && y >= 0 && y < height);
    return neighbors.filter(({ x: nx, y: ny }) => isWalkable(nx, ny)).length;
  };

  // Helper: get adjacent same type count (hex neighbors)
  const getAdjacentSameTypeCount = (x, y, tileType) => {
    const hex = gridToHexCoords(x, y);
    const neighbors = hexNeighbors(hex)
      .map(({ q, r }) => hexToGridCoords(q, r))
      .filter(({ x, y }) => x >= 0 && x < width && y >= 0 && y < height);
    return neighbors.filter(({ x: nx, y: ny }) => {
      return (
        grid[ny][nx].type === tileType ||
        (grid[ny][nx].originalType && grid[ny][nx].originalType === tileType)
      );
    }).length;
  };

  // 1. Remove isolated single tiles
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
  tilesToRemove.forEach(({ x, y }) => {
    grid[y][x].type = shrubType;
    grid[y][x].tileX = randomInt(0, 3);
    grid[y][x].tileY = randomInt(0, 3);
    delete grid[y][x].originalType;
  });

  // 2. Remove single-tile areas
  const visited = Array.from({ length: height }, () =>
    Array(width).fill(false),
  );
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!visited[y][x] && isWalkable(x, y)) {
        const area = [];
        const stack = [{ x, y }];
        visited[y][x] = true;
        while (stack.length > 0) {
          const current = stack.pop();
          area.push(current);
          const hex = gridToHexCoords(current.x, current.y);
          const neighbors = hexNeighbors(hex)
            .map(({ q, r }) => hexToGridCoords(q, r))
            .filter(({ x, y }) => x >= 0 && x < width && y >= 0 && y < height);
          neighbors.forEach(({ x: nx, y: ny }) => {
            if (!visited[ny][nx] && isWalkable(nx, ny)) {
              visited[ny][nx] = true;
              stack.push({ x: nx, y: ny });
            }
          });
        }
        if (area.length === 1) {
          const { x: tileX, y: tileY } = area[0];
          grid[tileY][tileX].type = shrubType;
          grid[tileY][tileX].tileX = randomInt(0, 3);
          grid[tileY][tileX].tileY = randomInt(0, 3);
          delete grid[tileY][tileX].originalType;
        }
      }
    }
  }

  // 3. Remove single road/corridor tiles
  const roadTilesToRemove = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        grid[y][x].type === roadType ||
        (grid[y][x].originalType && grid[y][x].originalType === roadType)
      ) {
        const adjacentRoads = getAdjacentSameTypeCount(x, y, roadType);
        if (adjacentRoads === 0) {
          roadTilesToRemove.push({ x, y });
        }
      }
    }
  }
  roadTilesToRemove.forEach(({ x, y }) => {
    grid[y][x].type = shrubType;
    grid[y][x].tileX = randomInt(0, 3);
    grid[y][x].tileY = randomInt(0, 3);
    delete grid[y][x].originalType;
  });

  // 4. Remove small road/corridor areas
  const roadVisited = Array.from({ length: height }, () =>
    Array(width).fill(false),
  );
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        !roadVisited[y][x] &&
        (grid[y][x].type === roadType ||
          (grid[y][x].originalType && grid[y][x].originalType === roadType))
      ) {
        const roadArea = [];
        const stack = [{ x, y }];
        roadVisited[y][x] = true;
        while (stack.length > 0) {
          const current = stack.pop();
          roadArea.push(current);
          const hex = gridToHexCoords(current.x, current.y);
          const neighbors = hexNeighbors(hex)
            .map(({ q, r }) => hexToGridCoords(q, r))
            .filter(({ x, y }) => x >= 0 && x < width && y >= 0 && y < height);
          neighbors.forEach(({ x: nx, y: ny }) => {
            if (
              !roadVisited[ny][nx] &&
              (grid[ny][nx].type === roadType ||
                (grid[ny][nx].originalType &&
                  grid[ny][nx].originalType === roadType))
            ) {
              roadVisited[ny][nx] = true;
              stack.push({ x: nx, y: ny });
            }
          });
        }
        if (roadArea.length < minRoadArea) {
          roadArea.forEach(({ x: tileX, y: tileY }) => {
            grid[tileY][tileX].type = shrubType;
            grid[tileY][tileX].tileX = randomInt(0, 3);
            grid[tileY][tileX].tileY = randomInt(0, 3);
            delete grid[tileY][tileX].originalType;
          });
        }
      }
    }
  }
}
