import gradio as gr
from flask import Flask, jsonify, request
from flask_cors import CORS
from core.config import AUDIO_DIR, CACHE_DIR
from core.utils import cleanup_old_audio_files
from services.project_service import load_existing_projects
from services.elevenlabs_voice_service import elevenlabs_service
from ui.interface import create_interface
from mcp.integration import (
    initialize_mcp_server, 
    get_mcp_status,
    add_chat_message_via_mcp,
    update_script_via_mcp,
    get_ai_context,
    get_agent_status,
    get_workflow_list,
    start_workflow
)

# Initialize Flask app for API endpoints
flask_app = Flask(__name__)
CORS(flask_app)

@flask_app.route('/api/voice/signed-url', methods=['GET'])
def get_voice_signed_url():
    """Get signed URL for ElevenLabs voice agent"""
    try:
        signed_url = elevenlabs_service.get_signed_url()
        return jsonify({'signedUrl': signed_url})
    except Exception as e:
        return jsonify({
            'error': 'Failed to initialize voice agent',
            'message': str(e)
        }), 500

@flask_app.route('/api/voice/agent-id', methods=['GET'])
def get_voice_agent_id():
    """Get agent ID"""
    try:
        agent_id = elevenlabs_service.get_agent_id()
        return jsonify({'agentId': agent_id})
    except Exception as e:
        return jsonify({
            'error': 'Failed to get agent ID',
            'message': str(e)
        }), 500

@flask_app.route('/api/voice/health', methods=['GET'])
def voice_health_check():
    """Health check for voice service"""
    try:
        health = elevenlabs_service.health_check()
        return jsonify(health)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def main():
    """Main entry point for Wolf AI application with enhanced MCP context and autonomous agent"""
    print("🚀 Starting Wolf AI with Unified Context Management and Autonomous Agent...")
    
    # Load existing projects and initialize samples on startup
    load_existing_projects()
    
    # Initialize MCP Server with Unified Context and Autonomous Agent (Phase 3)
    mcp_server = initialize_mcp_server()
    
    # Clean up old files on startup
    cleanup_old_audio_files(AUDIO_DIR, CACHE_DIR)
    
    # Create and launch the interface
    app = create_interface()
    
    # Enhanced MCP status with unified context and agent
    mcp_status = get_mcp_status()
    print("🔍 Enhanced MCP Status:")
    print(f"   📊 Context Summary: {mcp_status['context_summary']}")
    print(f"   🤖 AI Context Size: {mcp_status['ai_context_size']} chars")
    print(f"   📚 Resources: {len(mcp_status['resources'])}")
    print(f"   🛠️ Tools: {len(mcp_status['tools'])}")
    print(f"   🔄 Agent Status: {mcp_status['agent_status']['status']}")
    print(f"   📋 Workflows: {', '.join(mcp_status['available_workflows'])}")
    
    # Demo the unified context capabilities
    print("\n🧪 Testing Unified Context Integration:")
    
    # Simulate some context updates
    add_chat_message_via_mcp("system", "Wolf AI initialized with unified context management and autonomous agent")
    update_script_via_mcp("Welcome to Wolf AI with enhanced context awareness and autonomous workflows!")
    
    # Show AI-optimized context
    ai_context = get_ai_context()
    print(f"   🎯 AI Context Ready: {len(ai_context['recent_conversation'])} messages, {len(ai_context['recent_activities'])} activities")
    
    # Show available workflows
    agent_status = get_agent_status()
    workflows = get_workflow_list()
    print(f"\n🤖 Autonomous Agent Status: {agent_status['status']}")
    print(f"   📋 Available Workflows: {len(workflows)}")
    for workflow in workflows:
        print(f"      - {workflow['name']}: {workflow['description']}")
    
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
