
"""
Integration layer between MCP and existing Wolf AI application
"""

from .server import mcp_server
from .context_manager import context_manager
from .agent import autonomous_agent
from .workflows import workflow_registry
from .resources.project_resource import ProjectResource
from .resources.tts_resource import TTSResource
from .resources.ai_resource import AIResource
from core.config import session_data

def initialize_mcp_server():
    """Initialize MCP server with unified context management and autonomous agent"""
    print("🔧 Initializing MCP Server with Unified Context and Autonomous Agent...")
    
    # Register resources with enhanced context
    mcp_server.register_resource(ProjectResource())
    mcp_server.register_resource(TTSResource())
    mcp_server.register_resource(AIResource())
    
    # Use unified context instead of basic context
    mcp_server.context = context_manager.mcp_context
    
    # Register sync callback for session data updates
    context_manager.register_sync_callback(lambda data: print(f"🔄 Session data synced: {len(data)} keys"))
    
    # Initialize autonomous agent
    print(f"🤖 Initializing Autonomous Agent with {len(workflow_registry.list_workflows())} workflows...")
    
    # Start the server
    mcp_server.start()
    
    # Initial context sync
    sync_session_context()
    
    print("✅ MCP Server initialized with Unified Context Manager and Autonomous Agent")
    print(f"   📋 Available workflows: {', '.join(workflow_registry.list_workflows())}")
    return mcp_server

def sync_session_context():
    """Sync session data with unified context manager"""
    # The context manager automatically syncs on initialization
    # Additional manual sync if needed
    context_manager._sync_from_session_data()
    
    print(f"📊 Context Summary: {context_manager.get_session_summary()}")

def get_mcp_status():
    """Get enhanced MCP server status with unified context and agent"""
    agent_status = autonomous_agent.get_status()
    
    return {
        "server_info": mcp_server.get_server_info(),
        "resources": mcp_server.list_resources(),
        "tools": mcp_server.list_tools(),
        "context_summary": context_manager.get_session_summary(),
        "unified_context": context_manager.mcp_context.get_context_summary(),
        "ai_context_size": len(str(context_manager.get_context_for_ai())),
        "agent_status": agent_status,
        "available_workflows": workflow_registry.list_workflows(),
        "workflow_info": workflow_registry.get_all_workflow_info()
    }

def update_project_via_mcp(project_name: str, project_data: dict):
    """Update project through unified context manager"""
    context_manager.update_project(project_name, project_data)
    
def add_chat_message_via_mcp(role: str, content: str, script_context: str = None):
    """Add chat message through unified context manager"""
    context_manager.add_chat_message(role, content, script_context)
    
def update_script_via_mcp(script_content: str):
    """Update script through unified context manager"""
    context_manager.update_script(script_content)

def get_ai_context():
    """Get context optimized for AI interactions"""
    return context_manager.get_context_for_ai()

# Autonomous Agent Functions
async def start_workflow(workflow_name: str, params: dict = None):
    """Start an autonomous workflow"""
    workflow = workflow_registry.get_workflow(workflow_name)
    if not workflow:
        return {"success": False, "error": f"Workflow '{workflow_name}' not found"}
        
    try:
        result = await autonomous_agent.execute_workflow(workflow, params)
        return {
            "success": result.success,
            "data": result.data,
            "error": result.error,
            "workflow": workflow_name
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_agent_status():
    """Get current autonomous agent status"""
    return autonomous_agent.get_status()

def get_workflow_list():
    """Get list of available workflows"""
    return workflow_registry.get_all_workflow_info()

def pause_agent():
    """Pause current agent execution"""
    return autonomous_agent.pause_execution()

def resume_agent():
    """Resume paused agent execution"""
    return autonomous_agent.resume_execution()

def stop_agent():
    """Stop current agent execution"""
    return autonomous_agent.stop_execution()

def set_agent_progress_callback(callback):
    """Set progress callback for agent updates"""
    autonomous_agent.set_progress_callback(callback)
