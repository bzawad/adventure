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
import doorImg from "/images/wooden_door.png";
import lockImg from "/images/lock.png";
import trapImg from "/images/trap.png";

const ThemeMap = ({
  width = 60,
  height = 60,
  minFloorTiles = 100,
  mapType = "dungeon",
}) => {
  const [dungeon, setDungeon] = useState([]);
  const [error, setError] = useState(null);
  const [highlightedAreaId, setHighlightedAreaId] = useState(null);

  const generateNewMap = () => {
    try {
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
      setError(null);
    } catch (error) {
      console.error("Error generating map:", error);
      setError(error.message || "Unknown error during map generation.");
      // Fallback to a simple empty grid if generation fails
      const fallbackGrid = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => ({
          type: "dungeon_wall",
          tileX: 0,
          tileY: 0,
        })),
      );
      setDungeon(fallbackGrid);
    }
  };

  useEffect(() => {
    generateNewMap();
    // Debug: log if any label tiles exist
    setTimeout(() => {
      if (dungeon.flat().some((tile) => tile.label)) {
        console.log(
          "Label tiles found:",
          dungeon.flat().filter((tile) => tile.label),
        );
      } else {
        console.log("No label tiles found in the map.");
      }
    }, 100);
  }, [width, height, minFloorTiles, mapType]);

  const getTileStyle = (tile) => {
    const config = TILE_CONFIG[tile.type];
    if (!config) {
      // Fallback for unknown tile types
      return {
        backgroundColor: "magenta",
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

  const getLabelType = (tileType) => {
    if (tileType.includes("room_label")) return "room";
    if (tileType.includes("corridor_label")) return "corridor";
    if (tileType.includes("chamber_label")) return "chamber";
    if (tileType.includes("tunnel_label")) return "tunnel";
    if (tileType.includes("lake_label")) return "lake";
    if (tileType.includes("river_label")) return "river";
    if (tileType.includes("area_label")) return "area";
    if (tileType.includes("road_label")) return "road";
    if (tileType.includes("building_label")) return "building";
    return null;
  };

  const countFloorTiles = () => {
    return dungeon
      .flat()
      .filter(
        (tile) =>
          tile.type === "dungeon_floor" ||
          tile.type === "cavern_floor" ||
          tile.type === "outdoor_area" ||
          tile.type === "city_floor",
      ).length;
  };

  const countWallTiles = () => {
    return dungeon
      .flat()
      .filter(
        (tile) =>
          tile.type === "dungeon_wall" ||
          tile.type === "cavern_wall" ||
          tile.type === "city_wall",
      ).length;
  };

  const countCorridorTiles = () => {
    return dungeon
      .flat()
      .filter(
        (tile) =>
          tile.type === "dungeon_corridor" || tile.type === "cavern_corridor",
      ).length;
  };

  const countRoadTiles = () => {
    return dungeon
      .flat()
      .filter(
        (tile) => tile.type === "outdoor_road" || tile.type === "city_road",
      ).length;
  };

  const countShrubTiles = () => {
    return dungeon
      .flat()
      .filter(
        (tile) => tile.type === "outdoor_shrub" || tile.type === "city_shrub",
      ).length;
  };

  const countMountainTiles = () => {
    return dungeon.flat().filter((tile) => tile.type === "outdoor_mountain")
      .length;
  };

  const countRiverTiles = () => {
    return dungeon
      .flat()
      .filter(
        (tile) => tile.type === "outdoor_river" || tile.type === "cavern_river",
      ).length;
  };

  const countLakeTiles = () => {
    return dungeon
      .flat()
      .filter(
        (tile) => tile.type === "outdoor_lake" || tile.type === "cavern_lake",
      ).length;
  };

  const countRadiationTiles = () => {
    return dungeon.flat().filter((tile) => tile.radioactive).length;
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

  function getDoorRotation(orientation) {
    switch (orientation) {
      case "north":
        return "rotate(180deg)";
      case "south":
        return "rotate(0deg)";
      case "east":
        return "rotate(270deg)";
      case "west":
        return "rotate(90deg)";
      default:
        return "rotate(0deg)";
    }
  }

  function rotatePoint(x, y, angleDeg, cx = 16, cy = 16) {
    // Rotates (x, y) around (cx, cy) by angleDeg
    const angle = (angleDeg * Math.PI) / 180;
    const dx = x - cx;
    const dy = y - cy;
    const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
    const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
    return { left: Math.round(cx + rx), top: Math.round(cy + ry) };
  }

  function getDoorIconPosition(orientation, which, both) {
    // which: 'lock' or 'trap'; both: true if both icons are present
    // Returns {left, top, width, height} in px for 32x32 tile
    const iconSize = 16; // always full size
    if (!both) {
      // Single icon: always center in the door area
      if (orientation === "south") {
        return { left: 8, top: 16, width: iconSize, height: iconSize };
      } else if (orientation === "north") {
        return { left: 8, top: 0, width: iconSize, height: iconSize };
      } else if (orientation === "east") {
        return { left: 16, top: 8, width: iconSize, height: iconSize };
      } else if (orientation === "west") {
        return { left: 0, top: 8, width: iconSize, height: iconSize };
      }
    } else {
      // Dual icons: base positions for south (unrotated), match single icon's vertical alignment
      let base = { left: 0, top: 16 };
      if (which === "lock") base.left = 0;
      if (which === "trap") base.left = 16;
      // Now rotate base position for orientation
      let rotated;
      if (orientation === "south") {
        rotated = { left: base.left, top: base.top };
      } else if (orientation === "east") {
        rotated = rotatePoint(base.left + 8, base.top + 8, 90, 16, 16); // +8 to center icon
        rotated.left -= 8;
        rotated.top -= 8;
      } else if (orientation === "north") {
        rotated = rotatePoint(base.left + 8, base.top + 8, 180, 16, 16);
        rotated.left -= 8;
        rotated.top -= 8;
      } else if (orientation === "west") {
        rotated = rotatePoint(base.left + 8, base.top + 8, 270, 16, 16);
        rotated.left -= 8;
        rotated.top -= 8;
      }
      return { ...rotated, width: iconSize, height: iconSize };
    }
  }

  return (
    <div className="dungeon-container">
      <div className="dungeon-header">
        <h2>{getMapTitle()}</h2>
        {error && (
          <div style={{ color: "red", marginBottom: 10, fontWeight: "bold" }}>
            Map generation error: {error}
          </div>
        )}
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
              <span>Radiation tiles: {countRadiationTiles()}</span>
            </>
          ) : mapType === "cavern" ? (
            <>
              <span>Floor tiles: {countFloorTiles()}</span>
              <span>Wall tiles: {countWallTiles()}</span>
              <span>Corridor tiles: {countCorridorTiles()}</span>
              <span>Lake tiles: {countLakeTiles()}</span>
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
            {row.map((tile, colIndex) => {
              const isLabel = Boolean(tile.label);
              const isHighlighted =
                highlightedAreaId && tile.areaId === highlightedAreaId;
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`dungeon-tile ${tile.type} ${
                    isHighlighted ? "tile-highlighted" : ""
                  }`}
                  style={getTileStyle(tile)}
                  title={
                    `${tile.type} at (${colIndex}, ${rowIndex})` +
                    (tile.label ? ` | label: ${tile.label}` : "") +
                    (tile.areaId ? ` | areaId: ${tile.areaId}` : "") +
                    (tile.radioactive ? ` | RADIOACTIVE` : "")
                  }
                  data-label={tile.label || undefined}
                  data-label-type={getLabelType(tile.type) || undefined}
                  onMouseEnter={
                    isLabel && tile.areaId
                      ? () => setHighlightedAreaId(tile.areaId)
                      : undefined
                  }
                  onMouseLeave={
                    isLabel && tile.areaId
                      ? () => setHighlightedAreaId(null)
                      : undefined
                  }
                >
                  {tile.label}
                  {tile.radioactive && <div className="radiation-overlay" />}
                  {tile.door && (
                    <>
                      <img
                        src={doorImg}
                        alt="door"
                        className="door-overlay-img"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          width: 32,
                          height: 32,
                          pointerEvents: "none",
                          transform: getDoorRotation(tile.door.orientation),
                          zIndex: 2,
                        }}
                      />
                      {tile.door.locked && !tile.door.trapped && (
                        <img
                          src={lockImg}
                          alt="lock"
                          className="door-symbol-overlay"
                          style={{
                            position: "absolute",
                            ...getDoorIconPosition(
                              tile.door.orientation,
                              "lock",
                              false,
                            ),
                            pointerEvents: "none",
                            zIndex: 3,
                            transform: getDoorRotation(tile.door.orientation),
                          }}
                        />
                      )}
                      {tile.door.trapped && !tile.door.locked && (
                        <img
                          src={trapImg}
                          alt="trap"
                          className="door-symbol-overlay"
                          style={{
                            position: "absolute",
                            ...getDoorIconPosition(
                              tile.door.orientation,
                              "trap",
                              false,
                            ),
                            pointerEvents: "none",
                            zIndex: 3,
                            transform: getDoorRotation(tile.door.orientation),
                          }}
                        />
                      )}
                      {tile.door.locked && tile.door.trapped && (
                        <>
                          <img
                            src={lockImg}
                            alt="lock"
                            className="door-symbol-overlay"
                            style={{
                              position: "absolute",
                              ...getDoorIconPosition(
                                tile.door.orientation,
                                "lock",
                                true,
                              ),
                              pointerEvents: "none",
                              zIndex: 3,
                              transform: getDoorRotation(tile.door.orientation),
                            }}
                          />
                          <img
                            src={trapImg}
                            alt="trap"
                            className="door-symbol-overlay"
                            style={{
                              position: "absolute",
                              ...getDoorIconPosition(
                                tile.door.orientation,
                                "trap",
                                true,
                              ),
                              pointerEvents: "none",
                              zIndex: 3,
                              transform: getDoorRotation(tile.door.orientation),
                            }}
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
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
