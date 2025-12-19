"""
CYBERCAT Security Agent - FastAPI Server
Provides REST API endpoints for the LangGraph security agent
"""

import os
import json
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import uvicorn

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import agent (will be initialized on startup)
agent = None


# ============================================================================
# Pydantic Models
# ============================================================================

class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., description="The user's message")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    response: str
    session_id: str
    timestamp: str
    tools_used: List[str] = []


class ScanRequest(BaseModel):
    """Request model for port scan"""
    host: str = Field(default="localhost", description="Target host")
    port_range: str = Field(default="1-1024", description="Port range to scan")


class URLAnalysisRequest(BaseModel):
    """Request model for URL analysis"""
    url: str = Field(..., description="URL to analyze")


class IPReputationRequest(BaseModel):
    """Request model for IP reputation check"""
    ip_address: str = Field(..., description="IP address to check")


class SecurityReport(BaseModel):
    """Security report model"""
    report_id: str
    timestamp: str
    summary: Dict[str, Any]
    system_analysis: Dict[str, Any]
    network_analysis: Dict[str, Any]
    recommendations: List[str]


# ============================================================================
# Session Management
# ============================================================================

class SessionManager:
    """Manage conversation sessions"""
    
    def __init__(self):
        self.sessions: Dict[str, List[Dict]] = {}
    
    def create_session(self) -> str:
        """Create a new session"""
        import uuid
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = []
        return session_id
    
    def get_session(self, session_id: str) -> List[Dict]:
        """Get session history"""
        return self.sessions.get(session_id, [])
    
    def add_message(self, session_id: str, role: str, content: str):
        """Add message to session"""
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        self.sessions[session_id].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
    
    def clear_session(self, session_id: str):
        """Clear session history"""
        if session_id in self.sessions:
            self.sessions[session_id] = []


session_manager = SessionManager()


# ============================================================================
# FastAPI Application
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global agent
    
    # Startup
    print("🚀 Starting CYBERCAT Security Agent Server...")
    
    # Check for API keys
    has_openai = bool(os.getenv("OPENAI_API_KEY"))
    has_anthropic = bool(os.getenv("ANTHROPIC_API_KEY"))
    
    if not has_openai and not has_anthropic:
        print("⚠️  Warning: No LLM API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY")
        print("   The agent will run in limited mode (tools only)")
    else:
        try:
            from agent import create_agent
            agent = create_agent()
            print("✅ LangGraph agent initialized successfully")
        except Exception as e:
            print(f"⚠️  Could not initialize agent: {e}")
    
    print("✅ Server ready!")
    print(f"📡 API Documentation: http://localhost:{os.getenv('PORT', 8000)}/docs")
    
    yield
    
    # Shutdown
    print("👋 Shutting down server...")


app = FastAPI(
    title="CYBERCAT Security Agent",
    description="AI-powered cybersecurity analysis API using LangGraph",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "CYBERCAT Security Agent",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "chat": "/api/chat",
            "scan": "/api/scan",
            "analyze_url": "/api/analyze/url",
            "check_ip": "/api/check/ip",
            "system_security": "/api/system/security",
            "network_info": "/api/network/info",
            "report": "/api/report"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "agent_ready": agent is not None
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with the security agent.
    Send a message and receive an AI-powered security analysis response.
    """
    session_id = request.session_id or session_manager.create_session()
    
    # Add user message to session
    session_manager.add_message(session_id, "user", request.message)
    
    tools_used = []
    
    if agent:
        try:
            from langchain_core.messages import HumanMessage, AIMessage
            
            # Build messages from session history
            messages = []
            for msg in session_manager.get_session(session_id):
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))
            
            # Run agent
            initial_state = {
                "messages": messages,
                "current_task": request.message,
                "scan_results": {},
                "threats_detected": [],
                "recommendations": [],
                "system_info": {}
            }
            
            result = agent.invoke(initial_state)
            
            # Extract response and tools used
            response_text = ""
            for message in reversed(result["messages"]):
                if isinstance(message, AIMessage):
                    response_text = message.content
                    if hasattr(message, 'tool_calls') and message.tool_calls:
                        tools_used = [tc["name"] for tc in message.tool_calls]
                    break
            
            if not response_text:
                response_text = "I apologize, but I couldn't generate a response. Please try again."
            
        except Exception as e:
            response_text = f"Error processing request: {str(e)}"
    else:
        # Limited mode - direct tool execution
        response_text = await execute_tools_directly(request.message)
    
    # Add assistant response to session
    session_manager.add_message(session_id, "assistant", response_text)
    
    return ChatResponse(
        response=response_text,
        session_id=session_id,
        timestamp=datetime.now().isoformat(),
        tools_used=tools_used
    )


async def execute_tools_directly(message: str) -> str:
    """Execute tools directly without LLM (limited mode)"""
    from agent import (
        scan_open_ports, analyze_system_security, check_ip_reputation,
        analyze_url, get_network_info, generate_security_report
    )
    
    message_lower = message.lower()
    
    if "scan" in message_lower and "port" in message_lower:
        return scan_open_ports.invoke({"host": "localhost", "port_range": "1-1024"})
    elif "system" in message_lower or "security" in message_lower:
        return analyze_system_security.invoke({})
    elif "network" in message_lower:
        return get_network_info.invoke({})
    elif "report" in message_lower:
        return generate_security_report.invoke({})
    else:
        return json.dumps({
            "message": "Limited mode active. Available commands: scan ports, system security, network info, generate report",
            "note": "Set OPENAI_API_KEY or ANTHROPIC_API_KEY for full AI capabilities"
        })


@app.post("/api/scan")
async def port_scan(request: ScanRequest):
    """
    Scan for open ports on a target host.
    """
    from agent import scan_open_ports
    
    try:
        result = scan_open_ports.invoke({
            "host": request.host,
            "port_range": request.port_range
        })
        return json.loads(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze/url")
async def analyze_url_endpoint(request: URLAnalysisRequest):
    """
    Analyze a URL for potential security threats.
    """
    from agent import analyze_url
    
    try:
        result = analyze_url.invoke({"url": request.url})
        return json.loads(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/check/ip")
async def check_ip_endpoint(request: IPReputationRequest):
    """
    Check the reputation of an IP address.
    """
    from agent import check_ip_reputation
    
    try:
        result = check_ip_reputation.invoke({"ip_address": request.ip_address})
        return json.loads(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/system/security")
async def system_security():
    """
    Analyze the current system's security posture.
    """
    from agent import analyze_system_security
    
    try:
        result = analyze_system_security.invoke({})
        return json.loads(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/network/info")
async def network_info():
    """
    Get detailed network interface information.
    """
    from agent import get_network_info
    
    try:
        result = get_network_info.invoke({})
        return json.loads(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report", response_model=SecurityReport)
async def generate_report():
    """
    Generate a comprehensive security report.
    """
    from agent import generate_security_report
    
    try:
        result = generate_security_report.invoke({})
        return json.loads(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/session/{session_id}")
async def clear_session(session_id: str):
    """
    Clear a conversation session.
    """
    session_manager.clear_session(session_id)
    return {"message": f"Session {session_id} cleared"}


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║           CYBERCAT Security Agent - API Server               ║
╠══════════════════════════════════════════════════════════════╣
║  Starting server on http://{host}:{port}                      
║  API Documentation: http://{host}:{port}/docs                 
║  Health Check: http://{host}:{port}/health                    
╚══════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
