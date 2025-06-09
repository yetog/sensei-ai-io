
"""
MCP Context - Manages application context and state
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import json

class MCPContext:
    """Manages context and state for MCP operations"""
    
    def __init__(self):
        self.created_at = datetime.now().isoformat()
        self.activities: List[Dict[str, Any]] = []
        self.session_data: Dict[str, Any] = {}
        self.chat_history: List[Dict[str, Any]] = []
        self.current_script: str = ""
        self.current_project: str = ""
        
    def add_activity(self, activity: Dict[str, Any]) -> None:
        """Add an activity to the context"""
        activity["id"] = len(self.activities)
        self.activities.append(activity)
        
        # Keep only last 100 activities to prevent memory bloat
        if len(self.activities) > 100:
            self.activities = self.activities[-100:]
            
    def update_session_data(self, data: Dict[str, Any]) -> None:
        """Update session data"""
        self.session_data.update(data)
        
    def add_chat_message(self, role: str, content: str) -> None:
        """Add a chat message to history"""
        self.chat_history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep only last 50 messages
        if len(self.chat_history) > 50:
            self.chat_history = self.chat_history[-50:]
            
    def set_current_script(self, script: str) -> None:
        """Set the current script context"""
        self.current_script = script
        
    def set_current_project(self, project: str) -> None:
        """Set the current project context"""
        self.current_project = project
        
    def get_recent_activities(self, count: int = 10) -> List[Dict[str, Any]]:
        """Get recent activities"""
        return self.activities[-count:] if self.activities else []
        
    def get_context_summary(self) -> Dict[str, Any]:
        """Get a summary of current context"""
        return {
            "created_at": self.created_at,
            "activities_count": len(self.activities),
            "chat_messages_count": len(self.chat_history),
            "current_project": self.current_project,
            "current_script_length": len(self.current_script),
            "session_keys": list(self.session_data.keys())
        }
