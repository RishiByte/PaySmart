from typing import Dict

def compute_reward(
    action: dict,
    old_balances: Dict[str, float],
    new_balances: Dict[str, float],
    done: bool,
    steps_taken: int, # note: this is the step count BEFORE this valid step if we consider the step logic, or AFTER? "Full settlement in <= N-1 steps". Let's assume steps_taken is steps including the current one.
    max_steps: int,
    is_valid: bool,
    step_penalty: float = -0.05
) -> float:
    """Computes the reward based on the event rules."""
    
    if not is_valid:
        return -0.50
        
    reward = step_penalty
    
    payer = action["payer"]
    payee = action["payee"]
    
    # Check if payer hits 0.00
    if abs(old_balances[payer]) >= 0.001 and abs(new_balances[payer]) < 0.001:
        reward += 0.10
        
    # Check if payee hits 0.00
    if abs(old_balances[payee]) >= 0.001 and abs(new_balances[payee]) < 0.001:
        reward += 0.10
        
    if done:
        reward += 1.00 # ALL balances hit 0.00
        
        if steps_taken <= max_steps:
            reward += 1.00 # Bonus for full settlement in <= N-1 steps
            
    return round(reward, 2)
