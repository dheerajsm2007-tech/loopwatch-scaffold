"""Payment processing engine with multi-currency support."""
from decimal import Decimal

_SUPPORTED_CURRENCIES = {"USD": Decimal("1.0"), "EUR": Decimal("0.92"), "GBP": Decimal("0.78"), "INR": Decimal("83.5")}

class PaymentProcessor:
    def __init__(self, merchant_id: str, base_currency: str = "USD"):
        self.merchant_id = merchant_id
        self.base_currency = base_currency
        self.transactions = []

    def convert(self, amount: float, from_curr: str, to_curr: str) -> float:
        if from_curr not in _SUPPORTED_CURRENCIES or to_curr not in _SUPPORTED_CURRENCIES:
            raise ValueError(f"Unsupported currency conversion: {from_curr} to {to_curr}")
        in_usd = Decimal(str(amount)) / _SUPPORTED_CURRENCIES[from_curr]
        target = in_usd * _SUPPORTED_CURRENCIES[to_curr]
        return float(round(target, 2))

    def process_charge(self, amount: float, currency: str = "USD") -> dict:
        if amount <= 0:
            raise ValueError("Charge amount must be positive")
        usd_amount = self.convert(amount, currency, "USD")
        tx_id = f"tx_{len(self.transactions) + 1:06d}"
        record = {"tx_id": tx_id, "amount": amount, "currency": currency, "usd_equivalent": usd_amount, "status": "SUCCESS"}
        self.transactions.append(record)
        return record
