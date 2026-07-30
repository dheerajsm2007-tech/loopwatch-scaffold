"""Payment processing handlers."""


def process_payment(email, amount):
    # TODO (productive_01): add email-format and positive-amount validation
    return {"email": email, "amount": amount, "status": "processed"}
