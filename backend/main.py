import json
import time
import asyncio
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
from nlp_parser import NLPParser
from pom_generator import POMGenerator
from openai import OpenAI

app = FastAPI(title="AI Test Generator API", version="1.0.0")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

parser = NLPParser()
generator = POMGenerator()

class GenerationRequest(BaseModel):
    story: str
    criteria: str
    apiKey: Optional[str] = None
    featureName: Optional[str] = "User Login"

class TrainingRequest(BaseModel):
    datasetSize: int = 150
    epochs: int = 5
    batchSize: int = 16
    learningRate: float = 0.001

def call_openai_for_gherkin_and_playwright(api_key: str, story: str, criteria: str, feature_name: str) -> Dict[str, Any]:
    """Helper to query OpenAI for high-fidelity BDD and Playwright POM generation."""
    client = OpenAI(api_key=api_key)
    
    prompt = f"""
    You are an expert software test automation engineer.
    Based on the following Agile User Story and Acceptance Criteria, generate:
    1. A clean BDD-style Gherkin feature file.
    2. A Playwright Page Object Model (POM) class in TypeScript.
    3. A Playwright test spec in TypeScript that uses the POM class.
    
    User Story:
    {story}
    
    Acceptance Criteria:
    {criteria}
    
    Feature Name: {feature_name}
    
    Respond strictly in JSON format with the following keys:
    "gherkin": "gherkin string content",
    "page_filename": "NameOfPage.ts",
    "page_code": "TypeScript page class code",
    "spec_filename": "name.spec.ts",
    "spec_code": "TypeScript spec code"
    
    Do not wrap the JSON output in markdown block indicators, return raw JSON string.
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini", # Use cost-efficient stable model
        messages=[
            {"role": "system", "content": "You are a helpful QA Automation Assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        response_format={ "type": "json_object" }
    )
    
    data = json.loads(response.choices[0].message.content)
    return data

@app.post("/api/generate-all")
async def generate_all(req: GenerationRequest):
    if not req.story.strip() or not req.criteria.strip():
        raise HTTPException(status_code=400, detail="User story and acceptance criteria cannot be empty.")
    
    feature_name = req.featureName or "User Login"
    
    # Check if OpenAI API key is supplied
    if req.apiKey and req.apiKey.strip().startswith("sk-"):
        try:
            openai_result = call_openai_for_gherkin_and_playwright(
                api_key=req.apiKey.strip(),
                story=req.story,
                criteria=req.criteria,
                feature_name=feature_name
            )
            # Run parser pipeline just to get structured analytics data
            pipeline_data = parser.get_pipeline_data(req.story, req.criteria)
            
            return {
                "success": True,
                "mode": "OpenAI GPT-4",
                "gherkin": openai_result["gherkin"],
                "page_filename": openai_result["page_filename"],
                "page_code": openai_result["page_code"],
                "spec_filename": openai_result["spec_filename"],
                "spec_code": openai_result["spec_code"],
                "pipeline_table": pipeline_data["pipeline_table"],
                "steps": pipeline_data["steps"]
            }
        except Exception as e:
            # Fallback to local heuristic engine on error
            print(f"OpenAI error, falling back: {str(e)}")
            local_pipeline = parser.get_pipeline_data(req.story, req.criteria)
            local_pom = generator.generate_pom(feature_name, local_pipeline["steps"])
            
            return {
                "success": True,
                "mode": f"Local NLP Parser (Fallback due to OpenAI error: {str(e)})",
                "gherkin": local_pipeline["gherkin"],
                "page_filename": local_pom["page_filename"],
                "page_code": local_pom["page_code"],
                "spec_filename": local_pom["spec_filename"],
                "spec_code": local_pom["spec_code"],
                "pipeline_table": local_pipeline["pipeline_table"],
                "steps": local_pipeline["steps"]
            }
    else:
        # Standard Offline Heuristic Generation
        local_pipeline = parser.get_pipeline_data(req.story, req.criteria)
        local_pom = generator.generate_pom(feature_name, local_pipeline["steps"])
        
        return {
            "success": True,
            "mode": "Local Rule-based NLP Engine",
            "gherkin": local_pipeline["gherkin"],
            "page_filename": local_pom["page_filename"],
            "page_code": local_pom["page_code"],
            "spec_filename": local_pom["spec_filename"],
            "spec_code": local_pom["spec_code"],
            "pipeline_table": local_pipeline["pipeline_table"],
            "steps": local_pipeline["steps"]
        }

@app.post("/api/preprocess")
async def preprocess(req: GenerationRequest):
    if not req.story.strip() or not req.criteria.strip():
        raise HTTPException(status_code=400, detail="Data cannot be empty.")
    
    pipeline_data = parser.get_pipeline_data(req.story, req.criteria)
    return {
        "success": True,
        "pipeline_table": pipeline_data["pipeline_table"],
        "steps": pipeline_data["steps"]
    }

@app.get("/api/train-model-stream")
async def train_model_stream(epochs: int = 5, dataset_size: int = 150):
    """
    Streams model fine-tuning outputs via Server-Sent Events (SSE).
    Simulates training a T5 transformer model on user stories and Gherkin structures.
    """
    async def event_generator():
        yield f"data: {json.dumps({'message': 'Initializing training datasets...', 'progress': 5})}\n\n"
        await asyncio.sleep(1.0)
        
        yield f"data: {json.dumps({'message': 'Preprocessing dataset using Pandas & Scikit-learn tokenizers...', 'progress': 15})}\n\n"
        await asyncio.sleep(1.2)
        
        yield f"data: {json.dumps({'message': 'Tokenization complete. Splitting train/val sets (80/20)...', 'progress': 25})}\n\n"
        await asyncio.sleep(0.8)

        # Simulate epochs
        for epoch in range(1, epochs + 1):
            # Calculate mock loss and accuracies
            # loss drops, accuracy rises
            train_loss = 0.95 * (0.45 ** (epoch - 1)) + 0.03 + (0.01 * epoch)
            val_loss = train_loss * 1.1 + 0.02
            train_acc = 0.65 + (0.32 * (epoch / epochs)) - (0.02 / epoch)
            val_acc = train_acc * 0.96
            
            # Clamp values
            train_loss = max(0.01, train_loss)
            val_loss = max(0.02, val_loss)
            train_acc = min(0.99, train_acc)
            val_acc = min(0.98, val_acc)
            
            progress = 25 + int((epoch / epochs) * 70)
            
            payload = {
                "epoch": epoch,
                "train_loss": round(float(train_loss), 4),
                "val_loss": round(float(val_loss), 4),
                "train_acc": round(float(train_acc * 100), 2),
                "val_acc": round(float(val_acc * 100), 2),
                "message": f"Epoch {epoch}/{epochs} completed.",
                "progress": progress
            }
            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(1.5)
            
        yield f"data: {json.dumps({'message': 'Fine-tuning completed. Saving T5 model weights...', 'progress': 100})}\n\n"
        
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/run-test-stream")
async def run_test_stream():
    """
    Streams parallel test execution outputs via Server-Sent Events (SSE).
    Simulates chromium, firefox, and webkit worker logs.
    """
    async def log_generator():
        # Setup simulated logs
        logs = [
            {"worker": "system", "msg": "Parsing configuration files..."},
            {"worker": "system", "msg": "Starting 3 workers in parallel..."},
            {"worker": "chromium", "msg": "chromium › login.spec.ts:5:5 › Verify Login workflow successfully (started)"},
            {"worker": "firefox", "msg": "firefox  › login.spec.ts:5:5 › Verify Login workflow successfully (started)"},
            {"worker": "webkit", "msg": "webkit   › login.spec.ts:5:5 › Verify Login workflow successfully (started)"},
            {"worker": "chromium", "msg": "chromium › [Step 1] Navigating to https://example.com/login"},
            {"worker": "firefox", "msg": "firefox  › [Step 1] Navigating to https://example.com/login"},
            {"worker": "webkit", "msg": "webkit   › [Step 1] Navigating to https://example.com/login"},
            {"worker": "chromium", "msg": "chromium › [Step 2] Typing in username field"},
            {"worker": "webkit", "msg": "webkit   › [Step 2] Typing in username field"},
            {"worker": "firefox", "msg": "firefox  › [Step 2] Typing in username field"},
            {"worker": "chromium", "msg": "chromium › [Step 3] Typing in password field"},
            {"worker": "firefox", "msg": "firefox  › [Step 3] Typing in password field"},
            {"worker": "chromium", "msg": "chromium › [Step 4] Clicking login button"},
            {"worker": "webkit", "msg": "webkit   › [Step 3] Typing in password field"},
            {"worker": "firefox", "msg": "firefox  › [Step 4] Clicking login button"},
            {"worker": "webkit", "msg": "webkit   › [Step 4] Clicking login button"},
            {"worker": "chromium", "msg": "chromium › [Step 5] Asserting redirection to /dashboard"},
            {"worker": "chromium", "msg": "chromium › login.spec.ts:5:5 › Verify Login workflow successfully (Passed - 850ms)"},
            {"worker": "firefox", "msg": "firefox  › [Step 5] Asserting redirection to /dashboard"},
            {"worker": "webkit", "msg": "webkit   › [Step 5] Asserting redirection to /dashboard"},
            {"worker": "firefox", "msg": "firefox  › login.spec.ts:5:5 › Verify Login workflow successfully (Passed - 1.1s)"},
            {"worker": "webkit", "msg": "webkit   › login.spec.ts:5:5 › Verify Login workflow successfully (Passed - 1.3s)"},
            {"worker": "system", "msg": "All tests completed. Generating summary report..."},
            {"worker": "system", "msg": "3 passed (100% success rate)"},
        ]
        
        for item in logs:
            yield f"data: {json.dumps(item)}\n\n"
            # Random delay to simulate real-time parallel stream
            await asyncio.sleep(0.3 if item["worker"] != "system" else 0.8)
            
    return StreamingResponse(log_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
