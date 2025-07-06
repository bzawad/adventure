import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  generateDungeon,
  getTileBackgroundPosition,
} from "../utils/generateDungeon";
import { generateCavern } from "../utils/generateCavern";
import { generateOutdoor } from "../utils/generateOutdoor";
import { generateCity } from "../utils/generateCity";
import { TILE_CONFIG } from "../config/tileConfig";
import "./ThemeMap.css";



const ThemeMap = ({
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
    const config = TILE_CONFIG[tile.type];
    if (!config) {
      // Fallback for unknown tile types
      return {
        backgroundColor: 'magenta',
        width: "32px",
        height: "32px",
      };
    }

    const backgroundPosition = getTileBackgroundPosition(
      tile.tileX,
      tile.tileY,
    );

    return {
      backgroundImage: `url(${config.image})`,
      backgroundPosition,
      backgroundSize: "128px 128px", // 4x4 tiles * 32px each
      width: "32px",
      height: "32px",
    };
  };

  const countFloorTiles = () => {
    return dungeon.flat().filter((tile) =>
      tile.type === "dungeon_floor" ||
      tile.type === "cavern_floor" ||
      tile.type === "outdoor_area" ||
      tile.type === "city_floor"
    ).length;
  };

  const countWallTiles = () => {
    return dungeon.flat().filter((tile) =>
      tile.type === "dungeon_wall" ||
      tile.type === "cavern_wall" ||
      tile.type === "city_wall"
    ).length;
  };

  const countCorridorTiles = () => {
    return dungeon.flat().filter((tile) =>
      tile.type === "dungeon_corridor" ||
      tile.type === "cavern_corridor"
    ).length;
  };

  const countRoadTiles = () => {
    return dungeon.flat().filter((tile) =>
      tile.type === "outdoor_road" ||
      tile.type === "city_road"
    ).length;
  };

  const countShrubTiles = () => {
    return dungeon.flat().filter((tile) =>
      tile.type === "outdoor_shrub" ||
      tile.type === "city_shrub"
    ).length;
  };

  const countMountainTiles = () => {
    return dungeon.flat().filter((tile) => tile.type === "outdoor_mountain").length;
  };

  const countRiverTiles = () => {
    return dungeon.flat().filter((tile) => tile.type === "outdoor_river").length;
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

ThemeMap.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  minFloorTiles: PropTypes.number,
  mapType: PropTypes.oneOf(["dungeon", "cavern", "outdoor", "city"]),
};

export default ThemeMap;
