import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  generateDungeon,
  getTileBackgroundPosition,
} from "../utils/generateDungeon";
import { generateCavern } from "../utils/generateCavern";
import { generateOutdoor } from "../utils/generateOutdoor";
import { generateCity } from "../utils/generateCity";
import "./DungeonMap.css";

const TILESETS = {
  dungeon: {
    wall: {
      image: "/images/tilesets/dark_stone_with_vines.png",
      size: 32,
      tiles: 4,
    },
    floor: {
      image: "/images/tilesets/light_cracked_stone.png",
      size: 32,
      tiles: 4,
    },
  },
  cavern: {
    wall: {
      image: "/images/tilesets/red_brown_cavern.png",
      size: 32,
      tiles: 4,
    },
    floor: {
      image: "/images/tilesets/light_brown_cavern.png",
      size: 32,
      tiles: 4,
    },
  },
  outdoor: {
    wall: {
      image: "/images/tilesets/green_shrubs.png",
      size: 32,
      tiles: 4,
    },
    floor: {
      image: "/images/tilesets/dirt_and_grass.png",
      size: 32,
      tiles: 4,
    },
    water: {
      image: "/images/tilesets/calm_water.png",
      size: 32,
      tiles: 4,
    },
    river: {
      image: "/images/tilesets/river_water.png",
      size: 32,
      tiles: 4,
    },
    mountain: {
      image: "/images/tilesets/mountains.png",
      size: 32,
      tiles: 4,
    },
  },
  city: {
    wall: {
      image: "/images/tilesets/dark_square_stones.png",
      size: 32,
      tiles: 4,
    },
    floor: {
      image: "/images/tilesets/wood_boards.png",
      size: 32,
      tiles: 4,
    },
    road: {
      image: "/images/tilesets/dirt_and_grass.png",
      size: 32,
      tiles: 4,
    },
    shrub: {
      image: "/images/tilesets/green_shrubs.png",
      size: 32,
      tiles: 4,
    },
  },
};

const DungeonMap = ({
  width = 60,
  height = 60,
  minFloorTiles = 100,
  mapType = "dungeon",
}) => {
  const [dungeon, setDungeon] = useState([]);

  const generateNewMap = () => {
    let newMap;
    if (mapType === "cavern") {
      newMap = generateCavern(width, height, minFloorTiles);
    } else if (mapType === "outdoor") {
      newMap = generateOutdoor(width, height);
    } else if (mapType === "city") {
      newMap = generateCity(width, height);
    } else {
      newMap = generateDungeon(width, height, minFloorTiles);
    }
    setDungeon(newMap);
  };

  useEffect(() => {
    generateNewMap();
  }, [width, height, minFloorTiles, mapType]);

  const getTileStyle = (tile) => {
    let backgroundImage;
    if (mapType === "cavern") {
      backgroundImage =
        tile.type === "floor" || tile.type === "corridor"
          ? "url(/images/tilesets/light_brown_cavern.png)"
          : "url(/images/tilesets/red_brown_cavern.png)";
    } else if (mapType === "outdoor") {
      if (tile.type === "water") {
        backgroundImage = `url(${TILESETS.outdoor.water.image})`;
      } else if (tile.type === "river") {
        backgroundImage = `url(${TILESETS.outdoor.river.image})`;
      } else if (tile.type === "mountain") {
        backgroundImage = `url(${TILESETS.outdoor.mountain.image})`;
      } else {
        backgroundImage =
          tile.type === "floor" || tile.type === "corridor"
            ? "url(/images/tilesets/dirt_and_grass.png)"
            : "url(/images/tilesets/green_shrubs.png)";
      }
    } else if (mapType === "city") {
      const tileset = TILESETS.city[tile.type] || TILESETS.city.shrub;
      backgroundImage = `url(${tileset.image})`;
    } else {
      backgroundImage =
        tile.type === "floor" || tile.type === "corridor"
          ? "url(/images/tilesets/light_cracked_stone.png)"
          : "url(/images/tilesets/dark_stone_with_vines.png)";
    }

    const backgroundPosition = getTileBackgroundPosition(
      tile.tileX,
      tile.tileY,
    );

    return {
      backgroundImage,
      backgroundPosition,
      backgroundSize: "128px 128px", // 4x4 tiles * 32px each
      width: "32px",
      height: "32px",
    };
  };

  const countFloorTiles = () => {
    return dungeon.flat().filter((tile) => tile.type === "floor").length;
  };

  const countWallTiles = () => {
    return dungeon.flat().filter((tile) => tile.type === "wall").length;
  };

  const countCorridorTiles = () => {
    return dungeon.flat().filter((tile) => tile.type === "corridor").length;
  };

  const countRoadTiles = () => {
    return dungeon.flat().filter((tile) => tile.type === "road").length;
  };

  const countShrubTiles = () => {
    return dungeon.flat().filter((tile) => tile.type === "shrub").length;
  };

  const countMountainTiles = () => {
    return dungeon.flat().filter((tile) => tile.type === "mountain").length;
  };

  const countRiverTiles = () => {
    return dungeon.flat().filter((tile) => tile.type === "river").length;
  };

  const getMapTitle = () => {
    if (mapType === "cavern") return "Cavern Map Generator";
    if (mapType === "outdoor") return "Outdoor Map Generator";
    if (mapType === "city") return "City Map Generator";
    return "Dungeon Map Generator";
  };

  const getGenerateButtonText = () => {
    if (mapType === "cavern") return "Generate New Cavern";
    if (mapType === "outdoor") return "Generate New Outdoor";
    if (mapType === "city") return "Generate New City";
    return "Generate New Dungeon";
  };

  return (
    <div className="dungeon-container">
      <div className="dungeon-header">
        <h2>{getMapTitle()}</h2>
        <div className="dungeon-stats">
          {mapType === "city" ? (
            <>
              <span>Floor tiles: {countFloorTiles()}</span>
              <span>Wall tiles: {countWallTiles()}</span>
              <span>Road tiles: {countRoadTiles()}</span>
              <span>Shrub tiles: {countShrubTiles()}</span>
            </>
          ) : mapType === "outdoor" ? (
            <>
              <span>Floor tiles: {countFloorTiles()}</span>
              <span>Wall tiles: {countWallTiles()}</span>
              <span>Corridor tiles: {countCorridorTiles()}</span>
              <span>Mountain tiles: {countMountainTiles()}</span>
              <span>River tiles: {countRiverTiles()}</span>
            </>
          ) : (
            <>
              <span>Floor tiles: {countFloorTiles()}</span>
              <span>Wall tiles: {countWallTiles()}</span>
              <span>Corridor tiles: {countCorridorTiles()}</span>
            </>
          )}
        </div>
        <button onClick={generateNewMap} className="generate-button">
          {getGenerateButtonText()}
        </button>
      </div>

      <div className="dungeon-grid">
        {dungeon.map((row, rowIndex) => (
          <div key={rowIndex} className="dungeon-row">
            {row.map((tile, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`dungeon-tile ${tile.type}`}
                style={getTileStyle(tile)}
                title={`${tile.type} at (${colIndex}, ${rowIndex})`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

DungeonMap.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  minFloorTiles: PropTypes.number,
  mapType: PropTypes.oneOf(["dungeon", "cavern", "outdoor", "city"]),
};

export default DungeonMap;
