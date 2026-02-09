# PuzzleMaster

A React + Vite jigsaw puzzle app that turns any image into an interactive puzzle board.

## Features

- Upload your own image or use a demo image
- Easy / Medium / Hard difficulty presets
- Drag-to-place puzzle pieces with snap detection
- Mouse wheel zoom and drag-to-pan on the canvas
- Header progress bar that fills with completion percentage
- Built-in audio player
- Theme controls with dark mode + accent hue customization

## Project Structure

```text
src/
  App.tsx
  main.tsx
  components/
    AudioPlayer.tsx
    FileUpload.tsx
    PuzzleCanvas.tsx
    ThemeCustomizer.tsx
  types/
    index.ts
  utils/
    puzzleGenerator.ts
```

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the local URL shown in the terminal (default: `http://localhost:3000`).

## Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```
