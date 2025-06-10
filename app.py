
import gradio as gr
from core.config import AUDIO_DIR, CACHE_DIR
from core.utils import cleanup_old_audio_files
from services.project_service import load_existing_projects
from ui.interface import create_interface
from mcp.integration import (
    initialize_mcp_server, 
    get_mcp_status,
    add_chat_message_via_mcp,
    update_script_via_mcp,
    get_ai_context
)

def main():
    """Main entry point for Wolf AI application with enhanced MCP context"""
    print("🚀 Starting Wolf AI with Unified Context Management...")
    
    # Load existing projects and initialize samples on startup
    load_existing_projects()
    
    # Initialize MCP Server with Unified Context (Phase 2)
    mcp_server = initialize_mcp_server()
    
    # Clean up old files on startup
    cleanup_old_audio_files(AUDIO_DIR, CACHE_DIR)
    
    # Create and launch the interface
    app = create_interface()
    
    # Enhanced MCP status with unified context
    mcp_status = get_mcp_status()
    print("🔍 Enhanced MCP Status:")
    print(f"   📊 Context Summary: {mcp_status['context_summary']}")
    print(f"   🤖 AI Context Size: {mcp_status['ai_context_size']} chars")
    print(f"   📚 Resources: {len(mcp_status['resources'])}")
    print(f"   🛠️ Tools: {len(mcp_status['tools'])}")
    
    # Demo the unified context capabilities
    print("\n🧪 Testing Unified Context Integration:")
    
    # Simulate some context updates
    add_chat_message_via_mcp("system", "Wolf AI initialized with unified context management")
    update_script_via_mcp("Welcome to Wolf AI with enhanced context awareness!")
    
    # Show AI-optimized context
    ai_context = get_ai_context()
    print(f"   🎯 AI Context Ready: {len(ai_context['recent_conversation'])} messages, {len(ai_context['recent_activities'])} activities")
    
    app.launch(
        share=True,
        debug=True,
        server_name="0.0.0.0",
        server_port=7860,
        favicon_path=None,
        show_error=True
    )

if __name__ == "__main__":
    main()
