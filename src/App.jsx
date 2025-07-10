import React, { useState } from "react";
import ThemeMap from "./components/ThemeMap.jsx";
import "./App.css";

export default function App() {
  const [mapType, setMapType] = useState("dungeon"); // "dungeon", "cavern", "outdoor", "outdoor_hex", "cavern_hex", or "city"

  return (
    <div className="App">
      <div className="map-type-selector">
        <button
          className={`type-button ${mapType === "dungeon" ? "active" : ""}`}
          onClick={() => setMapType("dungeon")}
        >
          Dungeon
        </button>
        <button
          className={`type-button ${mapType === "cavern" ? "active" : ""}`}
          onClick={() => setMapType("cavern")}
        >
          Cavern
        </button>
        <button
          className={`type-button ${mapType === "outdoor" ? "active" : ""}`}
          onClick={() => setMapType("outdoor")}
        >
          Outdoor
        </button>
        <button
          className={`type-button ${mapType === "outdoor_hex" ? "active" : ""}`}
          onClick={() => setMapType("outdoor_hex")}
        >
          Outdoor Hex
        </button>
        <button
          className={`type-button ${mapType === "cavern_hex" ? "active" : ""}`}
          onClick={() => setMapType("cavern_hex")}
        >
          Cavern Hex
        </button>
        <button
          className={`type-button ${mapType === "city" ? "active" : ""}`}
          onClick={() => setMapType("city")}
        >
          City
        </button>
      </div>
      <ThemeMap mapType={mapType} />
    </div>
  );
}
