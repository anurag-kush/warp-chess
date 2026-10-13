# Warp Chess (Two-Layer Chess)

> A tactical chess variant played across **two overlapping 8 × 8 floors** (8 × 8 × 2) featuring fixed **Warp Gates**, agile **Jump Pieces**, and same-floor attack geometry.

🎮 **Play Live Online:** [https://anurag-kush.github.io/warp-chess/](https://anurag-kush.github.io/warp-chess/)

---

## 🌟 Key Features

* **Dual 8×8 Boards (128 cells):**
  * **Floor 1 (Foundation):** Standard 16 chess pieces per player with familiar pawn lines.
  * **Floor 2 (Jump Ether):** 4 special Jump Pieces per player (Jump Bishop, Jump Knight, Jump Queen, Jump Rook).
* **🌀 Fixed Warp Gates (`c6`, `d3`, `e6`, `f3`):**
  * Landing on a Warp Gate triggers a mandatory teleport to the corresponding square on the opposite floor.
  * Resolves captures on the gate and any enemy unit occupying the destination!
  * Passing over without landing does not trigger the gate.
* **🚀 Jump Units (Marked with 'J' badge):**
  * Can make standard piece moves or use their turn to **Jump** vertically (`1e4 ↔ 2e4`) maintaining identical file and rank.
  * Jumps cannot attack across floors directly and are disabled while standing on a Warp Gate.
* **🏰 Special Castling:**
  * Regular Castling on Floor 1.
  * **Jump Rook Castling:** King moves 2 squares on Floor 1, and the Jump Rook leaps down from Floor 2 to the skipped square on Floor 1.
* **👑 Floor-Dependent Promotion:**
  * Promoted on Floor 1: Regular Piece.
  * Promoted on Floor 2: Jump Piece (capped at max 2 active per player).
* **🤖 Autonomous AI Bot:**
  * Play solo against the built-in bot (Easy, Medium, Hard with Minimax and Alpha-Beta pruning) or play local Pass & Play.
* **💬 Integrated Feedback Collection:**
  * Embedded feedback modal for playtesters to report bugs, rating, and balance suggestions.
* **🔊 Native Synthesizer Audio:**
  * Zero external sound asset dependencies; crisp audio effects generated via the Web Audio API.

---

## 🚀 Quick Start

### 1. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 2. Run Test Suite
```bash
npm test
```
Executes all 16 automated test suites covering the PRD Section 46 specifications.

### 3. Build for Production (Static Deployment)
```bash
npm run build
```
Creates an optimized static bundle in the `dist/` directory, ready to deploy directly to **GitHub Pages, Vercel, Netlify, or Cloudflare Pages**.

---

## 📁 Project Architecture

```text
src/
├── engine/               # Decoupled headless rules engine (zero UI dependencies)
│   ├── types.ts          # Core types and string coordinate notation ("1e4", "2c6")
│   ├── coords.ts         # Coordinate math, raycasting, and gate detection
│   ├── board.ts          # 128-cell board initialization and state serialization
│   ├── moveGenerator.ts  # Standard, Warp, Jump, Castling, and En Passant moves
│   ├── validator.ts      # Per-floor king safety, check, checkmate, stalemate, draws
│   └── game.ts           # Game session controller and move history
├── bot/                  # Client-side AI player
│   ├── evaluate.ts       # Board evaluation heuristics (material, control, gates)
│   └── botPlayer.ts      # Minimax AI with Alpha-Beta pruning
├── components/           # React UI presentation
│   ├── BoardView.tsx     # Dual-board synchronized view
│   ├── Square.tsx        # Cell rendering with Warp Gate pulsing portal effects
│   ├── PieceIcon.tsx     # SVG pieces with ethereal Jump halos and badges
│   ├── MoveLog.tsx       # Algebraic move history
│   ├── PromotionModal.tsx# Floor 1 vs Floor 2 promotion picker
│   ├── FeedbackModal.tsx # Embedded user feedback submission form
│   └── RulesGuideModal.tsx# In-game interactive rules guide
├── utils/
│   └── sounds.ts         # Synthesized Web Audio effects (move, warp, jump, check)
├── App.tsx               # Primary game layout & mode manager
└── main.tsx
```
