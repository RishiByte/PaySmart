import sys
import os

# Ensure backend module can be resolved 
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from backend.api.routes import router

app = FastAPI(
    title="DebtSplit OpenEnv API",
    description="FastAPI backend for DebtSplit RL environment",
    version="1.0.0"
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
