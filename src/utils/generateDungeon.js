// Room and corridor-based dungeon generator for a 60x60 grid
import { addDungeonLabels, assignAreaIds } from "./labelUtils";

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
      type: "dungeon_wall",
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
      newRoom.y > room.y + room.height + 1
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

function carveRoom(grid, room) {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (
        grid[y][x].type === "dungeon_wall" ||
        grid[y][x].type === "dungeon_corridor"
      ) {
        grid[y][x].type = "dungeon_floor";
        grid[y][x].tileX = randomInt(0, 3);
        grid[y][x].tileY = randomInt(0, 3);
      }
    }
  }
}

function roomCenter(room) {
  return {
    x: room.x + Math.floor(room.width / 2),
    y: room.y + Math.floor(room.height / 2),
  };
}

function carveCorridor(grid, from, to) {
  const path = [];
  if (Math.random() < 0.5) {
    // Horizontal then vertical
    for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) {
      if (grid[from.y][x].type === "dungeon_wall") {
        grid[from.y][x].type = "dungeon_corridor";
        grid[from.y][x].tileX = randomInt(0, 3);
        grid[from.y][x].tileY = randomInt(0, 3);
      }
      path.push({ x, y: from.y });
    }
    for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y++) {
      if (grid[y][to.x].type === "dungeon_wall") {
        grid[y][to.x].type = "dungeon_corridor";
        grid[y][to.x].tileX = randomInt(0, 3);
        grid[y][to.x].tileY = randomInt(0, 3);
      }
      path.push({ x: to.x, y });
    }
  } else {
    // Vertical then horizontal
    for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y++) {
      if (grid[y][from.x].type === "dungeon_wall") {
        grid[y][from.x].type = "dungeon_corridor";
        grid[y][from.x].tileX = randomInt(0, 3);
        grid[y][from.x].tileY = randomInt(0, 3);
      }
      path.push({ x: from.x, y });
    }
    for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) {
      if (grid[to.y][x].type === "dungeon_wall") {
        grid[to.y][x].type = "dungeon_corridor";
        grid[to.y][x].tileX = randomInt(0, 3);
        grid[to.y][x].tileY = randomInt(0, 3);
      }
      path.push({ x, y: to.y });
    }
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
    const path = carveCorridor(grid, curr, next);
    corridors.push({ number: `C${i + 1}`, path });
  }
  return corridors;
}

function findCorridorRoomIntersections(grid, corridors) {
  // Returns [{x, y, orientation}] for valid door positions
  const intersections = [];
  for (const corridor of corridors) {
    for (const { x, y } of corridor.path) {
      if (grid[y][x].type !== "dungeon_corridor") continue;
      // Check each direction for adjacent room
      const directions = [
        { dx: 0, dy: -1, orientation: "north" },
        { dx: 0, dy: 1, orientation: "south" },
        { dx: -1, dy: 0, orientation: "west" },
        { dx: 1, dy: 0, orientation: "east" },
      ];
      for (const { dx, dy, orientation } of directions) {
        const nx = x + dx,
          ny = y + dy;
        if (
          ny >= 0 &&
          ny < grid.length &&
          nx >= 0 &&
          nx < grid[0].length &&
          grid[ny][nx].type === "dungeon_floor"
        ) {
          // Check for barriers on the sides (per orientation)
          let side1, side2;
          if (orientation === "north" || orientation === "south") {
            side1 = grid[y][x - 1];
            side2 = grid[y][x + 1];
          } else {
            side1 = grid[y - 1]?.[x];
            side2 = grid[y + 1]?.[x];
          }
          const isBlocked = (tile) =>
            tile && ["dungeon_wall", "dungeon_door"].includes(tile.type);
          if (isBlocked(side1) && isBlocked(side2)) {
            intersections.push({ x, y, orientation });
          }
        }
      }
    }
  }
  return intersections;
}

function randomDoorStatus() {
  // 1 in 3 locked, 1 in 8 trapped
  const locked = Math.random() < 1 / 3;
  const trapped = Math.random() < 1 / 8;
  return { locked, trapped };
}

function placeDoors(grid, corridors) {
  const intersections = findCorridorRoomIntersections(grid, corridors);
  // Place a door at each intersection (could randomize subset if desired)
  for (const { x, y, orientation } of intersections) {
    // Only place if not already a door
    if (!grid[y][x].door) {
      const { locked, trapped } = randomDoorStatus();
      grid[y][x].door = { orientation, locked, trapped };
      // Optionally, mark as a special type for clarity
      // grid[y][x].type = "dungeon_corridor"; // keep as corridor for rendering
    }
  }
}

export function generateDungeon(width = GRID_WIDTH, height = GRID_HEIGHT) {
  // 1. Create empty grid
  const grid = createEmptyGrid(width, height);
  // 2. Generate rooms
  const rooms = generateRooms();
  // 3. Carve rooms
  rooms.forEach((room) => carveRoom(grid, room));
  // 4. Connect rooms with corridors
  const corridors = connectRooms(grid, rooms);
  // 4.5 Place doors at corridor-room intersections
  placeDoors(grid, corridors);
  // 5. Fill in random tileX/tileY for remaining walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].type === "dungeon_wall") {
        grid[y][x].tileX = randomInt(0, 3);
        grid[y][x].tileY = randomInt(0, 3);
      }
    }
  }
  // 6. Assign areaIds to all walkable tiles
  assignAreaIds(grid, "dungeon_floor", "room");
  assignAreaIds(grid, "dungeon_corridor", "corridor");
  // 7. Add labels
  return addDungeonLabels(grid, rooms, corridors);
}

// Returns CSS background-position for a 4x4 tileset (32px tiles)
// tileX and tileY should be 0-3 for a 4x4 grid (16 total tiles)
export function getTileBackgroundPosition(tileX, tileY) {
  const size = 32; // each tile is 32x32px
  return `${-tileX * size}px ${-tileY * size}px`;
}
