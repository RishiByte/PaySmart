from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

from backend.env.debt_env import DebtSplitEnv

router = APIRouter()

# Global environment instance
env = DebtSplitEnv()

class ResetRequest(BaseModel):
    task_level: int = Field(1, ge=1, le=3, description="Task difficulty level (1-3)")

class StepRequest(BaseModel):
    payer: str = Field(..., description="User ID of the payer")
    payee: str = Field(..., description="User ID of the payee")
    amount: float = Field(..., description="Amount to pay")

@router.post("/env/reset")
def env_reset(req: ResetRequest):
    try:
        obs = env.reset(task_level=req.task_level)
        return obs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/env/step")
def env_step(req: StepRequest):
    try:
        # Pydantic schema validation handles 422 automatically if missing fields or wrong types.
        if req.amount <= 0:
            raise HTTPException(status_code=422, detail="Amount must be positive")
            
        action = {"payer": req.payer, "payee": req.payee, "amount": req.amount}
        obs = env.step(action)
        return obs
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/env/state")
def env_state():
    try:
        return env.state()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/env/health")
def env_health():
    return {"status": "ok"}
