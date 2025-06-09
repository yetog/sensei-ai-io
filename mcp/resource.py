
"""
MCP Resource - Abstract base class for all MCP resources
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from datetime import datetime

class MCPResource(ABC):
    """Base class for MCP resources"""
    
    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description
        self.created_at = datetime.now().isoformat()
        self.last_accessed = None
        
    @abstractmethod
    async def read(self, identifier: Optional[str] = None) -> Any:
        """Read resource data"""
        pass
        
    @abstractmethod
    async def write(self, data: Any, identifier: Optional[str] = None) -> bool:
        """Write data to resource"""
        pass
        
    def update_access_time(self) -> None:
        """Update last accessed timestamp"""
        self.last_accessed = datetime.now().isoformat()
        
    def get_metadata(self) -> Dict[str, Any]:
        """Get resource metadata"""
        return {
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at,
            "last_accessed": self.last_accessed
        }
