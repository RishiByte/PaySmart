from typing import List, Dict

def simplify_debts(balance_map: Dict[str, float]) -> List[Dict[str, float]]:
    """
    Calculate optimized group balances using greedy debt minimization.
    Translated from JavaScript balance.service.js to Python.
    """
    creditors = []
    debtors = []

    for user_id, balance in balance_map.items():
        if balance > 0:
            creditors.append({"userId": user_id, "amount": balance})
        elif balance < 0:
            debtors.append({"userId": user_id, "amount": abs(balance)})

    creditors.sort(key=lambda x: x["amount"], reverse=True)
    debtors.sort(key=lambda x: x["amount"], reverse=True)

    transactions = []

    while creditors and debtors:
        creditor = creditors[0]
        debtor = debtors[0]

        settle_amount = round(min(debtor["amount"], creditor["amount"]), 2)

        if settle_amount > 0:
            transactions.append({
                "from": debtor["userId"],
                "to": creditor["userId"],
                "amount": settle_amount,
            })

        debtor["amount"] = round(debtor["amount"] - settle_amount, 2)
        creditor["amount"] = round(creditor["amount"] - settle_amount, 2)

        if debtor["amount"] == 0:
            debtors.pop(0)
        if creditor["amount"] == 0:
            creditors.pop(0)

        creditors.sort(key=lambda x: x["amount"], reverse=True)
        debtors.sort(key=lambda x: x["amount"], reverse=True)

    return transactions
