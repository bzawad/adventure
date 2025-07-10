# Dungeon Map Generator

A React-based dungeon map generator that creates random 60x60 grid layouts using tileset images, built with Vite.

## Features

- **60x60 Grid Layout**: Generates dungeons with configurable dimensions
- **Random Generation**: Creates random room and corridor patterns
- **Tileset Support**: Uses 4x4 tileset images for varied tile appearances
- **Interactive Display**: Hover effects and tile information on mouse over
- **Responsive Design**: Adapts to different screen sizes
- **Modular Architecture**: Separated generation logic for easy testing and evolution

## Project Structure

```
adventure/
├── public/
│   └── images/tilesets/
│       ├── light_cobblestone.png    # Floor tileset
│       └── dark_cobblestone.png  # Wall tileset
├── src/
│   ├── components/
│   │   ├── DungeonMap.jsx             # Main dungeon display component
│   │   └── DungeonMap.css             # Component styles
│   ├── utils/
│   │   └── generateDungeon.js         # Dungeon generation logic
│   ├── App.jsx                        # Main app component
│   ├── App.css                        # App-level styles
│   ├── main.jsx                       # React entry point
│   └── index.css                      # Global styles
├── index.html                         # Vite entry point
├── vite.config.js                     # Vite configuration
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
npm run dev
```

Or use the provided scripts:

```bash
bash start.sh  # Start the server
bash stop.sh   # Stop the server
```

The application will open at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `bash checks.sh` - Run code quality checks (Prettier, ESLint, TypeScript, Vite build, npm audit)

## How It Works

### Dungeon Generation

The `generateDungeon.js` utility creates dungeons by:

1. **Grid Creation**: Creates a 60x60 grid
2. **Room Generation**: Randomly places 4-8 rooms of varying sizes
3. **Corridor Connection**: Connects rooms with corridors
4. **Tile Variation**: Each tile uses a random section from the 4x4 tileset grid
5. **Background Positioning**: Uses CSS background positioning to display the correct tile section

### Tileset System

- **Floor Tiles**: Uses `light_cobblestone.png` (4x4 grid of 32x32 pixel tiles)
- **Wall Tiles**: Uses `dark_cobblestone.png` (4x4 grid of 32x32 pixel tiles)
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

- **Build Tool**: Vite for fast development and optimized builds
- **Grid System**: CSS Flexbox for responsive layout
- **Tile Rendering**: CSS background images with positioning
- **State Management**: React hooks for component state
- **Performance**: Efficient rendering with React keys and memoization
- **Testing**: Vitest for unit testing

## Browser Support

- Modern browsers with ES6+ support
- Responsive design for mobile devices
- Graceful degradation for older browsers

## License

ISC License
