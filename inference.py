# inference.py — Sample agent runner
# Prints structured logs with [START], [STEP], [END] tags (REQUIRED by judges)

import requests
import json

BASE_URL = "http://localhost:8000"

def run_agent(task_level=1):
    print(f"[START] Initializing DebtSplit environment for Task Level {task_level}")
    try:
        obs = requests.post(f"{BASE_URL}/env/reset", json={"task_level": task_level}).json()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the backend API. Make sure FastAPI is running on port 8000.")
        return
        
    print(f"[START] Initial state: {json.dumps(obs, indent=2)}")

    total_reward = 0
    step = 0

    while not obs.get("done", False):
        # Greedy agent: always pay the largest outstanding debt first
        action = pick_greedy_action(obs)
        if not action:
            print("[INFO] No more actions to take, exiting.")
            break
            
        result = requests.post(f"{BASE_URL}/env/step", json=action).json()
        
        step_reward = result.get("reward", 0.0)
        done = result.get("done", False)
        
        total_reward += step_reward
        step += 1
        print(f"[STEP {step}] Action: {action} | Reward: {step_reward:.2f} | Done: {done}")
        obs = result
        
        # Guard against infinite loops if the agent fails to converge under fees
        if step > 50:
            print("[END] Reached 50 steps, stopping early.")
            break

    print(f"[END] Settled in {step} steps | Total Reward: {total_reward:.2f}")

def pick_greedy_action(obs):
    # Depending if the response is direct state or an observation block
    balances = obs.get("observation", {}).get("balances", obs.get("balances", {}))
    debtors = {u: b for u, b in balances.items() if b < -0.001}
    creditors = {u: b for u, b in balances.items() if b > 0.001}
    
    if not debtors or not creditors:
        return None
        
    payer = min(debtors, key=debtors.get)
    payee = max(creditors, key=creditors.get)
    amount = min(abs(debtors[payer]), creditors[payee])
    
    return {"payer": payer, "payee": payee, "amount": round(amount, 2)}

if __name__ == "__main__":
    task_level = 1
    # You can change task_level to 2 or 3 here
    run_agent(task_level=task_level)
