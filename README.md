# Favorite+ for wplace.live

A userscript that enhances the favoriting system on [wplace.live](https://wplace.live) with custom labels, visual markers, and advanced management features.

## ✨ Features

- 🏷️ **Custom Labels**: Add personalized titles to your favorite locations
- 📍 **Visual Markers**: See all your favorites as interactive markers on the map
- 📋 **Favorites List**: Manage all your favorites in a convenient table interface
- 🎯 **Quick Navigation**: Click markers or use the favorites list to fly to locations
- 💾 **Persistent Storage**: Your favorites are saved locally in your browser
- ➕ **Zoom-Adaptive**: Markers adjust opacity based on zoom level for better visibility
- 🗑️ **Easy Management**: Add, remove, and organize your favorites with simple controls
- 🔍 **Dynamic Search**: Search across all your favorites for quick access

## 🚀 Installation

### Prerequisites
You need a userscript manager extension installed in your browser:
- [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge)
- [Greasemonkey](https://www.greasespot.net/) (Firefox)
- [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)

### Install the Script
1. **Direct Installation**: [Click here to install](https://github.com/allanf181/wplace-favorite-plus/raw/refs/heads/master/wplace-favorite+.user.js)
2. **Manual Installation**:
   - Copy the content of `wplace-favorite+.user.js`
   - Open your userscript manager
   - Create a new script and paste the content
   - Save the script

## 🎮 How to Use

### Adding Favorites
1. Navigate to any location on [wplace.live](https://wplace.live)
2. Click on a pixel to open the pixel info panel
3. Look for the **"Fav+"** button (⭐) next to the regular favorite button
4. Click the **"Fav+"** button
5. Enter a custom title for your favorite location
6. The location is now saved with your custom label!

### Managing Favorites
1. Open the favorites panel by clicking the **favorites list button** (📋)
2. View all your saved favorites in a table format showing:
   - Custom title
   - Coordinates (tile, pixel, and map coordinates)
   - Action buttons (Fly, Delete)
3. **Fly to Location**: Click the "Fly" button to navigate to a favorite
4. **Delete Favorite**: Click the "Delete" button to remove a favorite (with confirmation)

### Visual Markers
- All your favorites appear as **yellow star markers** (⭐) on the map
- Markers are interactive - click them to fly to that location
- Markers automatically adjust opacity based on zoom level
- Hover over markers to see the custom title as a tooltip

## 🔧 Technical Details

### Dependencies
- [MapLibre GL JS](https://maplibre.org/) v5.6.2+ - For map marker functionality

### Storage
- Favorites are stored in your browser's `localStorage`
- Data persists across browser sessions
- Format: JSON array with title and position data

### Compatibility
- **Supported Sites**: wplace.live
- **Browsers**: Chrome, Firefox, Safari, Edge (with userscript manager)
- **Updates**: Auto-updates from GitHub repository

### Position Tracking
The script tracks three types of coordinate data for precise location management:
- **Tile Coordinates**: Grid-based tile position
- **Pixel Coordinates**: Exact pixel position within tiles  
- **Map Coordinates**: Latitude/longitude for map display

## 🛠️ Development

### File Structure
```
wplace-favorite-plus/
├── wplace-favorite+.user.js    # Main userscript file
├── README.md                   # This documentation
└── .gitignore                 # Git ignore rules
```

### Key Functions
- `addFavorite(title, posObj)` - Save a new favorite location
- `removeFavorite(posObj)` - Remove a favorite by position
- `createMarker(coords, name)` - Create a visual marker on the map
- `loadFavoritesTable()` - Populate the favorites management interface

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on wplace.live
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the userscript header for details.

## 🔗 Links

- **Homepage**: [GitHub Repository](https://github.com/allanf181/wplace-favorite-plus)
- **Raw Script**: [Direct Download](https://github.com/allanf181/wplace-favorite-plus/raw/refs/heads/master/wplace-favorite+.user.js)
- **Target Site**: [wplace.live](https://wplace.live)

## 📞 Support

If you encounter any issues or have suggestions:
1. Check the browser console for error messages
2. Ensure your userscript manager is up to date
3. Try disabling other userscripts that might conflict
4. [Open an issue](https://github.com/allanf181/wplace-favorite-plus/issues) on GitHub
