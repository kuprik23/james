"""
CYBERCAT Security Agent - LangGraph Implementation
A cybersecurity-focused AI agent using LangGraph for orchestration
"""

import os
import json
import asyncio
import socket
import subprocess
from typing import TypedDict, Annotated, Sequence, List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

import psutil
import requests

# Load environment variables
load_dotenv()

# ============================================================================
# State Definition
# ============================================================================

class AgentState(TypedDict):
    """State for the security agent"""
    messages: Annotated[Sequence[BaseMessage], "The messages in the conversation"]
    current_task: str
    scan_results: Dict[str, Any]
    threats_detected: List[Dict[str, Any]]
    recommendations: List[str]
    system_info: Dict[str, Any]


# ============================================================================
# Security Tools
# ============================================================================

@tool
def scan_open_ports(host: str = "localhost", port_range: str = "1-1024") -> str:
    """
    Scan for open ports on a target host.
    
    Args:
        host: Target hostname or IP address
        port_range: Port range to scan (e.g., "1-1024" or "80,443,8080")
    
    Returns:
        JSON string with scan results
    """
    open_ports = []
    
    # Parse port range
    if "-" in port_range:
        start, end = map(int, port_range.split("-"))
        ports = range(start, min(end + 1, 65536))
    else:
        ports = [int(p.strip()) for p in port_range.split(",")]
    
    # Limit scan to prevent abuse
    ports = list(ports)[:100]
    
    for port in ports:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            result = sock.connect_ex((host, port))
            if result == 0:
                service = get_service_name(port)
                open_ports.append({
                    "port": port,
                    "service": service,
                    "state": "open"
                })
            sock.close()
        except Exception as e:
            pass
    
    return json.dumps({
        "host": host,
        "ports_scanned": len(ports),
        "open_ports": open_ports,
        "timestamp": datetime.now().isoformat()
    })


def get_service_name(port: int) -> str:
    """Get common service name for a port"""
    services = {
        21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
        80: "HTTP", 110: "POP3", 135: "RPC", 139: "NetBIOS", 143: "IMAP",
        443: "HTTPS", 445: "SMB", 993: "IMAPS", 995: "POP3S", 1433: "MSSQL",
        1521: "Oracle", 3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",
        5900: "VNC", 8080: "HTTP-Proxy", 8443: "HTTPS-Alt"
    }
    return services.get(port, "Unknown")


@tool
def analyze_system_security() -> str:
    """
    Analyze the current system's security posture.
    
    Returns:
        JSON string with system security analysis
    """
    analysis = {
        "timestamp": datetime.now().isoformat(),
        "system": {},
        "processes": {},
        "network": {},
        "security_score": 0,
        "issues": []
    }
    
    # System info
    analysis["system"] = {
        "platform": os.name,
        "hostname": socket.gethostname(),
        "cpu_count": psutil.cpu_count(),
        "memory_total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
        "memory_used_percent": psutil.virtual_memory().percent,
        "disk_usage_percent": psutil.disk_usage('/').percent if os.name != 'nt' else psutil.disk_usage('C:\\').percent
    }
    
    # Process analysis
    suspicious_processes = []
    high_cpu_processes = []
    
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            info = proc.info
            if info['cpu_percent'] and info['cpu_percent'] > 50:
                high_cpu_processes.append({
                    "pid": info['pid'],
                    "name": info['name'],
                    "cpu_percent": info['cpu_percent']
                })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    
    analysis["processes"] = {
        "total": len(list(psutil.process_iter())),
        "high_cpu": high_cpu_processes[:5],
        "suspicious": suspicious_processes
    }
    
    # Network connections
    connections = []
    for conn in psutil.net_connections(kind='inet'):
        if conn.status == 'ESTABLISHED':
            connections.append({
                "local": f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else "N/A",
                "remote": f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else "N/A",
                "status": conn.status
            })
    
    analysis["network"] = {
        "active_connections": len(connections),
        "connections": connections[:10]
    }
    
    # Calculate security score
    score = 100
    
    if analysis["system"]["memory_used_percent"] > 90:
        score -= 10
        analysis["issues"].append("High memory usage detected")
    
    if analysis["system"]["disk_usage_percent"] > 90:
        score -= 10
        analysis["issues"].append("High disk usage detected")
    
    if len(high_cpu_processes) > 3:
        score -= 15
        analysis["issues"].append("Multiple high CPU processes detected")
    
    if len(connections) > 50:
        score -= 10
        analysis["issues"].append("High number of network connections")
    
    analysis["security_score"] = max(0, score)
    
    return json.dumps(analysis, indent=2)


@tool
def check_ip_reputation(ip_address: str) -> str:
    """
    Check the reputation of an IP address using public threat intelligence.
    
    Args:
        ip_address: The IP address to check
    
    Returns:
        JSON string with reputation data
    """
    result = {
        "ip": ip_address,
        "timestamp": datetime.now().isoformat(),
        "reputation": "unknown",
        "threat_level": "low",
        "details": {}
    }
    
    try:
        # Check if IP is private
        import ipaddress
        ip = ipaddress.ip_address(ip_address)
        
        if ip.is_private:
            result["reputation"] = "private"
            result["details"]["note"] = "This is a private IP address"
            return json.dumps(result)
        
        if ip.is_loopback:
            result["reputation"] = "loopback"
            result["details"]["note"] = "This is a loopback address"
            return json.dumps(result)
        
        # Try to get geolocation info
        try:
            geo_response = requests.get(f"http://ip-api.com/json/{ip_address}", timeout=5)
            if geo_response.status_code == 200:
                geo_data = geo_response.json()
                result["details"]["geolocation"] = {
                    "country": geo_data.get("country"),
                    "city": geo_data.get("city"),
                    "isp": geo_data.get("isp"),
                    "org": geo_data.get("org")
                }
        except:
            pass
        
        result["reputation"] = "public"
        result["threat_level"] = "unknown"
        
    except ValueError:
        result["error"] = "Invalid IP address format"
    
    return json.dumps(result, indent=2)


@tool
def analyze_url(url: str) -> str:
    """
    Analyze a URL for potential security threats.
    
    Args:
        url: The URL to analyze
    
    Returns:
        JSON string with URL analysis
    """
    result = {
        "url": url,
        "timestamp": datetime.now().isoformat(),
        "safe": True,
        "warnings": [],
        "details": {}
    }
    
    # Check for suspicious patterns
    suspicious_patterns = [
        ("http://", "Uses insecure HTTP protocol"),
        (".exe", "Links to executable file"),
        (".zip", "Links to archive file"),
        ("@", "Contains @ symbol (potential phishing)"),
        ("login", "Contains login keyword"),
        ("password", "Contains password keyword"),
        ("verify", "Contains verify keyword (potential phishing)"),
        ("account", "Contains account keyword"),
        ("secure", "Contains secure keyword (potential phishing)"),
    ]
    
    url_lower = url.lower()
    
    for pattern, warning in suspicious_patterns:
        if pattern in url_lower:
            result["warnings"].append(warning)
    
    # Check URL structure
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        
        result["details"]["scheme"] = parsed.scheme
        result["details"]["domain"] = parsed.netloc
        result["details"]["path"] = parsed.path
        
        # Check for IP-based URL
        try:
            import ipaddress
            ipaddress.ip_address(parsed.netloc.split(':')[0])
            result["warnings"].append("URL uses IP address instead of domain name")
        except ValueError:
            pass
        
        # Check for unusual port
        if ':' in parsed.netloc:
            port = parsed.netloc.split(':')[1]
            if port not in ['80', '443', '8080', '8443']:
                result["warnings"].append(f"Uses unusual port: {port}")
        
    except Exception as e:
        result["error"] = str(e)
    
    result["safe"] = len(result["warnings"]) == 0
    result["risk_level"] = "high" if len(result["warnings"]) > 3 else "medium" if len(result["warnings"]) > 0 else "low"
    
    return json.dumps(result, indent=2)


@tool
def get_network_info() -> str:
    """
    Get detailed network interface information.
    
    Returns:
        JSON string with network information
    """
    result = {
        "timestamp": datetime.now().isoformat(),
        "interfaces": [],
        "connections": {
            "total": 0,
            "established": 0,
            "listening": 0
        }
    }
    
    # Get network interfaces
    for iface, addrs in psutil.net_if_addrs().items():
        interface_info = {
            "name": iface,
            "addresses": []
        }
        for addr in addrs:
            interface_info["addresses"].append({
                "family": str(addr.family),
                "address": addr.address,
                "netmask": addr.netmask
            })
        result["interfaces"].append(interface_info)
    
    # Get connection stats
    connections = psutil.net_connections(kind='inet')
    result["connections"]["total"] = len(connections)
    result["connections"]["established"] = len([c for c in connections if c.status == 'ESTABLISHED'])
    result["connections"]["listening"] = len([c for c in connections if c.status == 'LISTEN'])
    
    return json.dumps(result, indent=2)


@tool
def generate_security_report() -> str:
    """
    Generate a comprehensive security report.
    
    Returns:
        JSON string with full security report
    """
    report = {
        "report_id": datetime.now().strftime("%Y%m%d_%H%M%S"),
        "timestamp": datetime.now().isoformat(),
        "summary": {},
        "system_analysis": {},
        "network_analysis": {},
        "recommendations": []
    }
    
    # System analysis
    system_result = json.loads(analyze_system_security.invoke({}))
    report["system_analysis"] = system_result
    
    # Network analysis
    network_result = json.loads(get_network_info.invoke({}))
    report["network_analysis"] = network_result
    
    # Generate recommendations
    recommendations = []
    
    if system_result.get("security_score", 100) < 80:
        recommendations.append("Review and address system security issues")
    
    if system_result.get("system", {}).get("memory_used_percent", 0) > 80:
        recommendations.append("Consider freeing up system memory")
    
    if network_result.get("connections", {}).get("established", 0) > 30:
        recommendations.append("Review active network connections for suspicious activity")
    
    recommendations.extend([
        "Keep all software and operating system updated",
        "Use strong, unique passwords for all accounts",
        "Enable two-factor authentication where available",
        "Regularly backup important data",
        "Use a reputable antivirus solution"
    ])
    
    report["recommendations"] = recommendations
    
    # Summary
    report["summary"] = {
        "security_score": system_result.get("security_score", 0),
        "issues_found": len(system_result.get("issues", [])),
        "active_connections": network_result.get("connections", {}).get("established", 0),
        "recommendation_count": len(recommendations)
    }
    
    return json.dumps(report, indent=2)


# ============================================================================
# Agent Graph Definition
# ============================================================================

# Available tools
tools = [
    scan_open_ports,
    analyze_system_security,
    check_ip_reputation,
    analyze_url,
    get_network_info,
    generate_security_report
]

# System prompt for the security agent
SYSTEM_PROMPT = """You are James, an AI-powered cybersecurity assistant. Your role is to help users with:

1. **Security Analysis**: Analyze systems, networks, and applications for vulnerabilities
2. **Threat Detection**: Identify potential security threats and suspicious activities
3. **Incident Response**: Guide users through security incidents
4. **Security Recommendations**: Provide actionable security advice

You have access to the following tools:
- scan_open_ports: Scan for open ports on a target
- analyze_system_security: Analyze the current system's security
- check_ip_reputation: Check if an IP address is malicious
- analyze_url: Analyze URLs for potential threats
- get_network_info: Get network interface information
- generate_security_report: Generate a comprehensive security report

Always be thorough in your analysis and provide clear, actionable recommendations.
When analyzing security issues, consider:
- The severity of the issue
- Potential impact
- Remediation steps
- Prevention measures

Be professional, accurate, and helpful. If you're unsure about something, say so.
"""


def create_agent():
    """Create the LangGraph security agent"""
    
    # Initialize LLM (try OpenAI first, fall back to Anthropic)
    llm = None
    
    if os.getenv("OPENAI_API_KEY"):
        llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0,
            api_key=os.getenv("OPENAI_API_KEY")
        )
    elif os.getenv("ANTHROPIC_API_KEY"):
        llm = ChatAnthropic(
            model="claude-3-opus-20240229",
            temperature=0,
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
    else:
        raise ValueError("No API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY")
    
    # Bind tools to LLM
    llm_with_tools = llm.bind_tools(tools)
    
    # Define the agent node
    def agent_node(state: AgentState) -> AgentState:
        """Process messages and decide on actions"""
        messages = state["messages"]
        
        # Add system message if not present
        if not any(isinstance(m, SystemMessage) for m in messages):
            messages = [SystemMessage(content=SYSTEM_PROMPT)] + list(messages)
        
        response = llm_with_tools.invoke(messages)
        
        return {
            **state,
            "messages": list(state["messages"]) + [response]
        }
    
    # Define the tool execution node
    def tool_node(state: AgentState) -> AgentState:
        """Execute tools based on agent decisions"""
        messages = state["messages"]
        last_message = messages[-1]
        
        if not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
            return state
        
        # Create a mapping of tool names to tool functions
        tool_map = {tool.name: tool for tool in tools}
        
        # Execute each tool call
        new_messages = list(messages)
        for tool_call in last_message.tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]
            
            # Find and execute the tool
            if tool_name in tool_map:
                try:
                    result = tool_map[tool_name].invoke(tool_args)
                    new_messages.append(
                        ToolMessage(
                            content=str(result),
                            tool_call_id=tool_call["id"]
                        )
                    )
                except Exception as e:
                    new_messages.append(
                        ToolMessage(
                            content=f"Error executing tool: {str(e)}",
                            tool_call_id=tool_call["id"]
                        )
                    )
        
        return {
            **state,
            "messages": new_messages
        }
    
    # Define routing logic
    def should_continue(state: AgentState) -> str:
        """Determine if we should continue or end"""
        messages = state["messages"]
        last_message = messages[-1]
        
        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
            return "tools"
        return "end"
    
    # Build the graph
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_node)
    
    # Set entry point
    workflow.set_entry_point("agent")
    
    # Add edges
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            "end": END
        }
    )
    workflow.add_edge("tools", "agent")
    
    # Compile the graph
    return workflow.compile()


# ============================================================================
# Main Entry Point
# ============================================================================

def run_agent(query: str) -> str:
    """Run the security agent with a query"""
    agent = create_agent()
    
    initial_state = {
        "messages": [HumanMessage(content=query)],
        "current_task": query,
        "scan_results": {},
        "threats_detected": [],
        "recommendations": [],
        "system_info": {}
    }
    
    result = agent.invoke(initial_state)
    
    # Get the last AI message
    for message in reversed(result["messages"]):
        if isinstance(message, AIMessage):
            return message.content
    
    return "No response generated"


if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("  CYBERCAT Security Agent - LangGraph")
    print("=" * 60)
    print()
    
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    else:
        query = "Generate a security report for this system"
    
    print(f"Query: {query}")
    print("-" * 60)
    
    try:
        response = run_agent(query)
        print(response)
    except Exception as e:
        print(f"Error: {e}")
        print("\nMake sure you have set OPENAI_API_KEY or ANTHROPIC_API_KEY")
