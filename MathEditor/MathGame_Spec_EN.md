# MathGraph Educational Game Engine & Custom Stage API Specification (v2.0)

## 1. Architecture Overview & 4 Golden Principles
The MathGraph Game Escape System uses a **Master Shell + Modular Stage Renderer** architecture (`window.GameAPI`).
- **4 Golden Principles of Game Escape (MANDATORY)**:
  1. **Dynamic Gameplay**: Every game must be real-time and dynamic (`requestAnimationFrame` / physics / continuous motion).
  2. **Moving Options in a Dynamic Environment**: Candidate options/characters MUST move dynamically within the arena (popping moles, scrolling conveyor belts, falling capsules, smooth-falling tetrominoes, scrolling LED marquees, rotating Ferris wheel cabins, orbiting cargo docks). Static option buttons are strictly forbidden.
  3. **Per-Stage Game Rules Intro Before Question 1**: In addition to Page 0 (Course Keypoint Guide), the beginning of **every stage (before Question 1)** automatically displays a dedicated **Stage Gameplay Instructions Card**.
  4. **Per-Question Floating "Start Game" Gate**: To prevent moving elements from distracting students while reading the math stem, **every question starts in a paused reading state** with a floating button right below the question banner (`▶️ 我讀完題目了，開始本題挑戰！`). Dynamic motion only begins after the student clicks this button.

- **Master Shell Responsibilities (Handled Automatically by System)**:
  - Page 0 Course Keypoint Guide & Game Rules (`🚀 我讀懂了，開始闖關！`)
  - Per-Stage Gameplay Intro Card before Question 1 & Per-Question Floating Start Button Gate
  - Dual-Color Indicator Lights HUD (`🟣 關卡進度燈號` + `🔵 本關題號燈號`)
  - 3 Hearts (`❤️❤️❤️`) per stage & Anti-Brute-Force 2x Question Pool Reshuffling
  - Immediate Question Swapping from the reserve pool whenever a player makes a mistake
  - 1.4-second Per-Question Celebration Splash Screen & Stage-Clear Confirmation Pause
  - Final Comprehensive Review Report (`#sys-result-report`, `#sys-full-graded-report`, `#sys-hidden-answer-key`) for anti-cheat submission

- **AI / Custom Stage Responsibilities**:
  1. Provide the structured JSON data package (`title`, `keypoints`, `stages` with `pool`, and optional `customRenderers`).
  2. For custom game types, implement `window.CustomStageRenderers[gameType] = function(container, qData, api) { ... }`.

---

## 2. Standard `window.GameAPI` Interface (Passed as `api` to Stage Renderers)
When `window.CustomStageRenderers[gameType](container, qData, api)` is invoked:
- `container` (`HTMLElement`): The stage arena DOM container where you render your 3D interactive UI.
- `qData` (`Object`): The current question object drawn from `stage.pool`.
- `api.stageIndex` (`Number`): 0-based index of the current stage.
- `api.questionIndex` (`Number`): 0-based index of the current question within this stage (`0` to `requiredCount - 1`). Use this to scale difficulty (e.g., speed or number of targets).
- `api.requiredCount` (`Number`): Total questions required to clear this stage.
- `api.hp` (`Number`): Current remaining hearts (`1` to `3`).
- `api.submit(isCorrect, customExp)`:
  - Call `api.submit(true)` when the student solves the current question.
  - Call `api.submit(false)` when the student makes a mistake (the engine automatically deducts 1 HP, displays feedback, and swaps in a new question from `pool`).
- `api.setMessage(htmlString)`: Updates the bottom status/hint bar of the stage.
- `api.typeset(targetElement)`: Triggers MathJax rendering on dynamic DOM elements containing `$LaTeX$`.
- `api.registerCleanup(cleanupFn)`: **MANDATORY** whenever your stage uses `setInterval`, `setTimeout`, `requestAnimationFrame`, or `window.addEventListener`. Register a function that stops all timers/listeners when the question or stage ends.

---

## 3. Built-in `gameType` Schemas (No `customRenderers` Needed)
If a stage uses one of the 7 built-in `gameType`s, the Master Shell renders the 3D stage automatically. You only need to supply `pool` items matching its schema:

1. **`whack_a_mole`** (3D 立體打地鼠 - 單選題, 8 options per question):
   `{ "q": "Stem ($LaTeX$)", "options": ["Ans", "D1", "D2", "D3", "D4", "D5", "D6", "D7"], "ans": "Ans", "exp": "Step-by-step solution" }`
2. **`space_shooter`** (3D 星際戰機射擊 - 單選題, 8 options per question):
   `{ "q": "Stem ($LaTeX$)", "options": ["Ans", "D1", "D2", "D3", "D4", "D5", "D6", "D7"], "ans": "Ans", "exp": "Step-by-step solution" }`
3. **`safe_cracker`** (3D 滾輪金庫鎖 - 填充/計算題, N reels + 14~16 charPool):
   `{ "q": "Stem ($LaTeX$)", "ans": "ExactAnswer", "charPool": ["14_to_16_single_chars_including_ans_and_distractors"], "hint": "Brief hint", "exp": "Step-by-step solution" }`
4. **`balance_scale`** (3D 分岔迷宮之門 - 是非題, boolean answer):
   `{ "q": "True/False statement ($LaTeX$)", "ans": true, "exp": "Explanation" }`
5. **`wire_connect`** (3D 雷射稜鏡配對 - 配合題, 3~4 pairs + distractors):
   `{ "q": "Matching prompt", "pairs": [{"left": "L1", "right": "R1"}, {"left": "L2", "right": "R2"}, {"left": "L3", "right": "R3"}], "distractors": ["W1", "W2"], "exp": "Explanation" }`
6. **`escape_order`** (3D 神殿浮空斷橋 - 排序題, 3~4 ordered steps):
   `{ "q": "Ordering prompt", "steps": ["Step 1", "Step 2", "Step 3", "Step 4"], "exp": "Explanation" }`
7. **`balloon_pop`** (3D 星際隕石射擊 - 多選題, >=8 options, 4~5 correct in `ans`, `reqAnsCount: 3`):
   `{ "q": "Multi-select stem", "options": ["C1", "C2", "C3", "C4", "W1", "W2", "W3", "W4"], "ans": ["C1", "C2", "C3", "C4"], "reqAnsCount": 3, "exp": "Explanation" }`
8. **`tetris_fill`** (3D 俄羅斯方塊字元矩陣 - 填充/計算題, `ans` MUST be >= 3 chars, dynamic grid width = `ans.length + 4`, 2~4 cells per falling piece, upright non-rotating characters):
   `{ "q": "Fill-in stem ($LaTeX$)", "ans": "x=5", "charPool": ["x", "=", "5", "-", "+", "1", "2", "3", "4", "6", "7", "8", "9", "0"], "hint": "Brief hint (e.g. 請拼出 x=5)", "exp": "Step-by-step solution" }`

---

## 4. Custom Game Module Specification (`docType: "game"`)
When creating a brand-new custom game template or stage:
1. **Visual Style**: Pure CSS 3D Flat Design (`perspective: 700px`, tactile `box-shadow: 0 6px 0 ...`, vibrant gradients) + large expressive Emojis. Strictly NO external image URLs.
2. **Anti-Guessing Mechanics**: Never allow simple 50/50 blind clicking. Use multi-distractor pools (8 options), batch verification, sequential reveals, or moving targets.
3. **LaTeX Escaping**: Inside JSON strings or JS strings, ALWAYS double-escape LaTeX backslashes (`"\\\\times"`, `"\\\\frac{a}{b}"`, `"\\\\sqrt{2}"`, `"\\\\overline{AB}"`).