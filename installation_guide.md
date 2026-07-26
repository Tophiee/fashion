# Installation Guide

The Wardrobe Research Prototype requires no complex build tools, `npm`, or server infrastructure to run locally for development or pilot testing.

## Local Development Setup

1. **Clone or Download the Repository**
   Ensure all files are placed in a local directory.

2. **Serve the Directory**
   Because the application fetches `assets/mock-data.json` via the Fetch API, opening `index.html` directly from the file system (`file:///`) may cause CORS policy errors in some browsers. It is highly recommended to serve the directory over a local HTTP server.

   **Using Node.js (npx):**
   ```bash
   npx serve .
   ```

   **Using Python 3:**
   ```bash
   python3 -m http.server 8000
   ```

   **Using VS Code:**
   Install the "Live Server" extension and click "Go Live" from the bottom right corner of the window.

3. **Access the Application**
   Open your browser and navigate to `http://localhost:3000` (or whichever port your local server provides).

## Modifying the Code
- **HTML Framework**: All views are defined within `<template>` tags in `index.html`.
- **CSS Styling**: All styles are in `css/main.css`. The application uses CSS variables (`:root`) for easy theming.
- **JavaScript Modules**: 
  - Edit `js/views.js` to change behavior on specific screens.
  - Edit `js/state.js` to add new data fields to the tracking model.
