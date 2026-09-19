// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const LEADERBOARD_KEY = 'sudokuLeaderboard';
const THEME_KEY = 'sudokuTheme';
let puzzle = [];
let hintsUsed = 0;
let timerStartedAt = null;
let timerInterval = null;
let currentDifficulty = 'Medium';
let gameCompleted = false;

function isValidTheme(theme) {
  return theme === 'light' || theme === 'dark';
}

function loadTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return isValidTheme(savedTheme) ? savedTheme : 'light';
  } catch (error) {
    return 'light';
  }
}

function updateThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  const isDark = document.body.dataset.theme === 'dark';
  toggle.innerText = `Theme: ${isDark ? 'Dark' : 'Light'}`;
  toggle.setAttribute('aria-pressed', String(isDark));
  toggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
}

function applyTheme(theme) {
  const validTheme = isValidTheme(theme) ? theme : 'light';
  document.body.dataset.theme = validTheme;
  updateThemeToggle();
}

function initializeTheme() {
  applyTheme(loadTheme());
}

function toggleTheme() {
  const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch (error) {
    // The theme still applies for this page when storage is unavailable.
  }
}

function setMessageState(message, state) {
  message.classList.remove('message-success', 'message-error');
  if (state) message.classList.add(`message-${state}`);
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    rowDiv.setAttribute('role', 'row');
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.inputMode = 'numeric';
      input.autocomplete = 'off';
      input.className = getCellClasses(i, j);
      input.setAttribute('role', 'gridcell');
      input.setAttribute('aria-label', `Row ${i + 1}, column ${j + 1}`);
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^1-9]/g, '').slice(0, 1);
        updateConflicts();
      });
      input.addEventListener('keydown', handleCellKeydown);
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function getCellClasses(row, col) {
  const boxRow = Math.floor(row / 3);
  const boxCol = Math.floor(col / 3);
  const boxTone = (boxRow + boxCol) % 2 === 0 ? 'box-tone-a' : 'box-tone-b';
  return `sudoku-cell ${boxTone}`;
}

function handleCellKeydown(event) {
  const directions = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1]
  };
  const direction = directions[event.key];
  if (!direction) return;

  event.preventDefault();
  const row = Number(event.target.dataset.row);
  const col = Number(event.target.dataset.col);
  focusNextEditableCell(row, col, direction[0], direction[1]);
}

function focusNextEditableCell(row, col, rowStep, colStep) {
  let nextRow = row + rowStep;
  let nextCol = col + colStep;
  while (nextRow >= 0 && nextRow < SIZE && nextCol >= 0 && nextCol < SIZE) {
    const nextCell = document.querySelector(
      `.sudoku-cell[data-row="${nextRow}"][data-col="${nextCol}"]`
    );
    if (nextCell && !nextCell.disabled) {
      nextCell.focus();
      return;
    }
    nextRow += rowStep;
    nextCol += colStep;
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.classList.add('prefilled');
        inp.setAttribute('aria-readonly', 'true');
      } else {
        inp.value = '';
        inp.disabled = false;
        inp.setAttribute('aria-readonly', 'false');
      }
    }
  }
  updateConflicts();
}

function getCurrentBoard() {
  const inputs = document.querySelectorAll('.sudoku-cell');
  return Array.from(inputs).map((input) => input.value ? parseInt(input.value, 10) : 0);
}

function getBoardMatrix() {
  const values = getCurrentBoard();
  return Array.from({length: SIZE}, (_, row) => (
    values.slice(row * SIZE, (row + 1) * SIZE)
  ));
}

function getDifficultyForPuzzle(puz) {
  const clueCount = puz.flat().filter((value) => value !== 0).length;
  const difficultyByClues = {45: 'Easy', 35: 'Medium', 28: 'Hard'};
  return difficultyByClues[clueCount] || 'Custom';
}

function isValidLeaderboardEntry(entry) {
  return entry !== null
    && typeof entry === 'object'
    && typeof entry.playerName === 'string'
    && entry.playerName.trim().length > 0
    && Number.isFinite(entry.time)
    && entry.time >= 0
    && typeof entry.difficulty === 'string'
    && entry.difficulty.trim().length > 0
    && Number.isInteger(entry.hints)
    && entry.hints >= 0;
}

function loadLeaderboard() {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    if (!stored) return [];
    const entries = JSON.parse(stored);
    if (!Array.isArray(entries)) return [];
    return entries.filter(isValidLeaderboardEntry)
      .sort((first, second) => first.time - second.time)
      .slice(0, 10);
  } catch (error) {
    return [];
  }
}

function saveLeaderboard(entries) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    return false;
  }
}

function renderLeaderboard() {
  const entries = loadLeaderboard();
  const body = document.getElementById('leaderboard-body');
  const emptyMessage = document.getElementById('leaderboard-empty');
  body.innerHTML = '';
  emptyMessage.hidden = entries.length > 0;

  entries.forEach((entry, index) => {
    const row = document.createElement('tr');
    const values = [
      index + 1,
      entry.playerName,
      formatElapsedTime(entry.time),
      entry.difficulty,
      entry.hints
    ];
    values.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });
    body.appendChild(row);
  });
}

function recordCompletion() {
  const playerName = window.prompt('Enter your name for the leaderboard:');
  const trimmedName = playerName ? playerName.trim() : '';
  const msg = document.getElementById('message');
  if (!trimmedName) {
    setMessageState(msg, 'error');
    msg.innerText = 'Puzzle completed. Enter a name to save your leaderboard time.';
    return false;
  }

  const entry = {
    playerName: trimmedName.slice(0, 50),
    time: Math.max(0, Date.now() - timerStartedAt),
    difficulty: currentDifficulty,
    hints: hintsUsed
  };
  const entries = loadLeaderboard();
  entries.push(entry);
  entries.sort((first, second) => first.time - second.time);
  const saved = saveLeaderboard(entries.slice(0, 10));
  renderLeaderboard();

  if (!saved) {
    setMessageState(msg, 'error');
    msg.innerText = 'Puzzle completed, but the leaderboard could not be saved.';
    return false;
  }
  return true;
}

function updateHintCount() {
  document.getElementById('hint-count').innerText = `Hints used: ${hintsUsed}`;
}

function resetHintCounter() {
  hintsUsed = 0;
  updateHintCount();
}

function formatElapsedTime(elapsedMilliseconds) {
  const totalSeconds = Math.floor(elapsedMilliseconds / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${paddedMinutes}:${paddedSeconds}`;
}

function updateTimer() {
  if (timerStartedAt === null) return;
  const elapsedMilliseconds = Date.now() - timerStartedAt;
  document.getElementById('timer').innerText = `Time: ${formatElapsedTime(elapsedMilliseconds)}`;
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer() {
  stopTimer();
  timerStartedAt = Date.now();
  updateTimer();
  timerInterval = setInterval(updateTimer, 250);
}

function updateConflicts() {
  const inputs = Array.from(document.querySelectorAll('.sudoku-cell'));
  const values = getCurrentBoard();
  inputs.forEach((input, index) => {
    if (input.disabled) return;

    const value = values[index];
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    const hasConflict = value !== 0 && inputs.some((other, otherIndex) => {
      if (otherIndex === index || values[otherIndex] !== value) return false;
      const otherRow = Number(other.dataset.row);
      const otherCol = Number(other.dataset.col);
      const sameBox = Math.floor(row / 3) === Math.floor(otherRow / 3)
        && Math.floor(col / 3) === Math.floor(otherCol / 3);
      return row === otherRow || col === otherCol || sameBox;
    });

    input.classList.toggle('conflict', hasConflict);
    input.setAttribute('aria-invalid', hasConflict ? 'true' : 'false');
  });
}

async function newGame() {
  const res = await fetch('/new');
  const data = await res.json();
  if (!res.ok || !data.puzzle) {
    setMessageState(document.getElementById('message'), 'error');
    document.getElementById('message').innerText = data.error || 'Unable to start a new game.';
    return;
  }
  renderPuzzle(data.puzzle);
  currentDifficulty = getDifficultyForPuzzle(data.puzzle);
  resetHintCounter();
  gameCompleted = false;
  startTimer();
  const msg = document.getElementById('message');
  setMessageState(msg, '');
  msg.innerText = '';
}

async function useHint() {
  const res = await fetch('/hint', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board: getBoardMatrix()})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    setMessageState(msg, 'error');
    msg.innerText = data.error;
    return;
  }

  const input = document.querySelector(
    `.sudoku-cell[data-row="${data.row}"][data-col="${data.col}"]`
  );
  if (!input || input.disabled || input.value) {
    setMessageState(msg, 'error');
    msg.innerText = 'That cell is no longer available for a hint.';
    return;
  }

  input.value = data.value;
  input.disabled = true;
  input.classList.add('prefilled', 'hinted');
  input.setAttribute('aria-readonly', 'true');
  input.setAttribute('aria-label', `${input.getAttribute('aria-label')} (hint)`);
  hintsUsed += 1;
  updateHintCount();
  updateConflicts();
  setMessageState(msg, 'success');
  msg.innerText = 'A correct cell was filled in for you.';
}

async function checkSolution() {
  if (gameCompleted) return;
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    setMessageState(msg, 'error');
    msg.innerText = data.error;
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.classList.remove('incorrect');
    if (incorrect.has(idx)) {
      inp.classList.add('incorrect');
    }
  }
  if (incorrect.size === 0) {
    gameCompleted = true;
    stopTimer();
    const leaderboardSaved = recordCompletion();
    if (leaderboardSaved) {
      setMessageState(msg, 'success');
      msg.innerText = 'Congratulations! You solved it!';
    }
  } else {
    setMessageState(msg, 'error');
    msg.innerText = 'Some cells are incorrect.';
  }
}

// Wire buttons
window.addEventListener('load', () => {
  initializeTheme();
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('hint').addEventListener('click', useHint);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  updateHintCount();
  renderLeaderboard();
  // initialize
  newGame();
});