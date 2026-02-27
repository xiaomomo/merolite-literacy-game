## Cursor Cloud specific instructions

HTML/CSS/JS game with a Node.js (Express) backend and SQLite database.

### Running the app

```
npm install
node server.js
```

Server starts on http://localhost:8080 (serves static files + REST API).

### Testing

The test file `test_game.py` uses Playwright (Python). Install with:

```
pip3 install playwright && playwright install chromium && playwright install-deps chromium
```

Note: `test_game.py` uses `headless=False` and port 8081 by default. For headless CI testing, modify those values or write your own Playwright script against port 8080.

### Key architecture notes

- `server.js` — Express server. Serves static files and REST API (`/api/players`, `/api/players/:id/state`). Uses `better-sqlite3` for persistence to `game.db`.
- `src/game.js` — Single-class game engine (`AdventureGame`). State syncs to both `localStorage` (fast cache) and the server (persistent). Player ID stored in `localStorage` under `merolite-player-id`.
- `data/wordData.js` — 200 Chinese characters across 10 themed levels (20 chars each). Islands 1-5 map to level groups `[1,2]`, `[3,4]`, `[5]`, `[6,7]`, `[8,9,10]`.
- `styles/main.css` — Pink-themed responsive CSS. No preprocessor.
- All user-facing dialogs use the in-game modal system (`#game-modal` / `showGameModal()`), not `alert()`/`confirm()`.
- `game.db` is gitignored; it is auto-created on first server start.
