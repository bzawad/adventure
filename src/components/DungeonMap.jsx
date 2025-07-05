import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  generateDungeon,
  getTileBackgroundPosition,
} from "../utils/generateDungeon";
import "./DungeonMap.css";

const DungeonMap = ({ width = 60, height = 60, minFloorTiles = 100 }) => {
  const [dungeon, setDungeon] = useState([]);

  const generateNewDungeon = () => {
    const newDungeon = generateDungeon(width, height, minFloorTiles);
    setDungeon(newDungeon);
  };

  useEffect(() => {
    generateNewDungeon();
  }, [width, height, minFloorTiles]);

  const getTileStyle = (tile) => {
    const backgroundImage =
      tile.type === "floor" || tile.type === "corridor"
        ? "url(/images/tilesets/light_cracked_stone.png)"
        : "url(/images/tilesets/dark_stone_with_vines.png)";

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
      border: "1px solid #333",
    };
  };

  const countFloorTiles = () => {
    return dungeon.flat().filter((tile) => tile.type === "floor").length;
  };

  const countWallTiles = () => {
    return dungeon.flat().filter((tile) => tile.type === "wall").length;
  };

  return (
    <div className="dungeon-container">
      <div className="dungeon-header">
        <h2>Dungeon Map Generator</h2>
        <div className="dungeon-stats">
          <span>Floor tiles: {countFloorTiles()}</span>
          <span>Wall tiles: {countWallTiles()}</span>
        </div>
        <button onClick={generateNewDungeon} className="generate-button">
          Generate New Dungeon
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
};

export default DungeonMap;
