# Dungeon Map Generator

A React-based dungeon map generator that creates random 20x20 grid layouts using tileset images.

## Features

- **20x20 Grid Layout**: Generates dungeons with configurable dimensions
- **Random Generation**: Creates random wall and floor patterns with a minimum of 100 floor tiles
- **Tileset Support**: Uses 4x4 tileset images for varied tile appearances
- **Interactive Display**: Hover effects and tile information on mouse over
- **Responsive Design**: Adapts to different screen sizes
- **Modular Architecture**: Separated generation logic for easy testing and evolution

## Project Structure

```
adventure/
├── public/
│   ├── images/tilesets/
│   │   ├── light_cracked_stone.png    # Floor tileset
│   │   └── dark_stone_with_vines.png  # Wall tileset
│   └── index.html
├── src/
│   ├── components/
│   │   ├── DungeonMap.jsx             # Main dungeon display component
│   │   └── DungeonMap.css             # Component styles
│   ├── utils/
│   │   └── generateDungeon.js         # Dungeon generation logic
│   ├── App.js                         # Main app component
│   ├── App.css                        # App-level styles
│   ├── index.js                       # React entry point
│   └── index.css                      # Global styles
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 24.3.0 (specified in `.tool-versions`)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start the development server:

```bash
npm start
```

The application will open at `http://localhost:3000`

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## How It Works

### Dungeon Generation

The `generateDungeon.js` utility creates dungeons by:

1. **Grid Creation**: Creates a 20x20 grid
2. **Random Wall Placement**: Randomly places walls while ensuring at least 100 floor tiles remain
3. **Tile Variation**: Each tile uses a random section from the 4x4 tileset grid
4. **Background Positioning**: Uses CSS background positioning to display the correct tile section

### Tileset System

- **Floor Tiles**: Uses `light_cracked_stone.png` (4x4 grid of 32x32 pixel tiles)
- **Wall Tiles**: Uses `dark_stone_with_vines.png` (4x4 grid of 32x32 pixel tiles)
- **Random Selection**: Each tile randomly selects one of the 16 possible variations

### Component Architecture

- **DungeonMap**: Main component handling generation and display
- **generateDungeon**: Pure function utility for dungeon logic
- **getTileBackgroundPosition**: Helper for CSS background positioning

## Customization

### Changing Dungeon Size

Modify the `DungeonMap` component props:

```jsx
<DungeonMap width={30} height={30} minFloorTiles={200} />
```

### Adding New Tilesets

1. Add new tileset images to `public/images/tilesets/`
2. Update the `getTileStyle` function in `DungeonMap.jsx`
3. Ensure tilesets follow the 4x4 grid format (128x128 pixels total)

### Evolution Paths

The modular design allows for easy evolution to:

- **Cavern Generation**: Add cave-specific generation algorithms
- **Outdoor Maps**: Implement outdoor terrain generation
- **City Maps**: Add building and street generation
- **Procedural Content**: Add rooms, corridors, and features

## Technical Details

- **Grid System**: CSS Flexbox for responsive layout
- **Tile Rendering**: CSS background images with positioning
- **State Management**: React hooks for component state
- **Performance**: Efficient rendering with React keys and memoization

## Browser Support

- Modern browsers with ES6+ support
- Responsive design for mobile devices
- Graceful degradation for older browsers

## License

ISC License
