FROM python:3.10-slim

WORKDIR /app

ENV HF_HOME=/app/hf_cache

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Pre-download and cache T5-small model and tokenizer
RUN python -c "from transformers import T5ForConditionalGeneration, T5Tokenizer; T5Tokenizer.from_pretrained('t5-small'); T5ForConditionalGeneration.from_pretrained('t5-small')"


COPY . .

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
