from billing.calculator import calculate_discount, apply_tax


def test_calculate_discount():
    assert calculate_discount(100) == 90  # expects a 10% discount


def test_apply_tax():
    assert apply_tax(100) == 108  # expects 8% tax
