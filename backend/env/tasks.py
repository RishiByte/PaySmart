import random
from typing import Dict, List, Tuple

def get_task_config(task_level: int) -> dict:
    """Gets configuration parameters based on task level."""
    if task_level == 1:
        return {
            "users_range": (3, 4),
            "amounts_are_floats": False,
            "has_constraints": False,
            "fee_percent": 0.0,
            "step_penalty": -0.05
        }
    elif task_level == 2:
        return {
            "users_range": (6, 8),
            "amounts_are_floats": True,
            "has_constraints": True,
            "fee_percent": 0.0,
            "step_penalty": -0.05
        }
    else:  # task_level >= 3
        return {
            "users_range": (10, 12),
            "amounts_are_floats": True,
            "has_constraints": False,
            "fee_percent": 0.02,
            "step_penalty": -0.10
        }

def generate_users(num_users: int) -> List[str]:
    # Names A, B, C...
    if num_users <= 26:
        return [chr(65 + i) for i in range(num_users)]
    return [f"User{i}" for i in range(num_users)]

def generate_random_ledger(task_level: int) -> Tuple[List[str], Dict[str, float], List[str]]:
    config = get_task_config(task_level)
    num_users = random.randint(config["users_range"][0], config["users_range"][1])
    users = generate_users(num_users)
    
    balances = {u: 0.0 for u in users}
    
    # Generate random debts that sum to 0
    num_random_debts = num_users * 2
    for _ in range(num_random_debts):
        payer = random.choice(users)
        payee = random.choice([u for u in users if u != payer])
        
        if config["amounts_are_floats"]:
            amount = round(random.uniform(10.0, 500.0), 2)
        else:
            amount = float(random.choice([50, 100, 150, 200, 250, 500]))
            
        balances[payer] += amount
        balances[payee] -= amount
        
    for k in balances:
        balances[k] = round(balances[k], 2)
        if abs(balances[k]) < 0.001:
            balances[k] = 0.0
            
    constraints = []
    if config["has_constraints"]:
        num_constraints = random.randint(1, 2)
        for _ in range(num_constraints):
            ctype = random.choice(["refuse_direct", "only_transact"])
            if ctype == "refuse_direct":
                u1 = random.choice(users)
                u2 = random.choice([u for u in users if u != u1])
                constraints.append(f"{u1} cannot pay {u2} directly")
            else:
                u1 = random.choice(users)
                others = [u for u in users if u != u1]
                u2, u3 = random.sample(others, 2)
                constraints.append(f"{u1} can only transact with {u2} or {u3}")

    return users, balances, constraints
