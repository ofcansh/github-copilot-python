import copy
from pathlib import Path

import app


def test_index_returns_html(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"Sudoku Game" in response.data
    assert b'role="grid"' in response.data
    assert b'aria-label="Sudoku puzzle"' in response.data
    assert b'id="leaderboard"' in response.data
    assert b'id="leaderboard-body"' in response.data


def test_new_game_returns_nine_by_nine_puzzle(client):
    response = client.get("/new?clues=40")

    assert response.status_code == 200

    data = response.get_json()
    puzzle = data["puzzle"]

    assert len(puzzle) == 9
    assert all(len(row) == 9 for row in puzzle)
    assert sum(cell != 0 for row in puzzle for cell in row) == 40
    assert app.CURRENT["solution"] is not None


def test_hint_returns_correct_value_for_an_empty_cell(client):
    response = client.get('/new?clues=80')
    puzzle = response.get_json()['puzzle']
    solution = app.CURRENT['solution']
    empty_cell = next(
        (row, col)
        for row in range(9)
        for col in range(9)
        if puzzle[row][col] == 0
    )

    hint_response = client.post('/hint', json={'board': puzzle})

    assert hint_response.status_code == 200
    assert hint_response.get_json() == {
        'row': empty_cell[0],
        'col': empty_cell[1],
        'value': solution[empty_cell[0]][empty_cell[1]]
    }


def test_hint_reports_no_empty_cells(client):
    client.get('/new?clues=81')
    solution = app.CURRENT['solution']

    response = client.post('/hint', json={'board': solution})

    assert response.status_code == 400
    assert response.get_json() == {
        'error': 'There are no empty cells available for a hint'
    }


def test_hint_button_and_counter_are_present(client):
    response = client.get('/')

    assert b'id="hint"' in response.data
    assert b'id="hint-count"' in response.data


def test_timer_is_present_and_uses_elapsed_timestamps():
    main_js = Path(__file__).parents[1] / 'static' / 'main.js'
    source = main_js.read_text(encoding='utf-8')

    assert b'id="timer"' in app.app.test_client().get('/').data
    assert 'Date.now()' in source
    assert 'setInterval(updateTimer, 250)' in source
    assert 'clearInterval(timerInterval)' in source
    assert 'stopTimer();' in source


def test_leaderboard_uses_validated_local_storage_and_completion_data():
    main_js = Path(__file__).parents[1] / 'static' / 'main.js'
    source = main_js.read_text(encoding='utf-8')

    assert "localStorage.getItem(LEADERBOARD_KEY)" in source
    assert "localStorage.setItem(LEADERBOARD_KEY" in source
    assert 'entries.filter(isValidLeaderboardEntry)' in source
    assert '.slice(0, 10)' in source
    assert 'playerName' in source
    assert 'difficulty: currentDifficulty' in source
    assert 'hints: hintsUsed' in source
    assert 'window.prompt' in source


def test_new_game_resets_hint_counter():
    main_js = Path(__file__).parents[1] / 'static' / 'main.js'
    source = main_js.read_text(encoding='utf-8')

    assert 'function resetHintCounter()' in source
    assert 'resetHintCounter();' in source


def test_new_game_supports_difficulty_levels(client):
    expected_clues = {
        'easy': 45,
        'medium': 35,
        'hard': 28
    }

    for difficulty, clues in expected_clues.items():
        response = client.get(f'/new?difficulty={difficulty}')

        assert response.status_code == 200
        puzzle = response.get_json()['puzzle']
        assert sum(cell != 0 for row in puzzle for cell in row) == clues


def test_new_game_accepts_case_insensitive_difficulty(client):
    response = client.get('/new?difficulty=Easy')

    assert response.status_code == 200
    puzzle = response.get_json()['puzzle']
    assert sum(cell != 0 for row in puzzle for cell in row) == 45


def test_new_game_rejects_invalid_difficulty(client):
    response = client.get('/new?difficulty=expert')

    assert response.status_code == 400
    assert response.get_json() == {
        'error': 'Invalid difficulty. Choose easy, medium, or hard'
    }


def test_new_game_rejects_invalid_clues(client):
    for clues in ('not-a-number', '-1', '82'):
        response = client.get(f'/new?clues={clues}')

        assert response.status_code == 400
        assert response.get_json() == {
            'error': 'clues must be an integer between 0 and 81'
        }


def test_difficulty_takes_precedence_over_clues(client):
    response = client.get('/new?difficulty=hard&clues=45')

    assert response.status_code == 200
    puzzle = response.get_json()['puzzle']
    assert sum(cell != 0 for row in puzzle for cell in row) == 28


def test_check_returns_error_when_no_game_exists(client):
    board = [[0 for _ in range(9)] for _ in range(9)]

    response = client.post("/check", json={"board": board})

    assert response.status_code == 400
    assert response.get_json() == {"error": "No game in progress"}


def test_check_returns_no_incorrect_cells_for_solution(client):
    client.get("/new")

    solution = copy.deepcopy(app.CURRENT["solution"])
    response = client.post("/check", json={"board": solution})

    assert response.status_code == 200
    assert response.get_json() == {"incorrect": []}


def test_check_identifies_an_incorrect_cell(client):
    client.get("/new")

    solution = copy.deepcopy(app.CURRENT["solution"])
    incorrect_value = 1 if solution[0][0] != 1 else 2
    solution[0][0] = incorrect_value

    response = client.post("/check", json={"board": solution})

    assert response.status_code == 200
    assert response.get_json() == {"incorrect": [[0, 0]]}