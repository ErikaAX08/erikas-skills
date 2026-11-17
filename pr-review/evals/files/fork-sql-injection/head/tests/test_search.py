from unittest.mock import MagicMock, patch

from catalog.app import create_app


@patch("catalog.search.get_cursor")
def test_search_returns_rows(get_cursor):
    cursor = MagicMock()
    cursor.fetchall.return_value = [(1, "Lamp", 2500)]
    get_cursor.return_value.__enter__.return_value = cursor
    response = create_app().test_client().get("/products/search?q=lam")
    assert response.status_code == 200


@patch("catalog.search.get_cursor")
def test_search_accepts_sort(get_cursor):
    cursor = MagicMock()
    cursor.fetchall.return_value = []
    get_cursor.return_value.__enter__.return_value = cursor
    response = create_app().test_client().get("/products/search?q=lam&sort=price_cents")
    assert response.status_code == 200
