# Bubble Bounce Blitz 🫧🎮

A fun, fast-paced 2D browser game where you tap to launch bouncing bubbles upward through moving platforms!

## 🎯 Game Concept

Tap to launch a bouncing bubble upward through moving platforms. Some platforms break, some boost, and some reverse gravity. Score points for each platform reached and see how high you can go!

## ✨ Features

- **Rainbow Platforms:** Special platforms that split your bubble into two - control both for bonus points!
- **Dynamic Platforms:** Platforms that break, boost, or reverse gravity
- **Progressive Difficulty:** The higher you go, the trickier it gets (Easy → Medium → Hard → Expert)
- **High Score System:** Compete with friends for the highest altitude
- **Particle Effects:** Visual feedback for all actions
- **Sound Effects:** Procedurally generated audio feedback
- **Mobile Optimized:** Touch controls with gesture detection

## 🎮 How to Play

- **Tap/Click:** Launch bubble upward
- **Avoid:** Falling off the screen
- **Collect:** Hit rainbow platforms to split your bubble
- **Score:** Each platform reached = points (multiplied by difficulty level)
- **Challenge:** Try to keep both bubbles alive when split!

## 🎨 Platform Types

| Platform | Color | Effect |
|----------|-------|--------|
| Normal | 🟢 Green | Standard bounce |
| Breaking | 🔴 Red | Breaks after one hit |
| Boost | 🟡 Yellow | Super jump! |
| Reverse | 🟣 Purple | Reverses gravity for 3 seconds |
| Rainbow | 🌈 Multi | Splits bubble into two! |

## 🚀 Why It's Fun

- **Fast-paced:** Quick rounds perfect for short breaks
- **Easy to learn:** Simple tap controls anyone can master
- **Hilarious:** Managing two bubbles at once creates chaotic fun
- **Competitive:** Great for challenging friends
- **Addictive:** "Just one more try" gameplay

## 🛠 Tech Stack

- **Frontend:** HTML5 Canvas, CSS3, Vanilla JavaScript
- **Architecture:** Event-driven, Component-based systems
- **Audio:** Web Audio API with procedural sound generation
- **Deployment:** GitHub Pages or Netlify
- **Mobile-Friendly:** Touch controls with gesture detection
- **Browser-Based:** No downloads required

## 🏗 Architecture

The game uses a modern, event-driven architecture:

```
js/
├── core/           # Core systems
│   ├── EventBus.js       # Central event system
│   ├── ConfigManager.js  # Game configuration
│   ├── EntityManager.js  # Entity lifecycle
│   ├── DifficultyManager.js  # Progressive difficulty
│   ├── TouchManager.js   # Mobile touch controls
│   └── PerformanceManager.js # FPS monitoring
├── systems/        # Game systems
│   ├── PhysicsSystem.js   # Physics calculations
│   ├── CollisionSystem.js # Collision detection
│   ├── RenderSystem.js    # Canvas rendering
│   ├── AudioSystem.js     # Sound effects
│   └── ParticleSystem.js  # Visual effects
├── entities/       # Game entities
│   ├── Bubble.js    # Player bubble
│   ├── Platform.js  # Platform types
│   └── Particle.js  # Visual particles
├── utils/          # Utilities
│   ├── Vector2.js   # 2D vector math
│   └── ObjectPool.js # Object pooling
└── game.js         # Main game controller
```

## 📋 Implemented Features

- [x] Basic bubble physics with gravity
- [x] Platform system (normal, breaking, boost, gravity-reverse)
- [x] Rainbow platform bubble splitting
- [x] Score system with difficulty multipliers
- [x] High score leaderboard (Top 100)
- [x] Sound effects (procedural Web Audio)
- [x] Mobile touch controls
- [x] Particle effects
- [x] Progressive difficulty scaling
- [x] Performance auto-adjustment

## 🎯 Difficulty Levels

| Level | Score | Platform Gap | Platform Speed |
|-------|-------|--------------|----------------|
| Easy | 0+ | 100% | 1x |
| Medium | 500+ | 85% | 1.5x |
| Hard | 1500+ | 70% | 2x |
| Expert | 3000+ | 60% | 2.5x |

## 🚀 Getting Started

1. Clone the repository
2. Open `index.html` in a modern browser
3. Click "Start Game" and tap to jump!

```bash
# Clone the repo
git clone https://github.com/yourusername/Bubble-Bounce-Blitz.git

# Open in browser
cd Bubble-Bounce-Blitz
start index.html  # Windows
open index.html   # macOS
```

## 🎮 Controls

| Input | Action |
|-------|--------|
| Click/Tap | Jump |
| Space | Jump |
| Arrow Up | Jump |

## 📱 Mobile Support

- Optimized touch controls
- Prevents accidental zoom/scroll
- Responsive canvas sizing
- Gesture detection for swipes

## 🔧 Configuration

Game settings can be modified in `assets/config/gameConfig.json`:

- Physics parameters (gravity, jump strength)
- Platform probabilities and colors
- Difficulty thresholds
- Particle settings
- Audio volumes

## 📄 License

MIT License - Feel free to fork and create your own bubble game!

---

*Let's make some bubbles bounce! 🫧⬆️*