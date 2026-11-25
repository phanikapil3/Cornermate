# Browser tests (optional, Linux/macOS)
Real-browser tests of the 3D coach (layout, clipping, camera controls, every movement's pose). They are NOT needed to run the app.

1. `npm i --no-save @sparticuz/chromium puppeteer-core pngjs` (a self-contained headless Chromium; software WebGL, so it is slow)
2. Start the app: `npm run dev -- --port 5173 --host 127.0.0.1`
3. In another terminal: `node scripts/browser-tests/suite.mjs layout` (also: `camera`, `camera2`, `moves 0-5`)
   Pose capture of all movements: write movement ids to /tmp/ids.json, then `node scripts/browser-tests/allposes.mjs capture 0-11` ... `analyze`.

Notes: images are written to /tmp. The tests use development-only hooks (`window.__coachCtl`, `__coachPlayer`, `__coachFreeze`) that exist only in `npm run dev`, never in a production build.
