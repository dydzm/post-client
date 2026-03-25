from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import httpx
import time
import subprocess
import base64
import json

app = FastAPI(title="Hybrid API Tester Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FileData(BaseModel):
    key: str
    name: str
    content: str  # Base64 encoded content
    type: str

class ApiRequest(BaseModel):
    method: str
    url: str
    headers: Optional[Dict[str, str]] = {}
    query: Optional[Dict[str, str]] = {}
    body: Optional[Any] = None
    bodyType: Optional[str] = "json"
    files: Optional[List[FileData]] = []

@app.post("/execute")
async def execute_request(req: ApiRequest):
    start_time = time.time()
    try:
        async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
            headers = req.headers or {}
            params = req.query or {}
            
            kwargs = {
                "method": req.method,
                "url": req.url,
                "headers": headers,
                "params": params,
            }

            if req.bodyType == "json":
                if isinstance(req.body, dict):
                    kwargs["json"] = req.body
                elif isinstance(req.body, str) and req.body.strip():
                    try:
                        kwargs["json"] = json.loads(req.body)
                    except:
                        kwargs["content"] = req.body
                else:
                    kwargs["content"] = req.body
            elif req.bodyType == "multipart":
                files_payload = {}
                data_payload = {}
                if isinstance(req.body, str) and req.body.strip():
                    try:
                        data_payload = json.loads(req.body)
                    except:
                        pass
                
                for f in req.files:
                    # Decode base64 content
                    try:
                        b64_data = f.content.split(",")[-1] if "," in f.content else f.content
                        file_content = base64.b64decode(b64_data)
                        files_payload[f.key] = (f.name, file_content, f.type)
                    except:
                        continue
                
                kwargs["files"] = files_payload
                kwargs["data"] = data_payload
            else:
                kwargs["content"] = req.body

            response = await client.request(**kwargs)
            elapsed_time = time.time() - start_time
            
            return {
                "status": response.status_code,
                "headers": dict(response.headers),
                "body": response.text,
                "time_ms": round(elapsed_time * 1000)
            }
    except httpx.RequestError as exc:
        raise HTTPException(status_code=400, detail=f"Request error: {str(exc)}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(exc)}")

@app.get("/logo")
async def get_logo():
    try:
        result = subprocess.run(
            ['npx', 'oh-my-logo', 'POST CLIENT', 'sunset', '--filled', '--reverse-gradient'],
            capture_output=True, text=True, check=True, shell=True, encoding='utf-8', errors='ignore'
        )
        return {"logo": result.stdout}
    except Exception:
        return {"logo": "POST CLIENT\n(Cool ASCII logo load failed - try installing oh-my-logo)"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
