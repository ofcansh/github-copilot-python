from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

# Keep a simple in-memory store for current puzzle and solution
CURRENT = {
    'puzzle': None,
    'solution': None
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new')
def new_game():
    difficulty = request.args.get('difficulty')
    clues_value = request.args.get('clues', '35')

    if difficulty is not None:
        difficulty_key = difficulty.lower()
        if difficulty_key not in sudoku_logic.DIFFICULTY_CLUES:
            return jsonify({'error': 'Invalid difficulty. Choose easy, medium, or hard'}), 400
        clues = sudoku_logic.DIFFICULTY_CLUES[difficulty_key]
    else:
        try:
            clues = int(clues_value)
        except (TypeError, ValueError):
            return jsonify({'error': 'clues must be an integer between 0 and 81'}), 400

        if not 0 <= clues <= sudoku_logic.SIZE * sudoku_logic.SIZE:
            return jsonify({'error': 'clues must be an integer between 0 and 81'}), 400

    puzzle, solution = sudoku_logic.generate_puzzle(clues)
    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution
    return jsonify({'puzzle': puzzle})

@app.route('/check', methods=['POST'])
def check_solution():
    data = request.json
    board = data.get('board')
    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400
    incorrect = []
    for i in range(sudoku_logic.SIZE):
        for j in range(sudoku_logic.SIZE):
            if board[i][j] != solution[i][j]:
                incorrect.append([i, j])
    return jsonify({'incorrect': incorrect})

if __name__ == '__main__':
    app.run(debug=True)