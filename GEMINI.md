## Overview

This project is a hybrid API testing tool that combines a **GUI-based request builder** with a **CLI-style terminal interface**.

Unlike traditional tools, it allows users to:

* Build API requests visually (GUI)
* Execute and edit requests via terminal commands (CLI)
* Seamlessly sync between both interfaces in real-time

---

## Goals

* Provide a fast and intuitive API testing experience
* Combine the flexibility of CLI with the usability of GUI
* Eliminate friction caused by context switching
* Enable power users to work entirely via keyboard

---

## Key Features

### 1. Hybrid Interface

* GUI Request Builder
* CLI Terminal (command-based execution)
* Real-time sync between GUI and CLI

### 2. API Request Execution

* Supports HTTP methods: GET, POST, PUT, DELETE, PATCH
* Headers, Query Params, Body support
* JSON / form-data / raw body support

### 3. Response Viewer

* Status code
* Headers
* Pretty-printed response body (JSON/XML)
* Response time

### 4. Command Line Interface

* Custom DSL support
* curl import support
* Command history navigation (↑ ↓)

### 5. Request Management

* Save requests
* Collections / folders
* Environment variables

---

## Architecture

```
Frontend (Vue3)
    ↓
Backend (FastAPI)
    ↓
External APIs
```

---

## Tech Stack

### Frontend

* Vue 3 (Composition API)
* Pinia (state management)
* Monaco Editor (JSON editor)
* xterm.js (terminal UI)

### Backend

* FastAPI
* httpx (async HTTP client)

### Database (optional)

* PostgreSQL or MongoDB

---

## Core Concept: Request Model

All interactions are based on a unified request model.

```ts
interface ApiRequest {
  method: string
  url: string
  headers: Record<string, string>
  query: Record<string, string>
  body: any
}
```

This model is shared between:

* GUI
* CLI parser
* Backend execution

---

## CLI Design

### Basic Example

```
GET https://api.example.com/users
```

### Advanced Example

```
POST https://api.example.com/users
Authorization: Bearer xxx
Content-Type: application/json

{
  "name": "jeff"
}
```

---

## GUI ↔ CLI Synchronization

### GUI → CLI

* Changes in GUI automatically generate CLI command

### CLI → GUI

* CLI input is parsed into structured request model

### Key Requirement

* Must avoid infinite update loops
* Use controlled watchers / diff-based updates

---

## Backend Design

### API Execution Endpoint

```python
@app.post("/execute")
async def execute(req: dict):
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.request(
            method=req["method"],
            url=req["url"],
            headers=req.get("headers"),
            content=req.get("body")
        )

    return {
        "status": response.status_code,
        "headers": dict(response.headers),
        "body": response.text
    }
```

---

## Security Considerations

### 1. CORS

* Must be handled in backend

### 2. SSRF Protection

* Block internal IP ranges
* Restrict localhost access

### 3. Sensitive Data

* Do not store tokens in plain text
* Encrypt stored credentials if persistence is enabled

---

## MVP Scope

### Phase 1

* GUI request builder
* API execution via FastAPI
* Response viewer

### Phase 2

* CLI input support
* Basic parser

### Phase 3

* GUI ↔ CLI synchronization

### Phase 4

* History and collections

---

## Future Enhancements

* Automated test scripts
* Pre-request scripts
* API mocking
* Team collaboration
* OpenAPI import/export

---

## Differentiation

This project is not just another API client.

Core differentiation:

* Terminal-first experience inside the browser
* Real-time bidirectional sync between CLI and GUI
* Developer-focused workflow optimization

---

## Summary

This tool aims to redefine API testing by merging:

* The **speed of CLI**
* The **clarity of GUI**

into a single unified experience.