import gradio as gr
import httpx
import json

BASE_URL = "http://127.0.0.1:8000"

def reset_env(task_level):
    try:
        res = httpx.post(f"{BASE_URL}/env/reset", json={"task_level": int(task_level)}, timeout=10.0)
        res.raise_for_status()
        obs = res.json()
        
        balances = obs.get("balances", {})
        balances_list = [[k, f"₹{v:.2f}"] for k, v in balances.items()]
        
        users = obs.get("users", [])
        
        return (
            balances_list,              # initial balances table
            gr.update(choices=users),   # payer dropdown
            gr.update(choices=users),   # payee dropdown
            f"Steps: 0 | Total Reward: 0.00",
            "",                         # settled banner
            obs                         # state store
        )
    except Exception as e:
        return ([], gr.update(), gr.update(), f"Error: {e}", "", {})

def make_payment(payer, payee, amount, current_state):
    try:
        payload = {"payer": payer, "payee": payee, "amount": float(amount)}
        res = httpx.post(f"{BASE_URL}/env/step", json=payload, timeout=10.0)
        
        if res.status_code == 422:
            detail = res.json().get("detail", "Invalid input")
            return gr.update(), f"Error 422: {detail}", "", current_state
            
        res.raise_for_status()
        result = res.json()
        
        # update current_state
        balances = result.get("observation", {}).get("balances", {})
        balances_list = [[k, f"₹{v:.2f}"] for k, v in balances.items()]
        
        # get state to show metrics
        state_res = httpx.get(f"{BASE_URL}/env/state", timeout=10.0)
        state_data = state_res.json() if state_res.status_code == 200 else {}
        
        steps = state_data.get("steps_taken", 0)
        total_reward = state_data.get("total_reward", result.get("reward", 0))
        done = state_data.get("done", False)
        
        stats_str = f"Steps: {steps} | Total Reward: {total_reward:.2f} | Last Step Reward: {result.get('reward', 0):.2f}"
        if result.get("info", {}).get("reason") == "invalid_move":
            stats_str += " (INVALID MOVE)"
            
        banner = "SETTLED ✓" if done else ""
        
        return balances_list, stats_str, banner, state_data
            
    except Exception as e:
        return gr.update(), f"Error: {e}", "", current_state


def run_auto_agent(task_level):
    logs = []
    try:
        logs.append(f"[START] Initializing DebtSplit environment for Task Level {task_level}")
        res = httpx.post(f"{BASE_URL}/env/reset", json={"task_level": int(task_level)}, timeout=10.0)
        res.raise_for_status()
        obs = res.json()
        
        logs.append(f"[START] Initial state: {json.dumps(obs)}")
        
        total_reward = 0
        step = 0
        
        while not obs.get("done", False):
            balances = obs.get("observation", {}).get("balances", obs.get("balances", {}))
            debtors = {u: b for u, b in balances.items() if b < -0.001}
            creditors = {u: b for u, b in balances.items() if b > 0.001}
            
            if not debtors or not creditors:
                logs.append("[INFO] No more actions to take, exiting.")
                break
                
            payer = min(debtors, key=debtors.get)
            payee = max(creditors, key=creditors.get)
            amount = min(abs(debtors[payer]), creditors[payee])
            
            action = {"payer": payer, "payee": payee, "amount": round(amount, 2)}
            
            step_res = httpx.post(f"{BASE_URL}/env/step", json=action, timeout=10.0)
            step_res.raise_for_status()
            result = step_res.json()
            
            step_reward = result.get("reward", 0.0)
            done = result.get("done", False)
            
            total_reward += step_reward
            step += 1
            logs.append(f"[STEP {step}] Action: {action} | Reward: {step_reward:.2f} | Done: {done}")
            obs = result
            
            if step > 50:
                logs.append("[END] Reached 50 steps, stopping early.")
                break
                
        logs.append(f"[END] Settled in {step} steps | Total Reward: {total_reward:.2f}")
        
    except Exception as e:
        logs.append(f"[ERROR] {str(e)}")
        
    return "\n".join(logs)

with gr.Blocks(title="DebtSplit Optimizer Console", theme=gr.themes.Monochrome()) as demo:
    gr.Markdown("# DebtSplit OpenEnv RL Interface")
    
    current_state = gr.State({})
    
    with gr.Tabs():
        with gr.Tab("Manual Play"):
            with gr.Row():
                with gr.Column(scale=1):
                    task_level = gr.Dropdown(choices=[1, 2, 3], value=1, label="Task Level")
                    reset_btn = gr.Button("Reset Environment", variant="primary")
                    
                    gr.Markdown("### Make a Payment")
                    payer_drop = gr.Dropdown(choices=[], label="Payer")
                    payee_drop = gr.Dropdown(choices=[], label="Payee")
                    amount_inp = gr.Number(value=0, label="Amount")
                    pay_btn = gr.Button("Make Payment")
                    
                with gr.Column(scale=2):
                    settled_banner = gr.Markdown("### ")
                    stats_text = gr.Textbox(label="Running Reward & Steps", interactive=False)
                    balances_table = gr.Dataframe(headers=["User", "Balance"], label="Current Balances")
                    
            reset_btn.click(
                fn=reset_env,
                inputs=[task_level],
                outputs=[balances_table, payer_drop, payee_drop, stats_text, settled_banner, current_state]
            )
            pay_btn.click(
                fn=make_payment,
                inputs=[payer_drop, payee_drop, amount_inp, current_state],
                outputs=[balances_table, stats_text, settled_banner, current_state]
            )
            
        with gr.Tab("Auto Agent Run"):
            auto_task_level = gr.Dropdown(choices=[1, 2, 3], value=1, label="Task Level")
            run_btn = gr.Button("Run Greedy Agent", variant="primary")
            log_output = gr.Textbox(label="Agent Execution Logs", lines=20, interactive=False)
            
            run_btn.click(
                fn=run_auto_agent,
                inputs=[auto_task_level],
                outputs=[log_output]
            )

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
