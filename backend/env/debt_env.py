import copy
from typing import Dict, Any

from .tasks import generate_random_ledger, get_task_config
from .reward import compute_reward
from .ledger import simplify_debts

class DebtSplitEnv:
    def __init__(self):
        self._state = {}

    def reset(self, task_level: int = 1) -> dict:
        users, balances, constraints = generate_random_ledger(task_level)
        optimal_debts = simplify_debts(copy.deepcopy(balances))
        
        N = len(users)
        max_steps = N - 1
        
        self._state = {
            "users": users,
            "balances": balances,
            "debts": optimal_debts,
            "task_level": task_level,
            "max_steps": max_steps,
            "steps_taken": 0,
            "total_reward": 0.0,
            "active_constraints": constraints,
            "done": False,
            "config": get_task_config(task_level)
        }
        
        return {
            "users": users,
            "balances": copy.deepcopy(balances),
            "debts": optimal_debts,
            "task_level": task_level,
            "max_steps": max_steps,
            "steps_taken": 0
        }

    def _is_valid_action(self, payer: str, payee: str, amount: float) -> bool:
        if amount <= 0:
            return False
            
        balances = self._state["balances"]
        if payer not in balances or payee not in balances:
            return False
            
        payer_bal = balances[payer]
        payee_bal = balances[payee]
        
        if payer_bal >= 0:
            return False
        if payer_bal + amount > 0.001:
            return False
            
        if payee_bal <= 0:
            return False
        if payee_bal - amount < -0.001:
            return False
            
        for c in self._state["active_constraints"]:
            if "cannot pay" in c:
                parts = c.split(" cannot pay ")
                u1 = parts[0]
                u2 = parts[1].replace(" directly", "")
                if payer == u1 and payee == u2:
                    return False
            elif "can only transact with" in c:
                parts = c.split(" can only transact with ")
                u1 = parts[0]
                others = parts[1].split(" or ")
                if payer == u1 and payee not in others:
                    return False
                if payee == u1 and payer not in others:
                    return False
                    
        return True

    def step(self, action: dict) -> dict:
        payer = action.get("payer")
        payee = action.get("payee")
        amount = float(action.get("amount", 0.0))
        
        is_valid = self._is_valid_action(payer, payee, amount)
        
        if not is_valid:
            reward = compute_reward(
                action=action,
                old_balances=self._state["balances"],
                new_balances=self._state["balances"],
                done=self._state["done"],
                steps_taken=self._state["steps_taken"],
                max_steps=self._state["max_steps"],
                is_valid=False,
                step_penalty=self._state["config"]["step_penalty"]
            )
            self._state["total_reward"] += reward
            return {
                "observation": {"balances": copy.deepcopy(self._state["balances"])},
                "reward": reward,
                "done": self._state["done"],
                "info": {"steps_taken": self._state["steps_taken"], "reason": "invalid_move"}
            }
            
        old_balances = copy.deepcopy(self._state["balances"])
        self._state["steps_taken"] += 1
        steps = self._state["steps_taken"]
        
        fee_pct = self._state["config"]["fee_percent"]
        fee = round(amount * fee_pct, 2)
        
        # Apply transactions
        # If the environment wants all balances to hit exactly 0.00, deducting fee from payer's balance 
        # mathematically breaks zero-sum. We deduct it anyway to strictly follow instructions.
        self._state["balances"][payer] = round(self._state["balances"][payer] + amount - fee, 2)
        self._state["balances"][payee] = round(self._state["balances"][payee] - amount, 2)
        
        # Check done
        done = True
        for b in self._state["balances"].values():
            if abs(b) >= 0.001:
                done = False
                break
        self._state["done"] = done
        
        reward = compute_reward(
            action=action,
            old_balances=old_balances,
            new_balances=self._state["balances"],
            done=done,
            steps_taken=steps,
            max_steps=self._state["max_steps"],
            is_valid=True,
            step_penalty=self._state["config"]["step_penalty"]
        )
        
        self._state["total_reward"] += reward
        
        return {
            "observation": {"balances": copy.deepcopy(self._state["balances"])},
            "reward": reward,
            "done": done,
            "info": {"steps_taken": steps, "reason": "valid_move"}
        }

    def state(self) -> dict:
        return {
            "steps_taken": self._state.get("steps_taken", 0),
            "total_reward": round(self._state.get("total_reward", 0.0), 2),
            "task_level": self._state.get("task_level", 1),
            "done": self._state.get("done", False),
            "active_constraints": self._state.get("active_constraints", [])
        }
