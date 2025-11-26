# 🧱 BrickBreaker2500

A classic brick breaker game built with vanilla HTML5 Canvas and JavaScript. Break all the bricks to advance through increasingly challenging levels!

![BrickBreaker2500](https://img.shields.io/badge/Game-Brick%20Breaker-blue)
![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)

##  Play the Game

Simply open `index.html` in a modern web browser to play!

##  Controls

### Desktop
- ** /  Arrow Keys** or **A / D** - Move paddle left/right
- **Space** - Launch ball / Shoot lasers (when powered up)
- **P** - Pause game
- **Escape** - Pause game / Return to menu

### Mobile/Touch
- **Tap left/right side of screen** - Move paddle in that direction
- **Tap center** - Launch ball / Shoot lasers

##  Brick Types

| Brick | Hits | Points | Special |
|-------|------|--------|---------|
|  Normal | 1 | 10 | Standard brick |
|  Strong | 2 | 20 | Takes 2 hits to break |
|  Super | 3 | 30 | Takes 3 hits to break |
|  Metal |  | 0 | Indestructible obstacle |
|  Power | 1 | 50 | Always drops a power-up |
|  Explosive | 1 | 25 | Explodes and damages neighbors |
|  Rainbow | 1 | 100 | Rare, high-value brick |

##  Power-Ups

| Power-Up | Duration | Effect |
|----------|----------|--------|
|  Multi-Ball | Instant | Splits ball into 3 balls |
|  Extend | 15s | Makes paddle wider |
|  Shrink | 15s | Makes paddle narrower (avoid!) |
|  Sticky | 20s | Ball sticks to paddle on contact |
|  Laser | 20s | Paddle can shoot lasers with Space |
|  Mega Ball | 15s | Ball breaks all bricks in path |
|  Slow | 10s | Slows ball movement |
|  Fast | 10s | Speeds up ball (avoid!) |
|  Extra Life | Instant | Gain one life |
| 2 2X Score | 15s | Double all points earned |

##  Scoring System

- **Base Points**: Each brick has base point value
- **Combo System**: Hit multiple bricks without paddle contact for multipliers
  - 5+ hits: 1.5x multiplier
  - 10+ hits: 2x multiplier
  - 15+ hits: 3x multiplier (MAX)
- **Level Bonus**: Remaining lives  500 points per level cleared
- **Power-Up Bonus**: 2X Score power-up doubles all points

##  Levels

The game features:
- **Levels 1-10**: Hand-crafted layouts with unique patterns
- **Level 11+**: Procedurally generated with increasing difficulty
- Each level introduces new brick types and patterns
- Difficulty scales with more durable bricks and complex layouts

##  High Scores

- Top 100 scores are saved locally
- Enter your name (up to 8 characters) when you achieve a high score
- Scores persist between browser sessions using localStorage

##  Technical Details

### Architecture

```
BrickBreaker2500/
 index.html              # Main game page
 css/
    style.css           # Styling and animations
 js/
     game.js             # Main game controller
     physics.js          # Collision detection
     input.js            # Input handling
     renderer.js         # Canvas rendering
     audio.js            # Web Audio API sounds
     highscores.js       # Score persistence
     entities/
        Ball.js         # Ball entity
        Paddle.js       # Paddle entity
        Brick.js        # Brick types and behavior
     systems/
        LevelManager.js # Level loading and generation
        PowerUpManager.js # Power-up spawning and effects
        ScoreManager.js # Scoring and combos
     utils/
         Vector2.js      # 2D vector math
         ObjectPool.js   # Object pooling and particles
```

### Technologies

- **HTML5 Canvas**: 2D rendering
- **Vanilla JavaScript**: No frameworks or dependencies
- **Web Audio API**: Procedural sound effects
- **localStorage**: High score persistence
- **CSS3**: Animations and responsive design

### Browser Support

Works in all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

##  Features

-  Classic brick breaker gameplay
-  7 unique brick types
-  10 different power-ups
-  Combo-based scoring system
-  10 hand-designed levels + procedural generation
-  Particle effects and visual polish
-  Procedural audio with Web Audio API
-  Touch controls for mobile
-  Responsive design
-  High score leaderboard (Top 100)
-  No external dependencies

##  License

MIT License - Feel free to use, modify, and share!

##  Tips

1. **Keep the combo going** - Try not to hit the paddle to build up multipliers
2. **Prioritize power bricks** - Purple bricks always drop power-ups
3. **Watch for explosive bricks** - Red bricks can chain react for big combo points
4. **Save the sticky power-up** - Great for precise aiming at remaining bricks
5. **Avoid red power-ups** - Shrink and Fast are negative effects!

---

Made with  using HTML5 Canvas and JavaScript
