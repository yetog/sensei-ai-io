
"""
Autonomous Agent for Wolf AI
Manages complex workflows and automated task execution
"""

import asyncio
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime
from enum import Enum
from .context_manager import context_manager
from .server import mcp_server

class AgentStatus(Enum):
    IDLE = "idle"
    PLANNING = "planning"
    EXECUTING = "executing"
    PAUSED = "paused"
    COMPLETED = "completed"
    ERROR = "error"

class WorkflowResult:
    """Result of workflow execution"""
    def __init__(self, success: bool, data: Any = None, error: str = None):
        self.success = success
        self.data = data
        self.error = error
        self.timestamp = datetime.now().isoformat()

class AutonomousAgent:
    """Core autonomous agent for Wolf AI"""
    
    def __init__(self):
        self.status = AgentStatus.IDLE
        self.current_workflow = None
        self.execution_queue = []
        self.execution_history = []
        self.user_confirmations_required = True
        self.is_running = False
        self.progress_callback: Optional[Callable] = None
        
    def set_progress_callback(self, callback: Callable) -> None:
        """Set callback for progress updates"""
        self.progress_callback = callback
        
    def _notify_progress(self, message: str, progress: float = 0.0) -> None:
        """Notify progress to UI"""
        if self.progress_callback:
            self.progress_callback({
                "message": message,
                "progress": progress,
                "status": self.status.value,
                "workflow": self.current_workflow.name if self.current_workflow else None
            })
            
        # Log to context
        context_manager.mcp_context.add_activity({
            "type": "agent_progress",
            "message": message,
            "progress": progress,
            "status": self.status.value,
            "workflow": self.current_workflow.name if self.current_workflow else None
        })
        
    async def execute_workflow(self, workflow: 'Workflow', params: Dict[str, Any] = None) -> WorkflowResult:
        """Execute a single workflow"""
        if self.status != AgentStatus.IDLE:
            return WorkflowResult(False, error="Agent is busy")
            
        self.status = AgentStatus.PLANNING
        self.current_workflow = workflow
        params = params or {}
        
        try:
            # Initialize workflow
            self._notify_progress(f"Starting workflow: {workflow.name}", 0.0)
            await workflow.initialize(params, context_manager)
            
            # Execute workflow steps
            self.status = AgentStatus.EXECUTING
            result = await workflow.execute(self._notify_progress)
            
            # Complete workflow
            self.status = AgentStatus.COMPLETED
            self._notify_progress(f"Workflow completed: {workflow.name}", 1.0)
            
            # Log execution
            self.execution_history.append({
                "workflow": workflow.name,
                "params": params,
                "result": result.success,
                "timestamp": datetime.now().isoformat(),
                "error": result.error
            })
            
            return result
            
        except Exception as e:
            self.status = AgentStatus.ERROR
            error_msg = f"Workflow failed: {str(e)}"
            self._notify_progress(error_msg, 0.0)
            
            return WorkflowResult(False, error=error_msg)
            
        finally:
            self.current_workflow = None
            self.status = AgentStatus.IDLE
            
    def pause_execution(self) -> bool:
        """Pause current workflow execution"""
        if self.status == AgentStatus.EXECUTING:
            self.status = AgentStatus.PAUSED
            self._notify_progress("Workflow paused", 0.0)
            return True
        return False
        
    def resume_execution(self) -> bool:
        """Resume paused workflow execution"""
        if self.status == AgentStatus.PAUSED:
            self.status = AgentStatus.EXECUTING
            self._notify_progress("Workflow resumed", 0.0)
            return True
        return False
        
    def stop_execution(self) -> bool:
        """Stop current workflow execution"""
        if self.status in [AgentStatus.EXECUTING, AgentStatus.PAUSED]:
            self.status = AgentStatus.IDLE
            self.current_workflow = None
            self._notify_progress("Workflow stopped", 0.0)
            return True
        return False
        
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        return {
            "status": self.status.value,
            "current_workflow": self.current_workflow.name if self.current_workflow else None,
            "queue_length": len(self.execution_queue),
            "history_count": len(self.execution_history),
            "user_confirmations_required": self.user_confirmations_required,
            "is_running": self.is_running
        }
        
    def get_execution_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent execution history"""
        return self.execution_history[-limit:] if self.execution_history else []

# Global agent instance
autonomous_agent = AutonomousAgent()
