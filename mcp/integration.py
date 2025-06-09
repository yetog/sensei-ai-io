
"""
Integration layer between MCP and existing Wolf AI application
"""

from .server import mcp_server
from .resources.project_resource import ProjectResource
from .resources.tts_resource import TTSResource
from .resources.ai_resource import AIResource
from core.config import session_data

def initialize_mcp_server():
    """Initialize MCP server with existing service wrappers"""
    print("🔧 Initializing MCP Server...")
    
    # Register resources
    mcp_server.register_resource(ProjectResource())
    mcp_server.register_resource(TTSResource())
    mcp_server.register_resource(AIResource())
    
    # Start the server
    mcp_server.start()
    
    # Sync initial context with session data
    sync_session_context()
    
    print("✅ MCP Server initialized successfully")
    return mcp_server

def sync_session_context():
    """Sync session data with MCP context"""
    mcp_server.context.update_session_data({
        "projects": session_data.get("projects", {}),
        "current_project": session_data.get("current_project", ""),
        "settings": session_data.get("settings", {}),
        "api_keys": session_data.get("api_keys", {})
    })
    
    # Set current project in context
    current_project = session_data.get("current_project", "")
    if current_project:
        mcp_server.context.set_current_project(current_project)

def get_mcp_status():
    """Get MCP server status for debugging"""
    return {
        "server_info": mcp_server.get_server_info(),
        "resources": mcp_server.list_resources(),
        "tools": mcp_server.list_tools(),
        "context_summary": mcp_server.context.get_context_summary()
    }
