FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 7860
EXPOSE 8000

# Start both FastAPI (port 8000) and Gradio (port 7860)
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port 8000 & python gradio_app.py"]
