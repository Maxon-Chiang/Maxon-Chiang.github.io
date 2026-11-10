# MathGraph Educational Game Engine & Custom Stage API Specification (v2.0)

## 1. Architecture Overview
The MathGraph Game Escape System uses a **Master Shell + Modular Stage Renderer** architecture (`window.GameAPI`).
- **Core Game Escape Principles (MANDATORY)**:
  1. **Dynamic Option Interaction**: Every game MUST feature dynamic motion—either selecting/hitting moving options in a dynamic environment, or placing options into a moving animation (e.g., conveyor belt + robotic claw, smooth-falling tetrominoes, rotating Ferris wheel, moving train, scrolling LED doors). Static plain-button clicking is strictly forbidden.
  2. **Per-Stage Gameplay Guide on Question 1**: In addition to Page 0's course keypoint guide, Question 1 of EVERY stage MUST display a clear gameplay instruction card (`🕹️ 本關遊戲玩法說明`).
  3. **Read-First Floating Start Button per Question**: To prevent moving animations from distracting students while reading/calculating the question, every question MUST initially pause/hide the dynamic arena and display a floating **`▶️ 看完題目，開始本題挑戰！`** button right below the question stem. The dynamic animation & timers only start after clicking this button!

- **Master Shell Responsibilities (Handled Automatically by System)**:
  - Page 0 Course Keypoint Guide & Game Rules (`🚀 我讀懂了，開始闖關！`)
  - Per-Stage Gameplay Instructions on Question 1 & Per-Question Read-First Floating Start Button
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
3. **`safe_cracker`** (3D 工廠輸送帶機械手臂字元組裝 - 填充/計算題, N slots + moving conveyor belt items from `charPool`):
   `{ "q": "Stem ($LaTeX$)", "ans": "ExactAnswer", "charPool": ["14_to_16_single_chars_including_ans_and_distractors"], "hint": "Brief hint", "exp": "Step-by-step solution" }`
4. **`tetris_fill`** (3D 俄羅斯方塊字元矩陣 - 填充/計算題, `ans` MUST be the exact pure answer >= 3 chars with NO prefix like `x=` or `B=` and NO `hint`, compact borderless grid width = `ans.length + 4` & height = 16 rows, continuous smooth vertical falling + discrete 1-col horizontal step, 2~4 cells per piece where every cell's character is independently drawn from `charPool` including digits/symbols/distractors, upright non-rotating characters):
   `{ "q": "Fill-in stem ($LaTeX$)", "ans": "125", "charPool": ["1", "2", "5", "0", "3", "4", "6", "7", "8", "9", "+", "-", "=", "."], "exp": "Step-by-step solution" }`
5. **`balance_scale`** (3D 分岔迷宮之門 - 是非題, boolean answer + scrolling LED marquee):
   `{ "q": "True/False statement ($LaTeX$)", "ans": true, "exp": "Explanation" }`
6. **`wire_connect`** (3D 摩天輪幸福配對 - 配合題, 3~4 pairs + distractors in rotating cabins):
   `{ "q": "Matching prompt", "pairs": [{"left": "L1", "right": "R1"}, {"left": "L2", "right": "R2"}, {"left": "L3", "right": "R3"}], "distractors": ["W1", "W2"], "exp": "Explanation" }`
7. **`escape_order`** (3D 環狀鐵道貨運列車 - 排序題, 3~4 ordered steps loaded onto moving train carriages):
   `{ "q": "Ordering prompt", "steps": ["Step 1", "Step 2", "Step 3", "Step 4"], "exp": "Explanation" }`
8. **`balloon_pop`** (3D 星際隕石射擊 - 多選題, >=8 options, 4~5 correct in `ans`, `reqAnsCount: 3`):
   `{ "q": "Multi-select stem", "options": ["C1", "C2", "C3", "C4", "W1", "W2", "W3", "W4"], "ans": ["C1", "C2", "C3", "C4"], "reqAnsCount": 3, "exp": "Explanation" }`

---

## 4. Custom Game Module Specification (`docType: "game"`)
When creating a brand-new custom game template or stage:
1. **Visual Style**: Pure CSS 3D Flat Design (`perspective: 700px`, tactile `box-shadow: 0 6px 0 ...`, vibrant gradients) + large expressive Emojis. Strictly NO external image URLs.
2. **Anti-Guessing Mechanics**: Never allow simple 50/50 blind clicking. Use multi-distractor pools (8 options), batch verification, sequential reveals, or moving targets.
3. **LaTeX Escaping**: Inside JSON strings or JS strings, ALWAYS double-escape LaTeX backslashes (`"\\\\times"`, `"\\\\frac{a}{b}"`, `"\\\\sqrt{2}"`, `"\\\\overline{AB}"`).