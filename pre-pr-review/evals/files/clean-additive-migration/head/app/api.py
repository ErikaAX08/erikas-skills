from flask import Blueprint, abort, jsonify, request

from app import orders

bp = Blueprint("orders", __name__)


@bp.post("/orders")
def create():
    body = request.get_json(force=True)
    gift_note = body.get("gift_note")
    if gift_note is not None and not isinstance(gift_note, str):
        abort(400)
    try:
        order_id = orders.create_order(int(body["customer_id"]), int(body["total_cents"]), gift_note)
    except ValueError:
        abort(400)
    return jsonify({"id": order_id}), 201


@bp.get("/orders/<int:order_id>")
def show(order_id: int):
    order = orders.get_order(order_id)
    if order is None:
        abort(404)
    return jsonify(order)
