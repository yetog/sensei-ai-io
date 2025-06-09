
"""
MCP Resource wrapper for project service
"""

from typing import Any, Dict, Optional
from ..resource import MCPResource
from services.project_service import (
    save_project, load_project, delete_project, export_project,
    get_project_list, create_new_project
)

class ProjectResource(MCPResource):
    """MCP Resource for project management"""
    
    def __init__(self):
        super().__init__(
            name="projects",
            description="Manages Wolf AI projects - save, load, delete, export, and list projects"
        )
        
    async def read(self, identifier: Optional[str] = None) -> Any:
        """Read project data"""
        self.update_access_time()
        
        if identifier is None:
            # Return list of all projects
            return {
                "type": "project_list",
                "projects": get_project_list()
            }
        else:
            # Return specific project
            script, notes, status = load_project(identifier)
            return {
                "type": "project_data",
                "project_name": identifier,
                "script": script,
                "notes": notes,
                "status": status
            }
            
    async def write(self, data: Any, identifier: Optional[str] = None) -> bool:
        """Write project data"""
        self.update_access_time()
        
        if isinstance(data, dict):
            if data.get("action") == "save":
                result = save_project(
                    data.get("name", ""),
                    data.get("script", ""),
                    data.get("notes", "")
                )
                return "✅" in result
                
            elif data.get("action") == "create":
                result = create_new_project(data.get("name"))
                return "✅" in result
                
            elif data.get("action") == "delete" and identifier:
                result, _ = delete_project(identifier)
                return "✅" in result
                
            elif data.get("action") == "export" and identifier:
                result = export_project(identifier)
                return result is not None
                
        return False
