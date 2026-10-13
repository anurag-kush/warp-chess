# Warp Chess (Two-Layer Chess)
## Product Requirements Document

**Document Version:** 0.3 Approved  
**Status:** MVP Architecture & Decisions Approved  
**Game Type:** Two-layer chess variant  
**Players:** 2  
**Board:** 8 × 8 × 2  
**Scope:** Two-layer chess with Warp Gates, Jump Pieces, and the chess-rule modifications defined in this document.

---

## 1. Product Overview

Two-Layer Chess is a chess variant played across **two overlapping 8 × 8 floors**.

The game retains the familiar movement and strategic foundations of chess while introducing:

- A second playable floor
- Fixed Warp Gates connecting corresponding cells between floors
- Four special Jump Pieces per player
- Floor-dependent pawn promotion
- Modified En Passant interactions involving Warp Gates
- A special castling rule for the Jump Rook

The central design principle is:

> **The second floor adds positional depth without turning chess movement into unrestricted three-dimensional movement.**

Regular Pieces use Warp Gates to change floors. Jump Pieces use their Jump ability to change floors. Neither system gives pieces a new three-dimensional attack pattern.

---

# 2. Product Goals

### Primary Goals

1. Preserve the recognisable strategic foundation of chess.
2. Introduce a second spatial layer with clear, deterministic rules.
3. Make vertical movement meaningful without creating unrestricted 3D movement.
4. Create tactical importance around fixed Warp Gate locations.
5. Give players a distinct set of Jump Pieces with controlled vertical mobility.
6. Make promotion on different floors strategically meaningful.
7. Define the rules precisely enough for a software rules engine to implement them consistently.

### Non-Goals

The current game does **not** include:

- Fantasy Chess combat systems
- Ranged combat
- Dice-based combat
- Additional combat units
- Unrestricted 3D movement
- Any mechanics not explicitly defined in this document

---

# 3. Board

## 3.1 Dimensions

The board is:

**8 × 8 × 2**

There are:

- 8 files: `a` through `h`
- 8 ranks: `1` through `8`
- 2 floors: `1` and `2`

Total playable cells:

**128**

The two floors occupy the same horizontal coordinate system but represent separate layers.

---

# 4. Coordinate System

Every cell is represented as:

**Floor + File + Rank**

Examples:

- `1a1`
- `1e4`
- `2a1`
- `2e4`
- `2h8`

For example:

`2c6`

means:

- Floor 2
- File c
- Rank 6

The coordinate system must uniquely identify every cell on the board.

### Implementation Decision: Canonical String Notation
- **Decision:** The primary data structures, rules engine APIs, and user interface will use string notation (e.g. `"1e4"`, `"2c6"`) as the canonical coordinate representation.
- **Rationale:** Chess players are universally familiar with algebraic coordinate notation (e.g., `e4`). Prefixing the floor number directly preserves this intuition, reduces cognitive load for playtesters, simplifies notation logging in move histories, and streamlines debugging and serialization.

---

# 5. Players

There are two players:

- **White**
- **Black**

White makes the first move.

Players retain the normal chess orientation for pawn movement and starting positions.

---

# 6. Pieces

Each player begins with **20 pieces**.

## 6.1 Regular Pieces

Each player has the standard 16 chess pieces:

| Piece | Quantity |
|---|---:|
| King | 1 |
| Queen | 1 |
| Rook | 2 |
| Bishop | 2 |
| Knight | 2 |
| Pawn | 8 |
| **Total** | **16** |

Regular Pieces begin on Floor 1.

## 6.2 Jump Pieces

Each player also begins with:

- 1 Jump Bishop
- 1 Jump Knight
- 1 Jump Queen
- 1 Jump Rook

Total starting Jump Pieces:

**4**

Jump Pieces begin on Floor 2.

---

# 7. Initial Setup

## 7.1 Floor 1

Regular Pieces use the standard chess starting arrangement.

## 7.2 Floor 2

### White

| Piece | Position |
|---|---|
| Jump Bishop | `2a1` |
| Jump Knight | `2c1` |
| Jump Queen | `2e1` |
| Jump Rook | `2g1` |

### Black

| Piece | Position |
|---|---|
| Jump Rook | `2b8` |
| Jump Queen | `2d8` |
| Jump Knight | `2f8` |
| Jump Bishop | `2h8` |

No other pieces begin on Floor 2.

---

# 8. Regular Pieces

Regular Pieces retain their normal chess movement unless explicitly modified by the rules in this document.

Regular Pieces cannot freely change floors.

Their only method of changing floors is through a Warp Gate.

This includes the King.

---

# 9. Warp Gates

There are four fixed Warp Gate coordinates:

- `c6`
- `d3`
- `e6`
- `f3`

Each exists on both floors.

| Floor 1 | Floor 2 |
|---|---|
| `1c6` | `2c6` |
| `1d3` | `2d3` |
| `1e6` | `2e6` |
| `1f3` | `2f3` |

Each pair represents a portal between the corresponding cells.

Warp Gates do not move during a game.

---

# 10. Warp Gate Activation

A Warp Gate activates **only when a Regular Piece's movement ends on that Warp Gate**.

Passing through, crossing over, or traversing a Warp Gate without ending the move there does not activate it.

This rule applies regardless of which Regular Piece is moving.

For example:

- A Rook landing on `1c6` activates the gate.
- A Knight landing on `1c6` activates the gate.
- A King landing on `1c6` activates the gate.
- A Pawn landing on `1c6` activates the gate.
- A Rook moving through `1c6` on the way to `1c8` does not activate it.

---

# 11. Regular Piece Warp Movement

When a Regular Piece lands on a Warp Gate:

1. The piece reaches the Warp Gate.
2. Any capture on the Warp Gate is resolved.
3. The Warp Gate activates.
4. The piece transfers to the corresponding cell on the opposite floor.
5. Any enemy piece occupying that destination is captured.
6. The move ends.
7. The player's turn ends.

A Regular Piece cannot choose to remain on the Warp Gate after activating it.

### Example

A White Rook moves:

`1c5 → 1c6`

Because `1c6` is a Warp Gate:

`1c6 → 2c6`

The Rook's final position is:

`2c6`

The player cannot continue moving the Rook during that turn.

---

# 12. Warp Gate Captures

A Regular Piece may capture an enemy piece occupying the Warp Gate itself.

The capture occurs before the Warp transition.

A Regular Piece may also capture an enemy piece occupying the corresponding destination square on the opposite floor as part of the Warp.

### Example

White Rook:

`1c5`

Black Bishop:

`1c6`

White moves:

`1c5 → 1c6`

The Bishop is captured.

The Warp then activates:

`1c6 → 2c6`

The White Rook ends on `2c6`.

If an enemy piece occupies `2c6`, that piece is also captured as part of the Warp.

---

# 13. Friendly Piece at Warp Destination

A Regular Piece may not activate a Warp Gate if the corresponding destination square on the opposite floor is occupied by a friendly piece.

Example:

White Rook attempts:

`1c5 → 1c6`

but a White Knight occupies:

`2c6`

The move is illegal.

The Rook cannot enter the Warp Gate because the resulting destination is occupied by a friendly piece.

---

# 14. Warp Gates and Intermediate Movement

A Warp Gate is not an intermediate teleportation point.

The piece must finish its movement on the Warp Gate.

For sliding pieces, passing over a Warp Gate does not activate it.

Example:

`1c1 → 1c8`

passes through `1c6`.

The Rook remains on Floor 1 because `1c6` was not the destination.

---

# 15. Jump Pieces

Jump Pieces retain the normal movement rules of their corresponding Regular Pieces.

| Jump Piece | Normal Movement |
|---|---|
| Jump Bishop | Bishop |
| Jump Knight | Knight |
| Jump Queen | Queen |
| Jump Rook | Rook |

They additionally possess the ability to change floors.

---

# 16. Jump Ability

A Jump Piece may change floors while keeping the same file and rank.

Examples:

`1e4 → 2e4`

`2e4 → 1e4`

A Jump changes **only the floor**.

It does not change:

- File
- Rank
- Piece type
- Ownership

---

# 17. Jump Is a Complete Move

A Jump is an entire turn.

After a Jump:

- No additional movement is permitted.
- No additional attack is permitted.
- The player cannot continue moving the piece.
- The turn immediately passes to the opponent.

Therefore:

`1e4 → 2e4`

is one complete move.

A Jump cannot be combined with normal movement.

---

# 18. Jump Pieces and Warp Gates

Warp Gates do **not** obstruct the ordinary movement of Jump Pieces.

A Jump Piece may move normally through or onto a Warp Gate.

However:

> **A Jump Piece cannot use its Jump ability while occupying a Warp Gate.**

The Warp Gate only disables the Jump ability. It does not disable normal movement.

### Example

A Jump Rook at `2c6`:

- May move normally as a Rook.
- May not Jump from `2c6` to `1c6`.

---

# 19. Reaching a Warp Gate with a Jump Piece

A Jump Piece cannot combine a Jump with normal movement.

Example:

A Jump Rook at:

`1c5`

cannot reach:

`2c6`

in one turn.

It may instead:

### Option 1

First Jump:

`1c5 → 2c5`

Then, on the next turn:

`2c5 → 2c6`

### Option 2

If already on Floor 2, it may move normally to `2c6`.

Once the Jump Rook is on `2c6`, it cannot Jump from that square because `c6` is a Warp Gate.

---

# 20. Jump Pieces Do Not Gain 3D Movement

The Jump ability changes a Jump Piece's floor. It does not alter the piece's normal movement geometry.

Jump Pieces do **not** gain a separate three-dimensional movement pattern.

Their movement system is:

**Normal chess movement + controlled floor switching.**

---

# 21. No Direct Cross-Floor Attacks

A Jump Piece cannot directly attack a piece or King on the opposite floor.

The Jump Piece must first change floors and then make its normal attack on a later turn.

A Jump itself does not constitute an attack.

---

# 22. Example: Jump Rook

A Jump Rook is at:

`1a1`

An enemy target is at:

`2a8`

The Jump Rook has two possible two-turn approaches.

### Option 1: Move First, Jump Second

Turn 1:

`1a1 → 1a8`

Turn 2:

`1a8 → 2a8`

The Rook first reaches the corresponding coordinate on its current floor, then changes floors.

If the opposing King is on `2a8`, the Rook's first move may create a same-floor attack only when the King is on the same floor. The Jump itself does not create a direct cross-floor attack.

### Option 2: Jump First, Move Second

Turn 1:

`1a1 → 2a1`

Turn 2:

`2a1 → 2a8`

The Rook changes floors first and then attacks normally from Floor 2.

The same principle applies to Jump Queens and Jump Bishops.

---

# 23. Jump Knight

The Jump Knight follows the same core Jump rule.

A Jump Knight can change floors at the same file and rank:

`1e4 → 2e4`

However, it cannot use its normal Knight movement pattern to attack a different coordinate on the opposite floor.

For example:

`1e4 → 2f6`

is not a cross-floor Knight attack.

A Jump Knight must first use its Jump to reach the opposite floor and then use its normal Knight movement on a subsequent turn.

---

# 24. Kings and Warp Gates

The King is a Regular Piece for purposes of Warp Gates.

A King may use a Warp Gate by landing on it.

The Warp transition is mandatory.

Example:

`1d2 → 1d3 → 2d3`

The King ends on `2d3`.

### King Safety at Warp Gates:
Because a Warp Gate connects the two floors, King safety at a Warp Gate must account for both floors:
1. **Gate Square Safety:** A King can never step onto an attacked square. If a Warp Gate square is under attack by an enemy piece on the King's starting floor, the King cannot step onto it, even if the destination on the opposite floor would be safe.
2. **Destination Square Safety:** The destination square on the opposite floor after warping must also be safe from attacks. A King cannot warp into check.
3. **Prohibition of King Captures:** In chess, a King is never captured as a piece on the board. If a player has no legal moves to remove or escape check, the game immediately ends in **Checkmate**, rather than allowing the opponent to capture the King.

---

# 25. King Safety After Warping

For any move involving a Warp Gate, the legality of the move requires that **both the intermediate gate square and the resulting position after the Warp has been completed leave the King safe from check**.

A player may not make a Warp move if the resulting position leaves their King in check on the destination floor, nor may a King enter a gate that is under attack on the starting floor.

---

# 26. Check

Regular Pieces follow normal chess attack geometry.

A Regular Piece can directly attack and give check only to a King on the same floor.

A Regular Piece does not gain a cross-floor attack merely because a corresponding square exists on the other floor.

Jump Pieces also use their normal attack geometry.

They do not gain direct cross-floor attacks through their Jump ability.

A Jump Piece must first reach the target's floor and then attack normally.

---

# 27. Cross-Floor Positioning

The two floors provide vertical positioning but do not create unrestricted three-dimensional attack lines.

A piece on Floor 1 and a piece on Floor 2 do not automatically attack each other merely because they occupy corresponding or geometrically related coordinates.

Floor switching and attack are separate actions.

---

# 28. Pawns

Pawns retain their normal chess movement and capture rules except where specifically modified by the two-layer rules.

Pawn movement remains dependent on the pawn's normal orientation.

## 28.1 Pawns and Warp Gate Movement Restrictions

Pawns only attack diagonally sideways as per their standard chess pattern. A pawn's forward push is strictly non-capturing.

Consequently, when a Pawn attempts to move forward toward a Warp Gate:

1. **Blocked Forward Push by Occupied Warp Destination:**
   If a pawn moves straight forward to a Warp Gate (for example, a White Pawn at `1e5` facing Warp Gate `1e6`), and the opposite-floor destination (`2e6`) is occupied by ANY piece (enemy or friendly, such as a Black Pawn at `2e6`), the pawn is **blocked and cannot move forward**. It is treated exactly as if the blocking piece were positioned on `1e6`.
2. **No Forward or Vertical Attacks:**
   A pawn can never capture a piece straight forward, nor can it capture through the vertical warp transition. Therefore, executing `1e5 → 1e6 🌀 2e6` to attack/capture an enemy piece at `2e6` is illegal.
3. **Empty Warp Destination Required for Pawns:**
   A pawn may only enter a Warp Gate if the destination square on the opposite floor is completely empty.

---

# 29. Pawn Promotion

Promotion depends on the floor on which the Pawn reaches its promotion rank.

### Floor 1

A Pawn promoting on Floor 1 becomes a Regular Piece.

Available choices:

- Queen
- Rook
- Bishop
- Knight

### Floor 2

A Pawn promoting on Floor 2 becomes a Jump Piece.

Available choices:

- Jump Queen
- Jump Rook
- Jump Bishop
- Jump Knight

---

# 30. Jump Promotion Limits

A player may have a maximum of:

- 2 Jump Queens
- 2 Jump Rooks
- 2 Jump Bishops
- 2 Jump Knights

One of each type is present at the start of the game.

Therefore, at most one additional active Jump Piece of each type can exist through promotion at any one time.

---

# 31. Captured Jump Pieces and Promotion

The Jump Piece limit is based on the number of **active Jump Pieces currently on the board**.

Captured Jump Pieces no longer count toward the limit.

Therefore, if a player has:

- 1 original Jump Queen
- 1 promoted Jump Queen

and the promoted Jump Queen is captured, the player may later promote another Pawn into a Jump Queen.

The number of Jump Pieces previously created does not affect future eligibility.

---

# 32. En Passant

Standard En Passant is supported.

The normal conditions for En Passant apply unless the special Warp En Passant condition is met.

---

# 33. Warp En Passant

Warp Gates can create a special En Passant situation in which the capture interacts with the two-floor system.

Known example:

White Pawn:

`2c5`

Black Pawn:

`1d6`

Black moves:

`1d6 → 1d4`

The Warp Gate at `1d3` creates the special situation in which White may perform a **Warp En Passant**.

Warp En Passant combines:

- En Passant capture
- Floor transition through a Warp Gate

The exact destination and movement sequence of the capturing Pawn remain a design question and must be formally defined before implementation.

---

# 34. Castling

Regular castling follows the normal chess concept for Regular Rooks, subject to the two-layer rules.

The King and relevant Regular Rook must satisfy the required castling conditions.

---

# 35. Jump Rook Castling

The Jump Rook has a special castling mechanism (see Section 49.3 for the resolved formal specification).

When eligible:
- The King moves 2 squares toward the Jump Rook's file on **Floor 1** (e.g., White `1e1 → 1g1`, Black `1e8 → 1c8`).
- The Jump Rook jumps from **Floor 2 to Floor 1** and occupies the square the King skipped over (e.g., White `2g1 → 1f1`, Black `2b8 → 1d8`).
- Both pieces finish the castling move on **Floor 1**.

This transition is treated as one complete move.

---

# 36. Jump Rook Castling Eligibility

The confirmed requirements are:

- The King has not moved.
- The Jump Rook has not moved from its original position.

The Jump Rook's original starting positions are:

- White Jump Rook: `2g1`
- Black Jump Rook: `2b8`

A Jump Rook that has moved and later returned to its original square is still considered to have moved and therefore cannot castle.

Additional castling conditions remain subject to the unresolved-rules section.

---

# 37. Turn Structure

The game is strictly turn-based.

White moves first.

Each turn consists of one legal game action.

After the action is completed, the turn passes to the other player.

A player cannot combine separate movement actions into a single turn.

This is particularly important for:

- Warp movement
- Jump movement
- En Passant
- Warp En Passant
- Castling
- Jump Rook castling

---

# 38. Move Resolution

Special movement must resolve atomically.

For example:

### Warp

```text
Move to Warp Gate
       ↓
Capture on Gate, if applicable
       ↓
Warp to opposite floor
       ↓
Capture enemy at destination, if applicable
       ↓
Turn ends
```

### Jump

```text
Change floor
       ↓
Turn ends
```

No additional movement occurs after either special transition.

---

# 39. Game State

The game engine must maintain enough information to reconstruct the current position.

At minimum:

- Board state
- Floor
- Piece type
- Piece ownership
- Piece position
- Piece movement state
- Current player
- Previous move
- Move history
- Promotion state
- En Passant state
- Castling eligibility
- Game status

---

# 40. Piece Identity

Every piece should have a unique identity.

This is required for tracking:

- Whether it has moved
- Original position
- Promotion
- Capture
- Castling eligibility

A piece's identity should remain stable throughout the game, including after movement and promotion.

---

# 41. Move History

Every completed action should be recorded.

A move record should contain enough information to reconstruct the resulting game state.

At minimum:

- Player
- Piece
- Starting position
- Destination position
- Captured piece or pieces, if applicable
- Floor transition, if applicable
- Promotion, if applicable
- Special move type

---

# 42. Rules Engine

The rules engine must be independent from the visual interface.

The same rules should be usable by:

- Python prototype
- Automated tests
- Android application
- Future AI opponent

The UI should not independently implement game rules.

---

# 43. Legal Move Validation

A legal action must:

1. Be made by the current player.
2. Use a piece belonging to that player.
3. Follow the piece's movement rules.
4. Respect board boundaries.
5. Respect occupancy and capture rules.
6. Respect Warp Gate rules.
7. Respect Jump rules.
8. Respect special-move conditions.
9. Leave the player's King in a legal state.

---

# 44. Recommended Game-State Structure

Conceptually:

```text
Game
├── Board
│   ├── Floor 1
│   └── Floor 2
├── White Pieces
├── Black Pieces
├── Current Turn
├── Move History
├── Castling State
├── En Passant State
└── Game Status
```

A position should be represented internally using structured values:

```text
Position
├── floor
├── file
└── rank
```

The human-readable form remains:

`2e4`

---

# 45. Software Design Requirements

The rules engine should provide capabilities to:

- Create a new game
- Initialise the starting position
- Generate legal moves
- Validate moves
- Apply moves
- Capture pieces
- Activate Warp Gates
- Perform Jump actions
- Promote Pawns
- Perform En Passant
- Perform Warp En Passant
- Perform castling
- Detect check
- Detect checkmate
- Detect stalemate
- Track turns
- Track move history

The implementation should not add gameplay behaviour that is not defined by the PRD.

---

# 46. Testing Requirements

Automated tests should cover all confirmed mechanics.

### Board

- 128 valid cells
- Correct coordinate handling
- Correct floor handling

### Initial Setup

- Standard Floor 1 setup
- Correct White Jump Piece positions
- Correct Black Jump Piece positions

### Warp Gates

- Correct gate positions
- Gate activation when a Regular Piece lands on a gate
- No activation when a sliding piece passes over a gate
- Mandatory floor transition
- Turn ends after Warp
- Capture on gate
- Capture at opposite-floor destination
- Friendly piece at destination makes move illegal

### Jump Pieces

- Normal movement
- Same-coordinate floor switching
- Jump consumes entire turn
- Jump cannot be combined with movement
- Jump cannot be used from a Warp Gate
- Warp Gates do not obstruct normal Jump Piece movement
- No direct cross-floor attack

### Promotion

- Floor 1 promotion
- Floor 2 promotion
- Jump Piece limit
- Captured Jump Piece no longer counts toward the limit

### King

- Warp movement
- King safety after Warp
- Same-floor attack rules
- Cross-floor position does not create an automatic attack

### Castling

- Standard castling conditions
- Jump Rook position swap
- Moved Jump Rook cannot castle
- King movement tracking

### En Passant

- Standard En Passant
- Warp En Passant after its exact movement is defined

---

# 47. User Interface Design Requirements

The eventual game interface should make the two-floor structure understandable.

Players should be able to:

- See both floors
- Identify the current floor
- Select pieces
- See legal movement options
- See Warp Gates
- See Jump options
- See captures
- Understand automatic Warp transitions
- Understand promotion choices
- Understand check and game-ending states

The visual design must not change the underlying rules.

---

# 48. Design Principles for the Interface

The UI should make the following concepts immediately understandable:

### Two Floors

The player must always know which floor a piece occupies.

### Warp Gates

Warp Gates should have a distinctive visual identity.

### Jump

The UI should make clear that Jump:

- Changes floor
- Keeps file and rank
- Uses the entire turn

### Promotion

The UI should distinguish between:

- Regular promotion
- Jump promotion

### Special Moves

Warp, Jump, En Passant and castling should be visually clear without requiring the player to memorise every rule.

---

# 49. Open Questions

The following items are **not yet fully defined** and must remain open until explicitly decided.

## 49.1 Warp En Passant — **RESOLVED**

Warp En Passant occurs when a pawn makes a two-square move **passing over a Warp Gate**, and an enemy pawn on an adjacent file could have captured it had it moved only one square. The capturing pawn uses the Warp Gate **on its own floor** to reach the enemy's floor and complete the capture.

Two scenarios:

### Scenario A: Same-Floor Warp En Passant
- **Attacker**: White pawn at `1d2` moves `1d2 → 1d4` (passes over Warp Gate `1d3`)
- **Defender**: Black pawn at `1c4`
- **Capture**: Black pawn captures en passant to `1d3` (Warp Gate)
- **Warp**: Mandatory `1d3 → 2d3`
- **Result**: Black pawn ends on `2d3` (Floor 2); White pawn at `1d4` is captured

### Scenario B: Cross-Floor Warp En Passant
- **Attacker**: Black pawn at `1c7` moves `1c7 → 1c5` (passes over Warp Gate `1c6`)
- **Defender**: White pawn at `2d5` (Floor 2, adjacent file)
- **Capture**: White pawn captures diagonally to `2c6` (Warp Gate on Floor 2)
- **Warp**: Mandatory `2c6 → 1c6`
- **Capture resolution**: White pawn captures Black pawn at `1c5` (en passant capture on Floor 1)
- **Result**: White pawn ends on `1c6` (Floor 1); Black pawn at `1c5` is captured

**General Rules**:
- The double-move pawn must pass **directly over** a Warp Gate (the gate is on the intermediate square)
- Capturing pawn moves to the Warp Gate **on its current floor** (diagonally for cross-floor, straight for same-floor)
- Warp activates mandatorily after the capture move
- Captured pawn is removed from its floor (the floor where the double-move pawn landed)
- Turn ends after Warp (standard Warp rule)
- Standard en passant timing applies: capture must be made immediately on the next turn

---

## 49.2 Full Regular Castling Conditions — **RESOLVED**

Regular castling follows **standard chess rules exactly**, with no modifications for the two-floor system.

- **Floor**: Only Floor 1 (where King and Regular Rooks start)
- **Eligibility**: King and relevant Regular Rook on original squares (`e1`/`a1`/`h1` for White; `e8`/`a8`/`h8` for Black)
- **Neither has moved**: King using a Warp Gate counts as having moved → permanently forfeits castling rights
- **Path clear**: All squares between King and Rook on rank 1/8 must be empty
- **King safety**: King not in check on starting square, passed-through squares, or destination square
- **Warp Gates**: Gates at d3/f3 (king-side area) and c6/e6 (queen-side area) are on ranks 3/6, not the back rank — they do not interfere with castling paths

No castling on Floor 2. No cross-floor castling with Regular pieces.

---

## 49.3 Full Jump Rook Castling Conditions — **RESOLVED**

**Conditions** (from regular castling, adapted for two floors):
- King never moved normally (any King move, including Warp, permanently forfeits castling rights)
- Jump Rook never moved from original position (`2g1` White, `2b8` Black) — includes no Jumps
- Path clear between them **on King's floor** (Floor 1): all squares between King and Jump Rook's file must be empty

**Moveset**: The castling move itself handles the floor transition:
- King moves 2 squares toward Jump Rook's file **on King's Floor 1** (e.g., `1e1 → 1g1`)
- Jump Rook jumps **from Floor 2 to Floor 1** and occupies the square King skipped over (e.g., `2g1 → 1f1`)
- Both pieces end on **Floor 1**
- Because the floor transition is part of the castling move, neither piece "moved before castling" — castling rights are preserved

**Summary**: King starts on Floor 1 at `e1`, Jump Rook starts on Floor 2 at `g1`. After castling: King at `g1` (Floor 1), Jump Rook at `f1` (Floor 1). The Jump Rook's Floor-to-Floor transition is intrinsic to the castling move.

---

## 49.4 Checkmate — **RESOLVED**

**Definition**: King is checkmated when the King is in check and there is **no legal move** that can remove the check. This includes:

- Normal piece moves (same floor attack geometry)
- Jumps (change floor + normal attack on new floor)
- Warp Gates (mandatory floor transition when landing on a gate)
- Promotion moves

**Cross-floor rule**: Checkmate evaluation considers **all legal moves** across both floors. A King on Floor 1 is checkmated only if no legal move (including Jumping to Floor 2, Warping through a gate, or any same-floor move) can escape check. Similarly for Floor 2.

**Same-floor attacks only**: A piece on Floor 1 can only give/check check to a King on Floor 1. A piece on Floor 2 can only give/check check to a King on Floor 2. Floors do not create cross-floor attack lines.

---

## 49.5 Stalemate — **RESOLVED**

**Definition**: Stalemate occurs when the King is **not in check** but has **no legal move** of any kind. This includes:

- Normal piece moves (same floor only — no cross-floor attacks)
- Jumps (change floor while maintaining file/rank)
- Warp Gate activation (if King lands on a Warp Gate as a legal move — but Kings can only land on gates via normal movement or as part of a Warp move, not voluntarily)

**Cross-floor rule**: A player is in stalemate only when they have no legal move with any piece across either floor. While the King cannot jump (Kings change floors exclusively via Warp Gates), any legal move that escapes to or operates on the other floor—including a King stepping onto an accessible Warp Gate, or any legal Jump move by a friendly Jump Piece—prevents stalemate.

**Key**: Stalemate evaluates the full legal action space of the player across both floors. Jump and Warp options that reach or operate on either floor are counted as legal moves.

---

## 49.6 Draw Rules — **RESOLVED**

The following draw rules are confirmed, applied with cross-floor awareness:

1. **50-Move Rule**: If 50 consecutive moves (by both players) pass without a pawn move or capture, either player may claim a draw. Moves include normal moves, Jumps, and Warps. Count is tracked across both floors.

2. **3-Fold Repetition**: If the same position (board state + current player + castling/en passant rights) occurs three times, either player may claim a draw. Position includes floor positions of all pieces. A position is defined by piece locations on both floors, not just one floor.

3. **Insufficient Material**: Draw by insufficient material to checkmate. This is assessed considering pieces on **both floors**:
   - K vs K (on either floor)
   - K vs K + B (Bishop blocked by floor separation — no checkmate possible)
   - K vs K + N (Knight — no checkmate possible due to no cross-floor attacks)
   - K vs K + B + N (max material for draw)
   - K + B vs K + B (same-squared Bishops — no checkmate possible)
   - Other combinations where no checkmate is possible across both floors

4. **Draw by Agreement**: Either player may offer a draw at any time; opponent may accept or decline.

5. **Perpetual Check**: Not a formal draw rule (games do not automatically end by perpetual), but a common practical endpoint.

---

## 49.7 Complete King Interaction Between Floors — **RESOLVED**

**No cross-floor King restrictions**: Kings on different floors do **not** create special restrictions based on corresponding or nearby cells. There is no "facing Kings" rule across floors, no automatic attack just because corresponding squares exist, and no additional check conditions based on the opponent's King position on the other floor.

**Same-floor only**: All check, checkmate, and attack rules apply **per floor only**. A piece on Floor 1 attacks/gives check only to a King on Floor 1. A piece on Floor 2 attacks/gives check only to a King on Floor 2.

**King safety after Warp**: When a King uses a Warp Gate, safety is evaluated at the **resulting position after the Warp completes**. The temporary position on the Warp Gate square is not the final position. A player may not make a Warp move if the resulting position leaves their King in check on the new floor.

**Warp Gate adjacency**: Two Kings on corresponding squares (e.g., `1e1` and `2e1`) do not restrict each other. A piece's attack geometry is unchanged by the King's floor.

**Summary**: The two floors provide vertical positioning and tactical depth, but Kings on different floors do not interact via special cross-floor rules. Only same-floor geometry matters.

# 50. Future Design Sections

The following sections are intentionally reserved for future design work.

They are part of the product structure but are **not yet defined gameplay rules**.

---

## 50.1 Game Presentation & Visual Design

To be defined:

- Overall visual style
- Board appearance
- Floor differentiation
- Warp Gate visual language
- Piece visual design
- Animations
- Effects
- Player feedback

---

## 50.2 Board Interaction Design

To be defined:

- How the two floors are displayed
- Whether floors appear simultaneously or separately
- Camera/view behaviour
- Piece selection
- Move highlighting
- Warp animation
- Jump animation
- Promotion interface

---

## 50.3 Game Flow

To be defined:

- Main menu
- New Game
- Continue Game
- Game setup
- In-game controls
- Pause
- Resign
- Draw offer
- Game-end screen
- Replay

---

## 50.4 Notation

A dedicated notation system for two-floor moves is to be designed.

The notation should eventually represent:

- Floor
- File
- Rank
- Captures
- Warp
- Jump
- Promotion
- En Passant
- Castling

---

## 50.5 Game Save Format

A versioned save format should be designed to preserve:

- Complete board state
- Piece identity
- Move history
- Castling state
- En Passant state
- Promotion state
- Current player
- Game status

---

## 50.6 AI Design

Future work may define:

- Computer opponent
- Position evaluation
- Move search
- Difficulty levels
- AI-specific optimisations

The AI must consume the same authoritative rules engine rather than implementing a separate rule interpretation.

---

## 50.7 Multiplayer

Future design may include:

- Local multiplayer
- Online multiplayer
- Matchmaking
- Game synchronisation
- Reconnection
- Spectating

No multiplayer rules are currently defined.

---

# 51. Product Architecture Direction

The game should be designed around a clear separation between:

```text
Game Rules
     ↓
Rules Engine
     ↓
Game State
     ↓
Application Interface
```

The visual interface should never become the source of truth for game rules.

The rules engine should be independently testable.

---

# 52. Development Principle

When an implementation encounters an undefined situation:

1. Do not invent a rule.
2. Identify the ambiguity.
3. Record it as an open question.
4. Resolve the rule at the game-design level.
5. Update this PRD.
6. Add or update automated tests.

The PRD is the authoritative source for the game's rules.

---

# 53. Current Game Identity

Two-Layer Chess is defined by four core ideas:

### 1. Two Floors

An 8 × 8 chess board exists on two overlapping layers.

### 2. Warp Gates

Regular Pieces use fixed portals to change floors.

### 3. Jump Pieces

Four special pieces begin on Floor 2 and can switch floors while maintaining their file and rank.

### 4. Controlled Vertical Strategy

Changing floors does not create unrestricted three-dimensional attacks. A player must deliberately position pieces on the appropriate floor before using their normal attack geometry.

---

# 54. Current Rules Summary

| Feature | Confirmed Rule |
|---|---|
| Board | 8 × 8 × 2 |
| Cells | 128 |
| Coordinate | Floor + File + Rank |
| Players | White and Black |
| Starting player | White |
| Regular pieces/player | 16 |
| Starting Jump Pieces/player | 4 |
| Total starting pieces/player | 20 |
| Regular Piece starting floor | Floor 1 |
| Jump Piece starting floor | Floor 2 |
| Warp Gates | c6, d3, e6, f3 |
| Regular Piece floor change | Land on Warp Gate |
| Warp choice | Mandatory |
| Passing over gate | No activation |
| Warp turn | Ends immediately |
| Gate capture | Supported |
| Opposite-floor enemy capture | Supported |
| Opposite-floor friendly piece | Blocks Warp |
| Jump | Same file/rank, opposite floor |
| Jump duration | Entire turn |
| Jump from Warp Gate | Not allowed |
| Warp Gate effect on normal Jump Piece movement | None |
| Direct cross-floor attack | Not allowed |
| Floor 1 promotion | Regular Piece |
| Floor 2 promotion | Jump Piece |
| Jump Piece maximum | 2 of each type |
| Captured Jump Piece | No longer counts toward limit |
| Standard En Passant | Supported |
| Warp En Passant | Two scenarios: same-floor and cross-floor (RESOLVED) |
| King Warp access | Same as Regular Piece |
| King safety after Warp | Evaluated at resulting position |
| Regular castling | Standard chess, Floor 1 only, King using Warp = moved (RESOLVED) |
| Jump Rook castling | King stays Floor 1, Jump Rook jumps Floor 2→Floor 1 as part of castling (RESOLVED) |
| Checkmate | Cross-floor considered: King checkmated only if no legal move (incl. Jump/Escape) on either floor (RESOLVED) |
| Stalemate | King not in check but no legal moves (incl. Jump to other floor) — cross-floor evaluation (RESOLVED) |
| Draw Rules | 50-move, 3-fold rep, insufficient material (both floors), agreement — all formalized (RESOLVED) |
| King interaction between floors | No cross-floor restrictions — same-floor only (RESOLVED) |
| Pawn Warp Gate restriction | Pawn forward push into Warp Gate blocked if opposite destination is occupied; Pawns cannot capture forward or vertically (RESOLVED) |

---

# 55. Document Status

This document is currently an **Approved Product Requirements Document for MVP Development**.

It contains:

- Confirmed game rules and resolved edge cases
- Confirmed implementation principles
- MVP product and technical architecture decisions
- Decoupled headless rules engine specification

No external mechanics from other game concepts are part of this product.

**This document defines Two-Layer Chess only.**

---

# 56. MVP Product & Technical Architecture Decisions

The following architecture and product decisions have been formalized for the MVP release:

## 56.1 Target Platform & Deployment: Static Web Application

- **Decision:** The game will be built as a client-side Single Page Application (SPA) using **Vite, React, TypeScript, and Tailwind CSS**, built and deployed as a **pure static website** (e.g., hosted on GitHub Pages, Vercel, Netlify, or Cloudflare Pages).
- **Why this was made:**
  1. **Frictionless Idea Validation:** Prospective playtesters can access and test the game immediately in any desktop or mobile browser via a simple URL link with zero install barrier.
  2. **Zero Server Maintenance:** A static website requires no game server, backend socket infrastructure, or database maintenance for gameplay, keeping operating costs at zero.
  3. **Zero Latency & Offline Readiness:** All board operations, legal move calculations, and game-loop logic execute instantaneously in the client browser.
  4. **Rapid Iteration:** Vite provides an ultra-fast build and development cycle, allowing immediate updates based on early user feedback.

---

## 56.2 In-App User Feedback Pipeline

- **Decision:** An integrated feedback form/modal will be embedded directly within the game UI (accessible via a persistent feedback button and prompted at game completion) that forwards user feedback directly to a cloud database/storage service (e.g., Supabase, Firebase Firestore, or a secure serverless cloud webhook).
- **Why this was made:**
  1. **Maximum Conversion:** Directing playtesters to external third-party surveys causes severe drop-off. Keeping feedback inside the app captures user sentiment when impressions are fresh.
  2. **Structured Qualitative & Quantitative Data:** Captures specific feedback on game balance, Warp Gate fun factor, Jump piece clarity, and bug reports alongside contextual game metadata (move count, game outcome).
  3. **Serverless Architecture:** Direct client-to-cloud submissions maintain the static nature of the hosting setup without needing a custom application server.

---

## 56.3 Coordinate System Representation: Canonical String Notation

- **Decision:** The primary data structures, public rules engine interfaces, move histories, and UI coordinates will use string notation (`Floor + File + Rank`, e.g., `"1e4"`, `"2c6"`, `"1a1"`) as the canonical representation (defined in TypeScript via template literal types `${Floor}${File}${Rank}`). Internal geometric math converters (`parseCoord` and `toCoord`) will translate string coordinates into numeric tuples only when computing sliding raycasts or board offsets.
- **Why this was made:**
  1. **Player Familiarity:** Regular chess players are intuitively accustomed to algebraic string notation (e.g., `e4`). Extending this to `"1e4"` feels natural and reduces cognitive friction.
  2. **Human-Readable Logging:** Move records, error messages, and FEN/PGN-equivalent histories are immediately understandable during playtesting and debugging without requiring coordinate translation.
  3. **Data Integrity:** String literals prevent errors caused by multi-dimensional array index mismatch across floors, files, and ranks.

---

## 56.4 MVP Game Modes & Autonomous Bot Player

- **Decision:** The MVP will support two core gameplay modes:
  1. **Play vs Bot (Single Player):** An autonomous client-side AI player capable of playing as White or Black using heuristic tactical evaluation and Minimax search.
  2. **Pass & Play (Local 2-Player):** Two human players sharing the same screen/keyboard on alternating turns.
- **Why this was made:**
  1. **Solving the "Empty Room" Problem:** In a static MVP without real-time multiplayer matchmaking, playtesters visiting the website alone would have no one to play against except themselves. A bot allows immediate, engaging solo play.
  2. **Gameplay Demonstrator:** The bot actively uses Warp Gates and Jump pieces, educating players on vertical tactics and showing the game's depth through actual opposition.
  3. **Richer Feedback on Balance:** Playing against an adversary allows testers to accurately judge pacing, tactical tension, and fairness, leading to vastly superior validation data.
  4. **Client-Side Execution:** The bot runs in a client-side Web Worker or lightweight asynchronous heuristic loop, maintaining zero server overhead.

---

## 56.5 Decoupled Headless Rules Engine

- **Decision:** The rules engine will exist in a strictly isolated module (`src/engine/`) with zero UI dependencies, accompanied by automated unit tests validating all rules defined in Section 46.
- **Why this was made:**
  1. **Source of Truth:** Prevents rules leakage into React UI components.
  2. **Testability:** Every warp interaction, jump restriction, castling condition, and check/stalemate case can be verified with automated CI tests.
  3. **Portability:** If Two-Layer Chess later expands to mobile (React Native / Flutter / Android native) or an online multiplayer server, the exact same rules engine can be reused without modification.
