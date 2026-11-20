# Aravind Babu — Portfolio

A high-performance, interactive portfolio built with **React + Vite**, featuring custom typography, fluid canvas ASCII animations, smooth sticky scroll interactions, and decrypted text transitions.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start local development server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Build for production
```bash
npm run build
```
The optimized production files will be output to the `dist/` directory, ready to deploy to Vercel, Netlify, GitHub Pages, or any static host.

---

## 📁 Project Structure

```
my-p/
├── public/
│   └── profile.jpg         # Profile image (replace with your own photo!)
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Loader.jsx      # Initial loader with spinning star & percentage counter
│   │   ├── Hero.jsx        # Big kinetic name, parallax photo & meta info
│   │   ├── About.jsx       # Sticky scroll bio with dynamic word brightening
│   │   ├── Work.jsx        # Project grid & projects data configuration
│   │   ├── AllWork.jsx     # Slide-over overlay with all portfolio works
│   │   ├── MoreAbout.jsx   # Detailed "More about me" full-screen overlay
│   │   ├── Contact.jsx     # Interactive ASCII wave canvas & contact links
│   │   └── Menu.jsx        # Fullscreen navigation menu overlay
│   ├── styles/
│   │   ├── fonts.css       # Custom embedded fonts (Dox, DoxLine)
│   │   └── global.css      # Core styles, CSS variables, animations & responsive media queries
│   ├── utils/
│   │   └── dtEffect.js     # Decrypted text animation utility
│   ├── App.jsx             # Main application orchestrator
│   └── main.jsx            # React root entry point
├── index.html              # HTML shell loading Google fonts
├── package.json
└── vite.config.js
```

---

## 🎨 Customization Guide

### 1. Change Profile Photo
Simply replace the image at:
```
public/profile.jpg
```
Any standard `.jpg` or `.png` (named `profile.jpg`) will automatically appear in both the Hero section and the "More About Me" drawer.

### 2. Update Projects
Open [`src/components/Work.jsx`](file:///c:/Users/ASUS/Downloads/my-p/src/components/Work.jsx) and edit the `PROJECTS` array:
```javascript
export const PROJECTS = [
  { t: 'Project One',   c: 'Web design',     y: '2026', k: 'a' },
  { t: 'Project Two',   c: 'Full stack',     y: '2026', k: 'b' },
  { t: 'Project Three', c: 'Graphic design', y: '2025', k: 'c' },
  // ...
]
```
- `t`: Project Title
- `c`: Category / Tag
- `y`: Year
- `k`: Color theme preset (`'a'`, `'b'`, `'c'`, `'d'`, `'e'`, `'f'`) defined in `global.css`

### 3. Update Social Links
- **Slide-out Menu**: Edit `SOCIAL_LINKS` in [`src/components/Menu.jsx`](file:///c:/Users/ASUS/Downloads/my-p/src/components/Menu.jsx)
- **Footer Contact**: Edit the social URLs in [`src/components/Contact.jsx`](file:///c:/Users/ASUS/Downloads/my-p/src/components/Contact.jsx)

### 4. Custom Colors & Theme
Color variables are located at the top of [`src/styles/global.css`](file:///c:/Users/ASUS/Downloads/my-p/src/styles/global.css):
```css
:root {
  --bg: #f2f2f2;     /* Canvas light background */
  --ink: #2535d0;    /* Primary brand cobalt blue */
  --sky: #e0f6ff;    /* Accent light sky */
}
```

### 5. Custom Fonts
- **Dox (`DoxW01-Regular.ttf`)**: Placed in `src/assets/fonts/DoxW01-Regular.ttf` and `public/fonts/DoxW01-Regular.ttf`, used for:
  - **Logo**: Header mark `AB`, modal headers, loader mark
  - **Name**: Kinetic headline `ARAVIND BABU`
  - **Menu**: Overlay navigation links (`Home`, `About`, `Work`, `Play`, `Contact`)
  - **Footer**: Giant `AB` background glyph
- **DoxLine**: Inline `@font-face` counter font
- **Google Fonts** (`Bebas Neue`, `Manrope`, `Anton`, `Geist Mono`): Loaded via `<link>` in [`index.html`](file:///c:/Users/ASUS/Downloads/my-p/index.html)

