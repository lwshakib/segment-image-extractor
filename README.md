# Segment Image Extractor

A powerful Chrome extension that extracts, analyzes, and manages images from web pages with advanced filtering, sorting, and bulk download capabilities.

![Extension Icon](public/icon128.png)

![Demo](public/demo.gif)

## 🚀 Features

### Core Functionality

- **Image Extraction**: Automatically extracts all images from the current web page
- **Side Panel Interface**: Clean, modern UI accessible via Chrome's side panel
- **Real-time Analysis**: Displays image metadata including dimensions, file size, and MIME type
- **Smart Filtering**: Filter images by size, format, and dimensions
- **Advanced Sorting**: Sort by file size, width, height, dimensions, or MIME type

### Image Management

- **Bulk Selection**: Select multiple images for batch operations
- **Individual Downloads**: Download single images with one click
- **Bulk Downloads**: Download multiple selected images simultaneously
- **URL Copying**: Copy image URLs to clipboard
- **External Viewing**: Open images in new tabs for full-size viewing

### Export Capabilities

- **CSV Export**: Export selected image data in CSV format
- **JSON Export**: Export selected image data in JSON format
- **Metadata Preservation**: Maintains all image information in exports

### User Experience

- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Responsive Design**: Optimized for different screen sizes
- **Loading States**: Smooth loading animations and skeleton screens
- **Error Handling**: Graceful fallbacks when image extraction fails

## 📦 Installation

### From Source (Development)

1. **Clone the repository**

   ```bash
   git clone https://github.com/lwshakib/segment-image-extractor.git
   cd segment-image-extractor
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the extension**

   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder from the build output

### From Release Package

1. Download the latest release ZIP file from the releases page
2. Extract the ZIP file
3. Follow steps 4-5 from the development installation above

## 🛠️ Development

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Chrome browser

### Available Scripts

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
segment-image-extractor/
├── src/
│   ├── background.ts          # Service worker for extension logic
│   ├── content/
│   │   ├── main.tsx          # Content script for page interaction
│   │   └── views/
│   │       └── App.tsx       # Content script UI
│   ├── sidepanel/
│   │   ├── App.tsx           # Main side panel interface
│   │   ├── main.tsx          # Side panel entry point
│   │   └── index.html        # Side panel HTML template
│   ├── popup/                # Extension popup (if needed)
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Base UI components (buttons, selects, etc.)
│   │   ├── mode-toggle.tsx  # Theme toggle component
│   │   └── theme-provider.tsx # Theme context provider
│   └── lib/
│       └── utils.ts         # Utility functions
├── public/                  # Static assets and icons
├── manifest.config.ts       # Extension manifest configuration
├── vite.config.ts          # Vite build configuration
└── package.json            # Project dependencies and scripts
```

### Key Technologies

- **React 19**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible UI primitives
- **Lucide React**: Beautiful icon library
- **Chrome Extension APIs**: Native browser extension capabilities

## 🎯 Usage

### Basic Usage

1. **Navigate to any webpage** with images
2. **Click the extension icon** in your Chrome toolbar
3. **The side panel will open** showing all extracted images
4. **Browse and interact** with the images using the provided tools

### Advanced Features

#### Filtering Images

- Use the **Size** dropdown to filter by specific dimensions
- Use the **Format** dropdown to filter by image type (JPEG, PNG, etc.)
- Combine filters for precise results

#### Sorting Options

- **File Size**: Sort by actual file size (largest/smallest first)
- **Width/Height**: Sort by image dimensions
- **Dimensions**: Sort by total pixel area
- **MIME Type**: Sort alphabetically by file type

#### Bulk Operations

1. **Select images** using the checkboxes
2. **Use bulk actions** that appear at the bottom of the panel:
   - Download all selected images
   - Export as CSV
   - Export as JSON

#### Individual Image Actions

- **Download**: Save the image to your computer
- **Copy URL**: Copy the image URL to clipboard
- **Open in new tab**: View the full-size image

## 🔧 Configuration

### Manifest Settings

The extension uses Manifest V3 and includes the following permissions:

- `sidePanel`: Access to Chrome's side panel API
- `activeTab`: Access to the currently active tab
- `scripting`: Ability to inject scripts into web pages
- `host_permissions`: Access to all URLs for image extraction

### Build Configuration

The project uses Vite with the following plugins:

- `@crxjs/vite-plugin`: Chrome extension development
- `@vitejs/plugin-react`: React support
- `@tailwindcss/vite`: Tailwind CSS integration
- `vite-plugin-zip-pack`: Automatic ZIP packaging for releases

## 🐛 Troubleshooting

### Common Issues

**Extension not loading images**

- Ensure you're on a webpage with images
- Check that the page has fully loaded
- Try refreshing the page and clicking the refresh button in the side panel

**Images not downloading**

- Check your browser's download settings
- Ensure the image URLs are accessible
- Some images may be protected by CORS policies

**Side panel not opening**

- Verify the extension is properly installed
- Check Chrome's extension permissions
- Try disabling and re-enabling the extension

### Debug Mode

For development debugging:

1. Open Chrome DevTools
2. Go to the Extensions page (`chrome://extensions/`)
3. Click "Inspect views" for the side panel
4. Use the console to debug issues

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Maintain accessibility standards
- Add proper error handling
- Include loading states for async operations
- Test on multiple websites and image types

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
