"""
Owner: Person 1

Detector 1 — hard caps. Cheapest, dumbest, catches the worst cases.
"""
from dataclasses import dataclass

MAX_STEPS = 40
MAX_SPEND_USD = 2.00


@dataclass
class Result:
    triggered: bool
    reason: str = ""


def check(steps: list[dict]) -> Result:
    if len(steps) >= MAX_STEPS:
        return Result(True, f"hit step cap ({MAX_STEPS})")

    total_cost = sum(s["cost_usd"] for s in steps)
    if total_cost >= MAX_SPEND_USD:
        return Result(True, f"hit spend cap (${MAX_SPEND_USD:.2f})")

    return Result(False)
