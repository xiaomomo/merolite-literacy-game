## Cursor Cloud specific instructions

This is a pure static HTML/CSS/JS game (no build tools, no package manager, no frameworks). The only external dependency is Python Playwright for testing.

### Running the app

Serve the project root via any static HTTP server:

```
python3 -m http.server 8080
```

Then open http://localhost:8080/ in a browser.

### Testing

The test file `test_game.py` uses Playwright (Python). Install with:

```
pip3 install playwright && playwright install chromium && playwright install-deps chromium
```

Note: `test_game.py` uses `headless=False` and port 8081 by default. For headless CI testing, modify those values or write your own Playwright script against port 8080.

### Key architecture notes

- `src/game.js` — Single-class game engine (`AdventureGame`). All game state lives in `this.state` and is persisted to `localStorage`.
- `data/wordData.js` — 200 Chinese characters across 10 themed levels (20 chars each). Islands 1-5 map to level groups `[1,2]`, `[3,4]`, `[5]`, `[6,7]`, `[8,9,10]`.
- `styles/main.css` — Pink-themed responsive CSS. No preprocessor.
- All user-facing dialogs use the in-game modal system (`#game-modal` / `showGameModal()`), not `alert()`/`confirm()`.
