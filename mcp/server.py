
"""
MCP Server - Central coordination point for resources, tools, and context
"""

import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
from .resource import MCPResource
from .tool import MCPTool
from .context import MCPContext

class MCPServer:
    """Main MCP Server that manages resources, tools, and context"""
    
    def __init__(self):
        self.resources: Dict[str, MCPResource] = {}
        self.tools: Dict[str, MCPTool] = {}
        self.context: MCPContext = MCPContext()
        self.is_running = False
        
    def register_resource(self, resource: MCPResource) -> None:
        """Register a resource with the server"""
        self.resources[resource.name] = resource
        print(f"✅ MCP Resource registered: {resource.name}")
        
    def register_tool(self, tool: MCPTool) -> None:
        """Register a tool with the server"""
        self.tools[tool.name] = tool
        print(f"✅ MCP Tool registered: {tool.name}")
        
    def get_resource(self, name: str) -> Optional[MCPResource]:
        """Get a resource by name"""
        return self.resources.get(name)
        
    def get_tool(self, name: str) -> Optional[MCPTool]:
        """Get a tool by name"""
        return self.tools.get(name)
        
    def list_resources(self) -> List[str]:
        """List all available resources"""
        return list(self.resources.keys())
        
    def list_tools(self) -> List[str]:
        """List all available tools"""
        return list(self.tools.keys())
        
    async def execute_tool(self, tool_name: str, parameters: Dict[str, Any]) -> Any:
        """Execute a tool with given parameters"""
        if tool_name not in self.tools:
            raise ValueError(f"Tool '{tool_name}' not found")
            
        tool = self.tools[tool_name]
        
        # Update context before execution
        self.context.add_activity({
            "type": "tool_execution",
            "tool": tool_name,
            "parameters": parameters,
            "timestamp": datetime.now().isoformat()
        })
        
        try:
            result = await tool.execute(parameters, self.context)
            
            # Update context after successful execution
            self.context.add_activity({
                "type": "tool_result",
                "tool": tool_name,
                "result": str(result)[:200] + "..." if len(str(result)) > 200 else str(result),
                "timestamp": datetime.now().isoformat()
            })
            
            return result
        except Exception as e:
            # Log error in context
            self.context.add_activity({
                "type": "tool_error",
                "tool": tool_name,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
            raise
            
    def get_server_info(self) -> Dict[str, Any]:
        """Get server status and capabilities"""
        return {
            "name": "Wolf AI MCP Server",
            "version": "1.0.0",
            "resources": len(self.resources),
            "tools": len(self.tools),
            "context_activities": len(self.context.activities),
            "uptime": self.context.created_at,
            "is_running": self.is_running
        }
        
    def start(self) -> None:
        """Start the MCP server"""
        self.is_running = True
        print("🚀 MCP Server started")
        
    def stop(self) -> None:
        """Stop the MCP server"""
        self.is_running = False
        print("🛑 MCP Server stopped")

# Global MCP server instance
mcp_server = MCPServer()
