import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  generateDungeon,
  getTileBackgroundPosition,
} from "../utils/generateDungeon";
import { generateCavern } from "../utils/generateCavern";
import "./DungeonMap.css";

const DungeonMap = ({
  width = 60,
  height = 60,
  minFloorTiles = 100,
  mapType = "dungeon",
}) => {
  const [dungeon, setDungeon] = useState([]);

  const generateNewMap = () => {
    const newMap =
      mapType === "cavern"
        ? generateCavern(width, height, minFloorTiles)
        : generateDungeon(width, height, minFloorTiles);
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

  const getMapTitle = () => {
    return mapType === "cavern"
      ? "Cavern Map Generator"
      : "Dungeon Map Generator";
  };

  const getGenerateButtonText = () => {
    return mapType === "cavern"
      ? "Generate New Cavern"
      : "Generate New Dungeon";
  };

  return (
    <div className="dungeon-container">
      <div className="dungeon-header">
        <h2>{getMapTitle()}</h2>
        <div className="dungeon-stats">
          <span>Floor tiles: {countFloorTiles()}</span>
          <span>Wall tiles: {countWallTiles()}</span>
          <span>Corridor tiles: {countCorridorTiles()}</span>
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
  mapType: PropTypes.oneOf(["dungeon", "cavern"]),
};

export default DungeonMap;
