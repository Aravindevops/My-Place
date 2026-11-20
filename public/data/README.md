# Play Page Data Management

You can easily manage your watch collection and music playlist using one of the two methods below.

---

### Option 1: Edit `public/data/playData.json` (Recommended & Ready to Use)
Open `public/data/playData.json` (or `src/data/playData.json`) in your editor. It is formatted in plain, readable JSON.

#### Adding a Movie / Series / Anime:
Copy & paste a block inside the `"watch"` array:
```json
{
  "category": "movies",
  "title": "Interstellar",
  "year": 2014,
  "rating": 9.6,
  "creator": "Christopher Nolan",
  "poster": "interstellar.jpg",
  "note": "Love transcends dimensions of time and space."
}
```
* **Poster image**:
  - Put your poster in `public/posters/` (e.g. `interstellar.jpg`), OR
  - Paste any online image URL (e.g. `https://...`).

---

#### Adding a Song to a Playlist:
Find your playlist under `"music"` (`Favourites`, `Focus`, `Late night`) and add:
```json
{
  "title": "Midnight City",
  "artist": "M83",
  "duration": "4:03",
  "audio": "midnight-city.mp3"
}
```
* **Audio file**:
  - Put your MP3 file in `public/music/` (e.g. `midnight-city.mp3`), OR
  - Paste an external audio URL (e.g. `https://...`), OR
  - Leave `"audio": ""` to enjoy the ambient lo-fi synthesized chimes!

---

### Option 2: Cloud Database (Google Firebase Firestore)
If you want to edit your movies and playlist live from your phone or browser without touching code or redeploying:

1. Create a free Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
2. Enable Firestore Database in test/production mode.
3. In your project root, create a `.env` file with:
   ```env
   VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
   ```
4. In Firestore, create two collections:
   - `watch`: Documents with fields `category`, `title`, `year`, `rating`, `creator`, `poster`, `note`
   - `music`: Documents with fields `playlist`, `title`, `artist`, `duration`, `audio`

The website will automatically fetch directly from your Firebase Firestore cloud database!
If no Firebase project ID is set, it automatically uses `playData.json`.

---

### Secret Personal Editor (Invisible to Visitors)
- Normal visitors see **NO** edit or add button anywhere.
- For your personal convenience while viewing the portfolio, press `Ctrl + Shift + E` (or visit `?admin=true` in the URL) to toggle the private preview editor.

