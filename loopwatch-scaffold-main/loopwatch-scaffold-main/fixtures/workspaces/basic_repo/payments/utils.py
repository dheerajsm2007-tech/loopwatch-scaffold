"""Shared payment helpers."""

TAX_RATE = 0.08


def format_currency(amount, currency="USD"):
    return f"{currency} {amount:.2f}"
