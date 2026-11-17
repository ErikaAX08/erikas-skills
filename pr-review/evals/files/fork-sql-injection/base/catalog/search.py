from flask import Blueprint, jsonify, request

from catalog.db import get_cursor

bp = Blueprint("search", __name__)


@bp.get("/products/search")
def search_products():
    term = request.args.get("q", "")
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT id, name, price_cents FROM products WHERE name ILIKE %s ORDER BY name",
            (f"%{term}%",),
        )
        rows = cursor.fetchall()
    return jsonify([{"id": r[0], "name": r[1], "price_cents": r[2]} for r in rows])
