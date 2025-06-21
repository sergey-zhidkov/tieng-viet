# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TiengViet is a Vietnamese-English pop-up dictionary browser extension, forked from the popular Zhongwen Chinese dictionary extension. It provides hover-based translation of Vietnamese words using the VNEDICT dictionary, with color-coded tone visualization for Vietnamese words.

## Development Commands

### Build & Development
- `npm run build` - Compile TypeScript and copy assets to `dist/`
- `npm run watch` - Watch TypeScript files for changes and recompile
- `npm run copy-assets` - Copy static assets (HTML, CSS, images, data) to `dist/`

### Code Quality
- `npm run lint` - Run ESLint on TypeScript files
- `npm run lint:fix` - Run ESLint with automatic fixes
- `npm run format` - Format TypeScript files with Prettier
- `npm run csslint` - Lint CSS files with stylelint

### Browser Extension Testing
- Use `web-ext` for Firefox testing (included in devDependencies)
- For Chrome: Load unpacked extension from `dist/` folder after running `npm run build`

## Architecture

### Core Components

**Background Script (`background.ts`)**
- Service worker that manages extension state and dictionary loading
- Handles message passing between content scripts and background
- Manages extension activation/deactivation via browser action
- Loads and parses VNEDICT dictionary (`data/vnedict.txt`)
- Implements `TiengvietDictionary` class for Vietnamese word lookup

**Content Script (`content.ts`)**
- Injected into all web pages when extension is active
- Handles mouse movement detection and word selection
- Creates pop-up dictionary display with Vietnamese tone colors
- Implements text extraction across DOM nodes with word boundary detection
- Manages keyboard shortcuts (c=copy, x/y=move popup, etc.)

**Dictionary Data**
- Uses VNEDICT Vietnamese-English dictionary in `data/vnedict.txt`
- Dictionary parsed into key-value format: `vietnamese_word : english_translation`
- Supports multi-word lookup with progressive shortening algorithm

### Key Features

**Vietnamese Tone Detection**
- `detectVietnameseTone()` function analyzes Unicode combining characters
- Maps tone marks to CSS classes: tone1-tone6 (sắc, huyền, hỏi, ngã, nặng, ngang)
- Color-coded display configurable via options

**Text Processing**
- Word boundary detection for accurate Vietnamese word segmentation
- Handles special cases like Google Docs zero-width non-joiner characters
- Cross-element text extraction for words spanning multiple DOM nodes

**Options & Configuration**
- `options.ts` and `wordlist.ts` are currently commented out (legacy from Zhongwen)
- Configuration stored in Chrome storage API
- Options include popup colors, font sizes, tone color schemes

## File Structure

```
src/
├── background.ts          # Service worker & dictionary management
├── content.ts            # Content script for word detection & popup
├── manifest.json         # Extension manifest (v3)
├── js/
│   ├── options.ts       # Settings page (currently disabled)
│   └── wordlist.ts      # Word list management (currently disabled)
├── css/                 # Styling for popup and content
├── data/
│   └── vnedict.txt     # Vietnamese-English dictionary
├── images/             # Extension icons
└── *.html             # Options, help, and wordlist pages
```

## Development Notes

### TypeScript Configuration
- Two tsconfig files: main `tsconfig.json` and `tsconfig.content.json`
- Targets ES6 with DOM and ES2022 lib support
- Strict mode enabled (except nullChecks)
- Output to `dist/` directory

### Browser Compatibility
- Manifest v3 for modern Chrome/Edge
- Firefox support via `browser_specific_settings` in manifest
- Uses both Chrome extension APIs and standard web APIs

### Dictionary Search Algorithm
- Implements progressive text shortening for multi-word lookup
- Starts with full text, removes words/characters until match found
- Prioritizes longest matches for better accuracy
- Handles Vietnamese word boundaries and punctuation