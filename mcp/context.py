
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
        activity["timestamp"] = datetime.now().isoformat()
        self.activities.append(activity)
        
        # Keep only last 100 activities to prevent memory bloat
        if len(self.activities) > 100:
            self.activities = self.activities[-100:]
            
    def update_session_data(self, data: Dict[str, Any]) -> None:
        """Update session data with merge strategy"""
        def deep_merge(target: Dict, source: Dict) -> Dict:
            """Deep merge two dictionaries"""
            for key, value in source.items():
                if key in target and isinstance(target[key], dict) and isinstance(value, dict):
                    deep_merge(target[key], value)
                else:
                    target[key] = value
            return target
        
        deep_merge(self.session_data, data)
        
        # Log session update activity
        self.add_activity({
            "type": "session_update",
            "keys_updated": list(data.keys()),
            "session_size": len(self.session_data)
        })
        
    def add_chat_message(self, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Add a chat message to history with enhanced metadata"""
        message = {
            "id": f"msg_{len(self.chat_history)}_{int(datetime.now().timestamp())}",
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        self.chat_history.append(message)
        
        # Keep only last 50 messages
        if len(self.chat_history) > 50:
            self.chat_history = self.chat_history[-50:]
            
        # Log chat activity
        self.add_activity({
            "type": "chat_message",
            "role": role,
            "content_length": len(content),
            "message_id": message["id"]
        })
            
    def set_current_script(self, script: str) -> None:
        """Set the current script context with change tracking"""
        old_length = len(self.current_script)
        self.current_script = script
        
        # Log script change activity
        self.add_activity({
            "type": "script_update",
            "old_length": old_length,
            "new_length": len(script),
            "change_type": "edit" if old_length > 0 else "create"
        })
        
    def set_current_project(self, project: str) -> None:
        """Set the current project context"""
        old_project = self.current_project
        self.current_project = project
        
        # Log project change activity
        self.add_activity({
            "type": "project_change",
            "old_project": old_project,
            "new_project": project
        })
        
    def get_recent_activities(self, count: int = 10, activity_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get recent activities with optional filtering"""
        activities = self.activities
        
        if activity_type:
            activities = [a for a in activities if a.get("type") == activity_type]
            
        return activities[-count:] if activities else []
        
    def get_chat_context(self, message_count: int = 10) -> List[Dict[str, Any]]:
        """Get recent chat messages for context"""
        return self.chat_history[-message_count:] if self.chat_history else []
        
    def get_unified_context(self) -> Dict[str, Any]:
        """Get unified context combining all relevant data"""
        return {
            "session": {
                "current_project": self.current_project,
                "script_length": len(self.current_script),
                "projects": self.session_data.get("projects", {}),
                "settings": self.session_data.get("settings", {}),
                "api_keys_configured": bool(self.session_data.get("api_keys", {}).get("ionos_api_key"))
            },
            "chat": {
                "message_count": len(self.chat_history),
                "recent_messages": self.get_chat_context(5),
                "last_message": self.chat_history[-1] if self.chat_history else None
            },
            "activity": {
                "total_activities": len(self.activities),
                "recent_activities": self.get_recent_activities(5),
                "activity_types": list(set(a.get("type", "unknown") for a in self.activities))
            }
        }
        
    def get_context_summary(self) -> Dict[str, Any]:
        """Get a summary of current context"""
        return {
            "created_at": self.created_at,
            "activities_count": len(self.activities),
            "chat_messages_count": len(self.chat_history),
            "current_project": self.current_project,
            "current_script_length": len(self.current_script),
            "session_keys": list(self.session_data.keys()),
            "last_activity": self.activities[-1] if self.activities else None,
            "last_chat_message": self.chat_history[-1] if self.chat_history else None
        }
        
    def search_activities(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search activities by content"""
        results = []
        query_lower = query.lower()
        
        for activity in reversed(self.activities):
            if any(query_lower in str(value).lower() for value in activity.values()):
                results.append(activity)
                if len(results) >= limit:
                    break
                    
        return results
        
    def export_context(self) -> Dict[str, Any]:
        """Export complete context for backup or analysis"""
        return {
            "metadata": {
                "created_at": self.created_at,
                "exported_at": datetime.now().isoformat(),
                "version": "1.0"
            },
            "session_data": self.session_data,
            "chat_history": self.chat_history,
            "activities": self.activities,
            "current_state": {
                "project": self.current_project,
                "script": self.current_script
            }
        }
