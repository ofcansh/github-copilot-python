import copy

import app


def test_index_returns_html(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"Sudoku Game" in response.data
    assert b'role="grid"' in response.data
    assert b'aria-label="Sudoku puzzle"' in response.data


def test_new_game_returns_nine_by_nine_puzzle(client):
    response = client.get("/new?clues=40")

    assert response.status_code == 200

    data = response.get_json()
    puzzle = data["puzzle"]

    assert len(puzzle) == 9
    assert all(len(row) == 9 for row in puzzle)
    assert sum(cell != 0 for row in puzzle for cell in row) == 40
    assert app.CURRENT["solution"] is not None


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