
"""
MCP Tool - Abstract base class for all MCP tools
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List
from datetime import datetime

class MCPTool(ABC):
    """Base class for MCP tools"""
    
    def __init__(self, name: str, description: str = "", parameters: List[str] = None):
        self.name = name
        self.description = description
        self.parameters = parameters or []
        self.created_at = datetime.now().isoformat()
        self.execution_count = 0
        
    @abstractmethod
    async def execute(self, parameters: Dict[str, Any], context: 'MCPContext') -> Any:
        """Execute the tool with given parameters and context"""
        pass
        
    def increment_execution_count(self) -> None:
        """Increment execution counter"""
        self.execution_count += 1
        
    def get_metadata(self) -> Dict[str, Any]:
        """Get tool metadata"""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
            "created_at": self.created_at,
            "execution_count": self.execution_count
        }
