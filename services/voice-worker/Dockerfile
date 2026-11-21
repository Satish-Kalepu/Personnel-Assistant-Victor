FROM python:3.14-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 VOICE_WORKER_BIND=0.0.0.0
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir --only-binary=:all: -r requirements.txt
COPY --chown=65532:65532 worker.py vad.py model-manifest.json ./
COPY --chown=65532:65532 .models/silero_vad.onnx ./.models/silero_vad.onnx
USER 65532:65532
EXPOSE 4320
HEALTHCHECK --interval=15s --timeout=4s --start-period=20s CMD python -c "from urllib.request import urlopen; urlopen('http://127.0.0.1:4320/health', timeout=3)"
CMD ["python", "worker.py"]
