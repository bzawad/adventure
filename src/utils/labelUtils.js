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
export function addDungeonLabels(grid, rooms, corridors) {
  const newGrid = JSON.parse(JSON.stringify(grid)); // Deep copy

  // Add room labels
  rooms.forEach((room, index) => {
    const center = roomCenter(room);
    const position = findLabelPosition(newGrid, center.x, center.y);
    if (position) {
      newGrid[position.y][position.x] = {
        ...newGrid[position.y][position.x],
        type: "dungeon_room_label",
        label: `R${index + 1}`,
        tileX: 0,
        tileY: 0,
      };
    }
  });

  // Add corridor labels
  corridors.forEach((corridor, index) => {
    // Find center of corridor path
    const centerX = Math.floor(
      corridor.path.reduce((sum, pos) => sum + pos.x, 0) / corridor.path.length,
    );
    const centerY = Math.floor(
      corridor.path.reduce((sum, pos) => sum + pos.y, 0) / corridor.path.length,
    );

    const position = findLabelPosition(newGrid, centerX, centerY);
    if (position) {
      newGrid[position.y][position.x] = {
        ...newGrid[position.y][position.x],
        type: "dungeon_corridor_label",
        label: `C${index + 1}`,
        tileX: 0,
        tileY: 0,
      };
    }
  });

  return newGrid;
}

// Add labels to cavern chambers, tunnels, lakes, and rivers
export function addCavernLabels(grid, caverns, lakeCaverns = []) {
  const newGrid = JSON.parse(JSON.stringify(grid));

  // Add chamber labels (skip if all cells are lake tiles)
  caverns.forEach((cavern, index) => {
    const allLake = cavern.cells.every(
      ({ x, y }) => newGrid[y][x].type === "cavern_lake",
    );
    if (allLake) return;
    const center = cavernCenter(cavern);
    const position = findLabelPosition(newGrid, center.x, center.y);
    if (position) {
      newGrid[position.y][position.x] = {
        ...newGrid[position.y][position.x],
        type: "cavern_chamber_label",
        label: `C${index + 1}`,
        tileX: 0,
        tileY: 0,
      };
    }
  });

  // Add tunnel labels (for corridors)
  const corridorPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (
        newGrid[y][x].type === "cavern_corridor" ||
        newGrid[y][x].type === "cavern_river"
      ) {
        corridorPositions.push({ x, y });
      }
    }
  }
  // Group adjacent corridor/river positions into tunnels
  const tunnels = groupAdjacentPositions(corridorPositions);
  tunnels.forEach((tunnel, index) => {
    // If all tiles in the tunnel are river, skip labeling as tunnel
    const allRiver = tunnel.every(
      ({ x, y }) => newGrid[y][x].type === "cavern_river",
    );
    if (allRiver) return;
    const centerX = Math.floor(
      tunnel.reduce((sum, pos) => sum + pos.x, 0) / tunnel.length,
    );
    const centerY = Math.floor(
      tunnel.reduce((sum, pos) => sum + pos.y, 0) / tunnel.length,
    );
    const position = findLabelPosition(newGrid, centerX, centerY);
    if (position) {
      newGrid[position.y][position.x] = {
        ...newGrid[position.y][position.x],
        type: "cavern_tunnel_label",
        label: `T${index + 1}`,
        tileX: 0,
        tileY: 0,
      };
    }
  });

  // Add lake labels
  lakeCaverns.forEach((lake, index) => {
    const center = cavernCenter(lake);
    const position = findLabelPosition(newGrid, center.x, center.y);
    if (position) {
      newGrid[position.y][position.x] = {
        ...newGrid[position.y][position.x],
        type: "cavern_lake_label",
        label: `L${index + 1}`,
        tileX: 0,
        tileY: 0,
      };
    }
  });

  // Add river labels (find river tiles and group them)
  const riverPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (newGrid[y][x].type === "cavern_river") {
        riverPositions.push({ x, y });
      }
    }
  }

  const rivers = groupAdjacentPositions(riverPositions);
  rivers.forEach((river, index) => {
    const centerX = Math.floor(
      river.reduce((sum, pos) => sum + pos.x, 0) / river.length,
    );
    const centerY = Math.floor(
      river.reduce((sum, pos) => sum + pos.y, 0) / river.length,
    );

    const position = findLabelPosition(newGrid, centerX, centerY);
    if (position) {
      newGrid[position.y][position.x] = {
        ...newGrid[position.y][position.x],
        type: "cavern_river_label",
        label: `V${index + 1}`,
        tileX: 0,
        tileY: 0,
      };
    }
  });

  return newGrid;
}

// Add labels to outdoor areas, roads, lakes, and rivers
export function addOutdoorLabels(grid, rooms, lakeRooms = []) {
  const newGrid = JSON.parse(JSON.stringify(grid));
  const mountainAreas = [];

  // Add area labels (skip if all cells are lake tiles, or if area contains mountains)
  rooms.forEach((room, index) => {
    // Reconstruct area cells for the room
    const cells = [];
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        cells.push({ x, y });
      }
    }
    const allLake = cells.every(
      ({ x, y }) => newGrid[y][x].type === "outdoor_lake",
    );
    const hasMountains = cells.some(
      ({ x, y }) => newGrid[y][x].type === "outdoor_mountain",
    );
    if (allLake) return;
    if (hasMountains) {
      mountainAreas.push({ room, cells });
      return;
    }
    const center = roomCenter(room);
    const position = findLabelPosition(newGrid, center.x, center.y);
    if (position) {
      newGrid[position.y][position.x] = {
        ...newGrid[position.y][position.x],
        type: "outdoor_area_label",
        label: `A${index + 1}`,
        tileX: 0,
        tileY: 0,
      };
    }
  });

  // Add mountain labels (M1, M2, ...) for each mountain area
  mountainAreas.forEach((mountain, index) => {
    const center = roomCenter(mountain.room);
    let labelPos = null;
    // If center is a mountain, use it; otherwise, find nearest mountain tile in the area
    if (newGrid[center.y][center.x].type === "outdoor_mountain") {
      labelPos = center;
    } else {
      // Find the closest mountain tile to the center within the area
      let minDist = Infinity;
      mountain.cells.forEach(({ x, y }) => {
        if (newGrid[y][x].type === "outdoor_mountain") {
          const dist = Math.abs(center.x - x) + Math.abs(center.y - y);
          if (dist < minDist) {
            minDist = dist;
            labelPos = { x, y };
          }
        }
      });
    }
    if (labelPos) {
      newGrid[labelPos.y][labelPos.x] = {
        ...newGrid[labelPos.y][labelPos.x],
        type: "outdoor_mountain_label",
        label: `M${index + 1}`,
        tileX: 0,
        tileY: 0,
      };
    }
  });

  // Add road labels (for roads and rivers)
  const roadPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (
        newGrid[y][x].type === "outdoor_road" ||
        newGrid[y][x].type === "outdoor_river"
      ) {
        roadPositions.push({ x, y });
      }
    }
  }
  const roads = groupAdjacentPositions(roadPositions);
  roads.forEach((road, index) => {
    // If all tiles in the road are river, skip labeling as road
    const allRiver = road.every(
      ({ x, y }) => newGrid[y][x].type === "outdoor_river",
    );
    if (allRiver) return;
    const centerX = Math.floor(
      road.reduce((sum, pos) => sum + pos.x, 0) / road.length,
    );
    const centerY = Math.floor(
      road.reduce((sum, pos) => sum + pos.y, 0) / road.length,
    );
    const position = findLabelPosition(newGrid, centerX, centerY);
    if (position) {
      newGrid[position.y][position.x] = {
        ...newGrid[position.y][position.x],
        type: "outdoor_road_label",
        label: `R${index + 1}`,
        tileX: 0,
        tileY: 0,
      };
    }
  });

  // Add lake labels
  lakeRooms.forEach((lake, index) => {
    // Handle both room objects and area objects
    let center;
    if (lake.cells) {
      // Area object with cells
      center = cavernCenter(lake);
    } else {
      // Room object with x, y, width, height
      center = roomCenter(lake);
    }
    const position = findLabelPosition(newGrid, center.x, center.y);
    if (position) {
      newGrid[position.y][position.x] = {
        ...newGrid[position.y][position.x],
        type: "outdoor_lake_label",
        label: `L${index + 1}`,
        tileX: 0,
        tileY: 0,
      };
    }
  });

  // Add river labels
  const riverPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (newGrid[y][x].type === "outdoor_river") {
        riverPositions.push({ x, y });
      }
    }
  }

  const rivers = groupAdjacentPositions(riverPositions);
  rivers.forEach((river, index) => {
    const centerX = Math.floor(
      river.reduce((sum, pos) => sum + pos.x, 0) / river.length,
    );
    const centerY = Math.floor(
      river.reduce((sum, pos) => sum + pos.y, 0) / river.length,
    );

    const position = findLabelPosition(newGrid, centerX, centerY);
    if (position) {
      newGrid[position.y][position.x] = {
        ...newGrid[position.y][position.x],
        type: "outdoor_river_label",
        label: `V${index + 1}`,
        tileX: 0,
        tileY: 0,
      };
    }
  });

  return newGrid;
}

// Add labels to city roads and buildings
export function addCityLabels(grid) {
  const newGrid = JSON.parse(JSON.stringify(grid));

  // Add road labels
  const roadPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (newGrid[y][x].type === "city_road") {
        roadPositions.push({ x, y });
      }
    }
  }

  const roads = groupAdjacentPositions(roadPositions);
  roads.forEach((road, index) => {
    const centerX = Math.floor(
      road.reduce((sum, pos) => sum + pos.x, 0) / road.length,
    );
    const centerY = Math.floor(
      road.reduce((sum, pos) => sum + pos.y, 0) / road.length,
    );

    const position = findLabelPosition(newGrid, centerX, centerY);
    if (position) {
      newGrid[position.y][position.x] = {
        ...newGrid[position.y][position.x],
        type: "city_road_label",
        label: `R${index + 1}`,
        tileX: 0,
        tileY: 0,
      };
    }
  });

  // Add building labels (floor areas)
  const buildingPositions = [];
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[y].length; x++) {
      if (newGrid[y][x].type === "city_floor") {
        buildingPositions.push({ x, y });
      }
    }
  }

  const buildings = groupAdjacentPositions(buildingPositions);
  buildings.forEach((building, index) => {
    const centerX = Math.floor(
      building.reduce((sum, pos) => sum + pos.x, 0) / building.length,
    );
    const centerY = Math.floor(
      building.reduce((sum, pos) => sum + pos.y, 0) / building.length,
    );

    const position = findLabelPosition(newGrid, centerX, centerY);
    if (position) {
      newGrid[position.y][position.x] = {
        ...newGrid[position.y][position.x],
        type: "city_building_label",
        label: `B${index + 1}`,
        tileX: 0,
        tileY: 0,
      };
    }
  });

  return newGrid;
}

// Helper function to group adjacent positions into connected areas
function groupAdjacentPositions(positions) {
  if (!positions || positions.length === 0) return [];

  const groups = [];
  const visited = new Set();

  positions.forEach((pos) => {
    if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") return;
    if (visited.has(`${pos.x},${pos.y}`)) return;

    const group = [];
    const queue = [pos];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      const key = `${current.x},${current.y}`;

      if (visited.has(key)) continue;
      visited.add(key);
      group.push(current);

      // Check adjacent positions
      const adjacent = [
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 },
      ];

      adjacent.forEach((adj) => {
        const adjKey = `${adj.x},${adj.y}`;
        if (
          !visited.has(adjKey) &&
          positions.some((p) => p && p.x === adj.x && p.y === adj.y)
        ) {
          queue.push(adj);
        }
      });
    }

    if (group.length > 0) {
      groups.push(group);
    }
  });

  return groups;
}
