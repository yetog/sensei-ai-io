
"""
MCP Resource wrapper for AI service
"""

from typing import Any, Dict, Optional
from ..resource import MCPResource
from services.ai_service import call_ionos_ai, set_api_key

class AIResource(MCPResource):
    """MCP Resource for AI functionality"""
    
    def __init__(self):
        super().__init__(
            name="ai",
            description="Provides AI chat and script improvement capabilities"
        )
        
    async def read(self, identifier: Optional[str] = None) -> Any:
        """Read AI service information"""
        self.update_access_time()
        
        return {
            "type": "ai_info",
            "model": "meta-llama/Meta-Llama-3.1-8B-Instruct",
            "provider": "IONOS AI",
            "capabilities": [
                "script_improvement",
                "chat",
                "content_generation",
                "translation"
            ]
        }
            
    async def write(self, data: Any, identifier: Optional[str] = None) -> bool:
        """Interact with AI service"""
        self.update_access_time()
        
        if isinstance(data, dict):
            if data.get("action") == "chat":
                message = data.get("message", "")
                script_context = data.get("script_context", "")
                api_key = data.get("api_key", "")
                
                result = await call_ionos_ai(message, script_context, api_key)
                return not result.startswith("❌")
                
            elif data.get("action") == "set_api_key":
                service = data.get("service", "")
                api_key = data.get("api_key", "")
                
                result = set_api_key(service, api_key)
                return "✅" in result
                
        return False
