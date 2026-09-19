# Flask Sudoku

A browser-based 9×9 Sudoku game built with Python, Flask, HTML, CSS, and JavaScript. The application generates valid Sudoku puzzles with exactly one solution and provides a responsive, interactive game experience.

## Features

* Generates 9×9 Sudoku puzzles with exactly one solution.
* Supports Easy, Medium, and Hard difficulty settings.
* Keeps original puzzle clues locked and visually distinct.
* Accepts only digits 1–9 in editable cells.
* Highlights conflicts in the same row, column, or 3×3 box.
* Provides hints that fill and lock one correct empty cell.
* Tracks elapsed solving time.
* Checks the board against the stored solution.
* Displays a completion message and offers leaderboard entry.
* Supports persistent light and dark themes.
* Stores the top 10 fastest completed games in browser `localStorage`.
* Supports keyboard navigation and visible focus states.
* Includes automated tests using pytest.

## Technologies Used

* Python 3
* Flask
* pytest
* HTML5
* CSS3
* Vanilla JavaScript
* Browser `localStorage`

## Project Structure

```text
starter/
├── app.py
├── sudoku_logic.py
├── requirements.txt
├── README.md
├── .gitignore
├── static/
│   ├── main.js
│   └── styles.css
├── templates/
│   └── index.html
└── tests/
    ├── conftest.py
    ├── test_app.py
    └── test_sudoku_logic.py
```

## Setup and Installation

### 1. Open the project directory

From the repository root:

```powershell
cd starter
```

### 2. Create a virtual environment

**Windows PowerShell:**

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS or Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

**Windows:**

```powershell
py -m pip install -r requirements.txt
```

**macOS or Linux:**

```bash
python3 -m pip install -r requirements.txt
```

## Run the Application

From the `starter` directory, run:

```powershell
py app.py
```

On macOS or Linux, use:

```bash
python3 app.py
```

Open the following address in your browser:

http://127.0.0.1:5000

The current puzzle and its solution are maintained in the Flask application's in-memory state. The leaderboard and theme preference are stored in the browser; leaderboard data is not sent to Flask.

## Run Tests

From the `starter` directory, run:

```powershell
py -m pytest -q
```

The test suite covers Sudoku logic, solution counting, unique puzzle generation, difficulty and clue validation, Flask routes, hints, and selected frontend implementation requirements.

To run tests with detailed output:

```powershell
py -m pytest -v
```

## Difficulty Levels

The `/new` route supports the following clue counts:

| Difficulty | Number of Clues |
| ---------- | --------------: |
| Easy       |              45 |
| Medium     |              35 |
| Hard       |              28 |

Example requests:

```text
/new?difficulty=easy
/new?difficulty=medium
/new?difficulty=hard
```

For backward compatibility, the route also supports a custom clue count:

```text
/new?clues=40
```

Calling `/new` without parameters creates the default 35-clue puzzle.

**Current UI limitation:** The page's New Game button uses the default puzzle. A difficulty selector is not currently implemented in the interface.

## Game Controls

* **New Game:** Loads a new puzzle and resets the timer and hint counter.
* **Hint:** Fills one empty editable cell with its correct value and locks that cell.
* **Check Solution:** Checks the current board against the stored solution and highlights incorrect entries.
* **Timer:** Tracks elapsed solving time, displaying `MM:SS` or `H:MM:SS`.
* **Theme:** Switches between light and dark themes and saves the preference in `localStorage`.
* **Keyboard navigation:** Arrow keys move focus between editable cells.

## Leaderboard

After a successful puzzle completion, the game offers the player an opportunity to enter a name.

Each leaderboard entry contains:

* Player name
* Completion time
* Difficulty
* Number of hints used

Entries are stored in browser `localStorage` under the key `sudokuLeaderboard`. The leaderboard sorts entries by fastest completion time and retains up to 10 entries.

The leaderboard persists across page refreshes in the same browser. Starting a new game does not clear saved entries.

Malformed stored data and unavailable browser storage are handled defensively. Blank names are not saved.

## Theme Preference

The selected theme is stored in browser `localStorage` under the key `sudokuTheme`.

The application supports light and dark themes and defaults to light when no valid saved preference is available.

## Current Scope and Limitations

* The leaderboard is browser-local and does not synchronize across devices.
* There are no user accounts or server-side leaderboard database.
* The current interface does not include a difficulty selector.
* Note-taking mode is not implemented.
* Browser-level automated interaction tests are not configured.

## Development Notes

* Keep application code and tests organized in their existing directories.
* Run the test suite after significant changes.
* The `.gitignore` file excludes generated files such as `.pytest_cache/`, `__pycache__/`, and the virtual environment.
