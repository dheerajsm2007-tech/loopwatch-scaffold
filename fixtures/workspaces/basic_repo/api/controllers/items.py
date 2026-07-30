"""Items controller."""

_ITEMS = [{"id": i, "name": f"item-{i}"} for i in range(1, 51)]


def list_items():
    # TODO (productive_08): add page/per_page params and total-count metadata
    return _ITEMS
