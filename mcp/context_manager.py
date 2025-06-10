
"""
Unified Context Manager for Wolf AI
Bridges session_data with MCP context and chat history
"""

from typing import Dict, List, Any, Optional, Callable
from datetime import datetime
import json
from .context import MCPContext
from core.config import session_data

class UnifiedContextManager:
    """Manages unified context across the entire application"""
    
    def __init__(self):
        self.mcp_context = MCPContext()
        self.sync_callbacks: List[Callable] = []
        
        # Initialize with existing session data
        self._sync_from_session_data()
        
    def _sync_from_session_data(self) -> None:
        """Sync MCP context with global session_data"""
        self.mcp_context.update_session_data(session_data)
        
        # Set current project if exists
        current_project = session_data.get("current_project", "")
        if current_project:
            self.mcp_context.set_current_project(current_project)
            
    def _sync_to_session_data(self) -> None:
        """Sync changes back to global session_data"""
        # Update session_data with MCP context data
        for key, value in self.mcp_context.session_data.items():
            session_data[key] = value
            
        # Update current project
        if self.mcp_context.current_project:
            session_data["current_project"] = self.mcp_context.current_project
            
        # Notify callbacks
        for callback in self.sync_callbacks:
            try:
                callback(session_data)
            except Exception as e:
                print(f"⚠️ Context sync callback error: {e}")
                
    def register_sync_callback(self, callback: Callable) -> None:
        """Register a callback for context sync events"""
        self.sync_callbacks.append(callback)
        
    def update_project(self, project_name: str, project_data: Dict[str, Any]) -> None:
        """Update project data with unified sync"""
        # Update in MCP context
        projects = self.mcp_context.session_data.get("projects", {})
        projects[project_name] = project_data
        self.mcp_context.update_session_data({"projects": projects})
        
        # Sync to global session
        self._sync_to_session_data()
        
        # Log activity
        self.mcp_context.add_activity({
            "type": "project_update",
            "project_name": project_name,
            "data_keys": list(project_data.keys())
        })
        
    def set_current_project(self, project_name: str) -> None:
        """Set current project with unified sync"""
        self.mcp_context.set_current_project(project_name)
        self._sync_to_session_data()
        
    def update_script(self, script_content: str) -> None:
        """Update current script with context tracking"""
        self.mcp_context.set_current_script(script_content)
        
        # Update in current project if exists
        current_project = self.mcp_context.current_project
        if current_project:
            projects = self.mcp_context.session_data.get("projects", {})
            if current_project in projects:
                projects[current_project]["script"] = script_content
                projects[current_project]["word_count"] = len(script_content.split())
                projects[current_project]["character_count"] = len(script_content)
                self.mcp_context.update_session_data({"projects": projects})
                self._sync_to_session_data()
                
    def add_chat_message(self, role: str, content: str, script_context: Optional[str] = None) -> None:
        """Add chat message with enhanced context"""
        metadata = {}
        
        if script_context:
            metadata["script_context"] = {
                "length": len(script_context),
                "word_count": len(script_context.split()),
                "has_content": bool(script_context.strip())
            }
            
        metadata["current_project"] = self.mcp_context.current_project
        metadata["session_state"] = self.get_session_summary()
        
        self.mcp_context.add_chat_message(role, content, metadata)
        
    def update_settings(self, settings: Dict[str, Any]) -> None:
        """Update application settings with sync"""
        current_settings = self.mcp_context.session_data.get("settings", {})
        current_settings.update(settings)
        
        self.mcp_context.update_session_data({"settings": current_settings})
        self._sync_to_session_data()
        
    def set_api_key(self, service: str, api_key: str) -> None:
        """Set API key with secure handling"""
        api_keys = self.mcp_context.session_data.get("api_keys", {})
        api_keys[f"{service}_api_key"] = api_key
        
        self.mcp_context.update_session_data({"api_keys": api_keys})
        self._sync_to_session_data()
        
        # Log without exposing the key
        self.mcp_context.add_activity({
            "type": "api_key_update",
            "service": service,
            "key_length": len(api_key),
            "is_set": bool(api_key.strip())
        })
        
    def get_session_summary(self) -> Dict[str, Any]:
        """Get summarized session information"""
        return {
            "current_project": self.mcp_context.current_project,
            "script_length": len(self.mcp_context.current_script),
            "total_projects": len(self.mcp_context.session_data.get("projects", {})),
            "chat_messages": len(self.mcp_context.chat_history),
            "activities": len(self.mcp_context.activities),
            "api_keys_configured": list(self.mcp_context.session_data.get("api_keys", {}).keys()),
            "last_activity": self.mcp_context.activities[-1] if self.mcp_context.activities else None
        }
        
    def get_context_for_ai(self) -> Dict[str, Any]:
        """Get context optimized for AI interactions"""
        unified_context = self.mcp_context.get_unified_context()
        
        return {
            "current_session": {
                "project": unified_context["session"]["current_project"],
                "script_word_count": unified_context["session"]["script_length"],
                "settings": unified_context["session"]["settings"]
            },
            "recent_conversation": unified_context["chat"]["recent_messages"],
            "recent_activities": [
                {
                    "type": activity.get("type", "unknown"),
                    "timestamp": activity.get("timestamp", ""),
                    "summary": self._summarize_activity(activity)
                }
                for activity in unified_context["activity"]["recent_activities"]
            ]
        }
        
    def _summarize_activity(self, activity: Dict[str, Any]) -> str:
        """Create human-readable activity summary"""
        activity_type = activity.get("type", "unknown")
        
        if activity_type == "project_update":
            return f"Updated project '{activity.get('project_name', 'unknown')}'"
        elif activity_type == "script_update":
            return f"Script edited ({activity.get('new_length', 0)} chars)"
        elif activity_type == "chat_message":
            return f"{activity.get('role', 'unknown')} message ({activity.get('content_length', 0)} chars)"
        elif activity_type == "api_key_update":
            return f"Updated {activity.get('service', 'unknown')} API key"
        else:
            return f"Activity: {activity_type}"
            
    def export_context(self) -> Dict[str, Any]:
        """Export complete unified context"""
        return {
            "unified_context": self.mcp_context.export_context(),
            "session_summary": self.get_session_summary(),
            "ai_context": self.get_context_for_ai()
        }

# Global context manager instance
context_manager = UnifiedContextManager()
