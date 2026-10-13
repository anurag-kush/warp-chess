# Warp Chess (Two-Layer Chess) — Official Rulebook

> **Document Status:** Official Player Rulebook (v1.0)  
> **Game Type:** Two-Layer Chess Variant  
> **Board Dimensions:** 8 × 8 × 2 (128 cells)  
> **Players:** 2 (White and Black)  
> **Interactive Web App:** [https://anurag-kush.github.io/warp-chess/](https://anurag-kush.github.io/warp-chess/)  
> **Repository:** [https://github.com/anurag-kush/warp-chess](https://github.com/anurag-kush/warp-chess)

---

## 🧭 Welcome & Beta Concept Note

> [!NOTE]
> **Active Development & Community Feedback**  
> Warp Chess is a chess variant concept currently under active development. Most moves, interactions, and edge cases have been heavily tested and codified in our headless rules engine. However, as an evolving strategic variant, we warmly encourage playtesters to report any discrepancies, unexpected behaviors, or balance suggestions. We will actively investigate every report to fix bugs or provide a clear rule explanation.

You can submit feedback directly in the web app via the **Feedback** button or open an issue on [GitHub Issues](https://github.com/anurag-kush/warp-chess/issues).

---

## 1. Core Concept

Warp Chess is played across **two overlapping 8 × 8 boards**:
- **Floor 1 (The Foundation / Earth):** Where the classical battle begins with standard chess armies.
- **Floor 2 (The Jump Sanctuary / Ether):** An aerial airspace occupied at the start by agile **Jump Pieces**.

### The Golden Principle of Attack Geometry
> **Attacks are strictly same-floor.**  
> Pieces on Floor 1 can only attack, defend, or deliver check to pieces on Floor 1. Pieces on Floor 2 can only attack, defend, or deliver check to pieces on Floor 2. A piece never attacks across floors directly. Vertical mobility and horizontal attacks are separate actions.

---

## 2. Coordinate System

Every square on the board is represented by a 3-character string:

$$\text{Floor} + \text{File} + \text{Rank}$$

- **Floor:** `1` or `2`
- **File:** `a`, `b`, `c`, `d`, `e`, `f`, `g`, `h`
- **Rank:** `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`

**Examples:**
- `1e4` = Floor 1, file e, rank 4 (classical King's Pawn square)
- `2e4` = Floor 2, file e, rank 4 (directly above `1e4`)
- `2c6` = Floor 2, file c, rank 6 (a Warp Gate on Floor 2)

---

## 3. Armies & Starting Setup

Each player commands **20 pieces** in total (16 Regular Pieces + 4 Jump Pieces).

### 3.1 Floor 1 (Standard 16 Pieces)
Floor 1 starts with the classical chess array:
- **White:** Back rank on rank `1` (`1a1`–`1h1`), Pawns on rank `2` (`1a2`–`1h2`).
- **Black:** Back rank on rank `8` (`1a8`–`1h8`), Pawns on rank `7` (`1a7`–`1h7`).

### 3.2 Floor 2 (Jump Units)
Floor 2 starts with exactly 4 Jump Pieces per player, stationed on opposite wings:

| Piece | White Position | Black Position |
|---|---|---|
| **Jump Bishop** (JB) | `2a1` | `2h8` |
| **Jump Knight** (JN) | `2c1` | `2f8` |
| **Jump Queen** (JQ) | `2e1` | `2d8` |
| **Jump Rook** (JR) | `2g1` | `2b8` |

All other squares on Floor 2 begin empty.

---

## 4. Warp Gates (`c6`, `d3`, `e6`, `f3`)

There are four fixed **Warp Gate** coordinates present on both floors:
- `1c6 ↔ 2c6`
- `1d3 ↔ 2d3`
- `1e6 ↔ 2e6`
- `1f3 ↔ 2f3`

### 4.1 Activation Rules
1. **Landing Required:** A Warp Gate activates **only when a Regular Piece's move ends on that square**.
2. **Passing Over Does Not Warp:** Sliding pieces (Rook, Bishop, Queen) moving *through* or across a Warp Gate without landing on it do **not** trigger teleportation.
3. **Mandatory Teleportation:** Landing on a Warp Gate immediately teleports the piece to the corresponding square on the opposite floor. A piece cannot choose to stay on the entry gate.
4. **Turn Ends Immediately:** Once warped, the piece cannot make further moves in the same turn.

### 4.2 Captures & Blockages
- **Gate Capture:** If an enemy piece is on the entrance gate, it is captured first.
- **Destination Capture:** If an enemy piece occupies the opposite floor's destination square, it is also captured as part of the warp!
- **Friendly Blockage:** If a **friendly piece** occupies the destination square on the opposite floor, the move into the Warp Gate is **illegal** and cannot be played.

---

## 5. Jump Pieces

Jump Pieces are identified by the **`J` badge** and an ambient ethereal aura.

### 5.1 Capabilities
1. **Standard Movement:** On their current floor, Jump Pieces move and capture exactly like standard chess pieces.
2. **The Jump Ability:** A Jump Piece may use its turn to **leap vertically** between floors at the **exact same file and rank** (`1xy ↔ 2xy`).
   - Example: A Jump Queen at `1e4` can jump to `2e4`.

### 5.2 Jump Restrictions
- **Jump Consumes Entire Turn:** A Jump cannot be chained with a move or capture in the same turn.
- **Destination Must Be Empty:** A Jump cannot land on an occupied square (Jump is not an attack).
- **Disabled on Warp Gates:** While standing on a Warp Gate square (e.g. `2c6`), a Jump Piece's Jump ability is **disabled**. It must move horizontally off the gate first.
- **No Warp Activation:** Jump pieces do *not* activate Warp Gates when landing on them horizontally.

---

## 6. Special Rules

### 6.1 Special Castling
1. **Standard Castling (Floor 1):** Classical Kingside and Queenside castling with Floor 1 Rooks follows standard FIDE rules.
2. **Jump Rook Castling:**
   - **Conditions:** King has never moved; starting Jump Rook (`2g1` White, `2b8` Black) has never moved; all squares between King and Jump Rook's file on Floor 1 are empty.
   - **Execution:** 
     - White: King moves `1e1 → 1g1` on Floor 1. Jump Rook leaps from `2g1 → 1f1` (descending to Floor 1).
     - Black: King moves `1e8 → 1c8` on Floor 1. Jump Rook leaps from `2b8 → 1d8` (descending to Floor 1).
   - **Outcome:** Both pieces finish the castling move on **Floor 1**.

### 6.2 Floor-Dependent Pawn Promotions
When a Pawn reaches its 8th rank (rank 8 for White, rank 1 for Black):
- **On Floor 1:** Promotes to a Regular Queen, Rook, Bishop, or Knight.
- **On Floor 2:** Promotes to a **Jump Piece** (Jump Queen, Jump Rook, Jump Bishop, or Jump Knight)!
  - **Limit:** Capped at a maximum of **2 active Jump Pieces** of each type per player on the board.

### 6.3 Warp En Passant
When an enemy Pawn double-moves past a Warp Gate:
- **Scenario A (Same Floor):** White pawn pushes `1d2 → 1d4` (over gate `1d3`). Black pawn on `1c4` captures en passant to `1d3`, which mandatorily warps Black to `2d3`!
- **Scenario B (Cross Floor):** Black pawn pushes `1c7 → 1c5` on Floor 1 (over gate `1c6`). White pawn stationed on Floor 2 at `2d5` captures into Floor 2 gate `2c6`, warping down to `1c6` on Floor 1 while removing Black's pawn!

### 6.4 Pawn Movement Restriction at Warp Gates
- Pawns only attack diagonally. A pawn's forward push is strictly non-capturing.
- If a pawn attempts to move forward into a Warp Gate (e.g. `1e5 → 1e6`), and the destination square (`2e6`) is occupied by **any piece** (enemy or friendly), the pawn is **blocked** and cannot advance.

---

## 7. King Safety, Check & Checkmate

1. **Per-Floor Check:** A King is in check only when directly attacked by an enemy piece on the **same floor**.
2. **King Safety at Warp Gates:**
   - A King can **never** step onto a Warp Gate that is under attack on the starting floor.
   - A King can **never** warp to a destination that would leave it in check on the arrival floor.
3. **No King Captures:** In chess, Kings are never captured. If a King is attacked and has no legal escaping moves (on either floor), the game terminates immediately in **Checkmate**.
4. **Draw Conditions:** 50-move rule, 3-fold position repetition, and insufficient material are evaluated across both floors.

---

## 8. Notation Reference

| Notation | Meaning |
|---|---|
| `1e2-1e4` | Pawn moves from `1e2` to `1e4` |
| `1g1-1f3` | Knight moves from `1g1` to `1f3` |
| `1c5x1c6🌀2c6` | Rook captures on `1c6` and warps to `2c6` |
| `JQ2e4↕1e4` | Jump Queen leaps vertically from `2e4` to `1e4` |
| `O-O` / `O-O-O` | Standard Castling on Floor 1 |
| `JR-O-O` | Jump Rook Castling |
| `1e7-1e8=JQ` | Pawn promotes to Jump Queen on Floor 2 |
| `+` | Move delivers Check |
| `#` | Move delivers Checkmate |

---

## 9. Feedback & Inquiries

Found a bug, unexpected bot behavior, or rule ambiguity?
- **In-App:** Click the **Feedback** button in the top navigation bar.
- **GitHub:** Open an issue at [https://github.com/anurag-kush/warp-chess/issues](https://github.com/anurag-kush/warp-chess/issues).
