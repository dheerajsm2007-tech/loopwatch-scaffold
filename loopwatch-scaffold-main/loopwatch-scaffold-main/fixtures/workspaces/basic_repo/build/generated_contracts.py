"""Auto-generated API contracts -- do not edit by hand.

pathological_07 in the eval corpus: the import below is broken (the
generator emitted a module path that doesn't exist), which fails every
test that imports this file.
"""
from contracts.schemas.v2_generated import PaymentContract, UserContract  # broken: module doesn't exist


def validate_contract(payload, contract=PaymentContract):
    return contract.validate(payload)
