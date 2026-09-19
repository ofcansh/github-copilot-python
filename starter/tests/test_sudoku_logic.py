import sudoku_logic


def is_valid_solution(board):
    expected = set(range(1, sudoku_logic.SIZE + 1))

    rows_valid = all(set(row) == expected for row in board)
    columns_valid = all(
        {board[row][column] for row in range(sudoku_logic.SIZE)} == expected
        for column in range(sudoku_logic.SIZE)
    )
    boxes_valid = all(
        {
            board[row][column]
            for row in range(box_row, box_row + 3)
            for column in range(box_column, box_column + 3)
        }
        == expected
        for box_row in range(0, sudoku_logic.SIZE, 3)
        for box_column in range(0, sudoku_logic.SIZE, 3)
    )

    return rows_valid and columns_valid and boxes_valid


def test_create_empty_board_returns_nine_by_nine_board():
    board = sudoku_logic.create_empty_board()

    assert len(board) == 9
    assert all(len(row) == 9 for row in board)
    assert all(cell == sudoku_logic.EMPTY for row in board for cell in row)


def test_is_safe_rejects_duplicate_in_row_column_and_box():
    board = sudoku_logic.create_empty_board()
    board[0][0] = 5

    assert not sudoku_logic.is_safe(board, 0, 1, 5)
    assert not sudoku_logic.is_safe(board, 1, 0, 5)
    assert not sudoku_logic.is_safe(board, 1, 1, 5)
    assert sudoku_logic.is_safe(board, 0, 1, 4)


def test_fill_board_creates_valid_solution():
    board = sudoku_logic.create_empty_board()

    assert sudoku_logic.fill_board(board)
    assert is_valid_solution(board)


def test_generate_puzzle_returns_solution_and_requested_clues():
    puzzle, solution = sudoku_logic.generate_puzzle(clues=35)

    assert len(puzzle) == 9
    assert len(solution) == 9
    assert is_valid_solution(solution)
    assert sum(cell != 0 for row in puzzle for cell in row) == 35

    for row in range(9):
        for column in range(9):
            if puzzle[row][column] != 0:
                assert puzzle[row][column] == solution[row][column]