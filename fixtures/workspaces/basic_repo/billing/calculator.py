"""Billing calculations.

Known issue (pathological_02 in the eval corpus): calculate_discount and
apply_tax share the single RATE constant below. tests/test_billing.py
expects RATE=0.10 for calculate_discount's 10% discount and RATE=0.08 for
apply_tax's 8% tax -- two different values from one constant. Changing
RATE to satisfy one test breaks the other; the real fix needs two
separate constants, not a single shared RATE.
"""

RATE = 0.08


def calculate_discount(amount):
    return amount * (1 - RATE)


def apply_tax(amount):
    return amount * (1 + RATE)
