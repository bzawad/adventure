import React, { useState } from "react";
import DungeonMap from "./components/DungeonMap.jsx";
import "./App.css";

export default function App() {
  const [mapType, setMapType] = useState("dungeon"); // "dungeon" or "cavern"

  return (
    <div className="App">
      <div className="map-type-selector">
        <button
          className={`type-button ${mapType === "dungeon" ? "active" : ""}`}
          onClick={() => setMapType("dungeon")}
        >
          Dungeon Generator
        </button>
        <button
          className={`type-button ${mapType === "cavern" ? "active" : ""}`}
          onClick={() => setMapType("cavern")}
        >
          Cavern Generator
        </button>
      </div>
      <DungeonMap mapType={mapType} />
    </div>
  );
}
