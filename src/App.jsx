import React, { useState } from "react";
import ThemeMap from "./components/ThemeMap.jsx";
import "./App.css";

export default function App() {
  const [mapType, setMapType] = useState("dungeon"); // "dungeon", "cavern", "outdoor", or "city"

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
        <button
          className={`type-button ${mapType === "outdoor" ? "active" : ""}`}
          onClick={() => setMapType("outdoor")}
        >
          Outdoor Generator
        </button>
        <button
          className={`type-button ${mapType === "city" ? "active" : ""}`}
          onClick={() => setMapType("city")}
        >
          City Generator
        </button>
      </div>
      <ThemeMap mapType={mapType} />
    </div>
  );
}
