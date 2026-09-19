import copy

import app


def test_index_returns_html(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"Sudoku Game" in response.data


def test_new_game_returns_nine_by_nine_puzzle(client):
    response = client.get("/new?clues=40")

    assert response.status_code == 200

    data = response.get_json()
    puzzle = data["puzzle"]

    assert len(puzzle) == 9
    assert all(len(row) == 9 for row in puzzle)
    assert sum(cell != 0 for row in puzzle for cell in row) == 40
    assert app.CURRENT["solution"] is not None


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