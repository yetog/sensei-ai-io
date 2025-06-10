
"""
Base workflow classes and registry
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime

class Workflow(ABC):
    """Base class for all workflows"""
    
    def __init__(self, name: str, description: str, required_params: List[str] = None):
        self.name = name
        self.description = description
        self.required_params = required_params or []
        self.context_manager = None
        self.params = {}
        self.created_at = datetime.now().isoformat()
        
    async def initialize(self, params: Dict[str, Any], context_manager: Any) -> None:
        """Initialize workflow with parameters and context"""
        self.params = params
        self.context_manager = context_manager
        
        # Validate required parameters
        missing_params = [p for p in self.required_params if p not in params]
        if missing_params:
            raise ValueError(f"Missing required parameters: {missing_params}")
            
    @abstractmethod
    async def execute(self, progress_callback: Callable) -> 'WorkflowResult':
        """Execute the workflow"""
        pass
        
    def get_metadata(self) -> Dict[str, Any]:
        """Get workflow metadata"""
        return {
            "name": self.name,
            "description": self.description,
            "required_params": self.required_params,
            "created_at": self.created_at
        }

class WorkflowRegistry:
    """Registry for managing available workflows"""
    
    def __init__(self):
        self.workflows: Dict[str, Workflow] = {}
        
    def register(self, workflow: Workflow) -> None:
        """Register a workflow"""
        self.workflows[workflow.name] = workflow
        print(f"✅ Workflow registered: {workflow.name}")
        
    def get_workflow(self, name: str) -> Optional[Workflow]:
        """Get workflow by name"""
        return self.workflows.get(name)
        
    def list_workflows(self) -> List[str]:
        """List all available workflows"""
        return list(self.workflows.keys())
        
    def get_workflow_info(self, name: str) -> Optional[Dict[str, Any]]:
        """Get workflow information"""
        workflow = self.workflows.get(name)
        return workflow.get_metadata() if workflow else None
        
    def get_all_workflow_info(self) -> List[Dict[str, Any]]:
        """Get information for all workflows"""
        return [workflow.get_metadata() for workflow in self.workflows.values()]
