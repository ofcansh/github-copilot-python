<CodeBlock language="markdown" editable> # Sudoku Project Instructions

Project Overview

Build a complete Sudoku game using Python Flask, HTML, CSS, and JavaScript.

Follow the existing starter project structure where practical. Refactor the legacy code into clear, reusable modules.

Coding Standards

Write readable, maintainable Python code.

Use meaningful variable and function names.

Follow PEP 8 conventions.

Keep functions focused on one responsibility.

Add comments where the logic is not obvious.

Avoid unnecessary dependencies.

Handle invalid inputs and errors gracefully.

Do not duplicate existing functionality.

Sudoku Requirements

Use a 9x9 Sudoku board.

Each row, column, and 3x3 box must contain numbers 1 through 9 without repetition.

Generate puzzles with exactly one solution.

Support Easy, Medium, and Hard difficulties.

Lock the original prefilled cells.

Provide hints that fill and lock one correct cell.

Highlight incorrect entries when checking.

Display a completion message when solved.

Frontend Requirements

Use responsive HTML, CSS, and JavaScript.

Support desktop and mobile screen sizes.

Include alternating 3x3 box colors.

Support light and dark themes.

Provide readable labels and accessible controls.

Prevent layout shifts when interacting with cells.

Game Features

Add a timer.

Add a working Hint button.

Add a working Check button.

Save the Top 10 fastest scores in localStorage.

Store player name, time, difficulty, and hints.

Keep scores after refreshing the browser.

Testing

Set up tests before refactoring.

Preserve existing behavior where required.

Add tests for new functionality.

Run the test suite after every major change.

Do not claim tests pass without running them.

Do not remove tests simply to make them pass.

Copilot Workflow

Inspect existing code before modifying it.

Explain the purpose of proposed changes.

Make focused changes in manageable steps.

Do not overwrite unrelated working code.

Explain unfamiliar Python, Flask, or JavaScript concepts when requested.

Identify assumptions and potential edge cases.

Ask before introducing major dependencies or changing the application architecture. </CodeBlock>