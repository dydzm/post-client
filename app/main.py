from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import httpx
import time
import subprocess
import base64
import json

import logging
import ipaddress
from urllib.parse import urlparse

# KESE Hardening: Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

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

app = FastAPI(title="Hybrid API Tester Backend")

# KESE Hardening: Restricted CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Restrict to frontend origin
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

def is_safe_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return False
        
        # Block internal/private IP ranges (SSRF Protection)
        host = parsed.hostname
        if not host:
            return False
            
        try:
            ip = ipaddress.ip_address(host)
            return not (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast)
        except ValueError:
            # It's a hostname, not an IP. In a production environment, 
            # you should resolve it and check the IP.
            # For this MVP, we block 'localhost' and '.local' as a basic check.
            forbidden_hosts = ['localhost', '127.0.0.1', '::1', 'metadata.google.internal']
            if host.lower() in forbidden_hosts or host.endswith('.local'):
                return False
            return True
    except Exception:
        return False

@app.post("/execute")
async def execute_request(req: ApiRequest):
    start_time = time.time()
    
    # KESE Hardening: SSRF Check
    if not is_safe_url(req.url):
        logger.warning(f"Blocked unsafe request to: {req.url}")
        raise HTTPException(status_code=403, detail="Access to the requested URL is forbidden (SSRF Protection).")

    logger.info(f"Executing {req.method} request to {req.url}")
    
    try:
        # KESE Hardening: verify=True (Enable SSL Verification)
        async with httpx.AsyncClient(timeout=30.0, verify=True) as client:
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
                    try:
                        b64_data = f.content.split(",")[-1] if "," in f.content else f.content
                        file_content = base64.b64decode(b64_data)
                        files_payload[f.key] = (f.name, file_content, f.type)
                    except Exception as e:
                        logger.error(f"File decode error: {str(e)}")
                        continue
                
                kwargs["files"] = files_payload
                kwargs["data"] = data_payload
            else:
                kwargs["content"] = req.body

            response = await client.request(**kwargs)
            elapsed_time = time.time() - start_time
            
            logger.info(f"Response: {response.status_code} in {round(elapsed_time * 1000)}ms")
            
            return {
                "status": response.status_code,
                "headers": dict(response.headers),
                "body": response.text,
                "time_ms": round(elapsed_time * 1000)
            }
    except httpx.RequestError as exc:
        logger.error(f"Request error: {str(exc)}")
        raise HTTPException(status_code=400, detail=f"Request error: {str(exc)}")
    except Exception as exc:
        logger.error(f"Internal error: {str(exc)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(exc)}")

@app.get("/logo")
async def get_logo():
    try:
        # KESE Hardening: shell=False (Prevent Command Injection)
        result = subprocess.run(
            ['npx', 'oh-my-logo', 'POST CLIENT', 'sunset', '--filled', '--reverse-gradient'],
            capture_output=True, text=True, check=True, shell=False, encoding='utf-8', errors='ignore'
        )
        return {"logo": result.stdout}
    except Exception as e:
        logger.error(f"Logo generation error: {str(e)}")
        return {"logo": "POST CLIENT\n(Cool ASCII logo load failed - check logs)"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
