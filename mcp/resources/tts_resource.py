
"""
MCP Resource wrapper for TTS service
"""

from typing import Any, Dict, Optional
from ..resource import MCPResource
from services.tts_service import (
    generate_tts_gtts, generate_tts_pyttsx3, get_available_voices,
    generate_live_preview, batch_generate_audio
)

class TTSResource(MCPResource):
    """MCP Resource for Text-to-Speech functionality"""
    
    def __init__(self):
        super().__init__(
            name="tts",
            description="Provides text-to-speech generation and voice management"
        )
        
    async def read(self, identifier: Optional[str] = None) -> Any:
        """Read TTS configuration and capabilities"""
        self.update_access_time()
        
        if identifier == "voices":
            return {
                "type": "voices",
                "available_voices": get_available_voices()
            }
        else:
            return {
                "type": "tts_info",
                "available_voices": get_available_voices(),
                "supported_engines": ["gtts", "pyttsx3"]
            }
            
    async def write(self, data: Any, identifier: Optional[str] = None) -> bool:
        """Generate TTS audio"""
        self.update_access_time()
        
        if isinstance(data, dict):
            text = data.get("text", "")
            engine = data.get("engine", "gtts")
            speed = data.get("speed", 1.0)
            voice = data.get("voice", "en")
            
            if data.get("action") == "generate":
                if engine == "gtts":
                    result = generate_tts_gtts(text, speed, voice)
                elif engine == "pyttsx3":
                    pitch = data.get("pitch", 0)
                    result = generate_tts_pyttsx3(text, speed, voice, pitch)
                else:
                    return False
                    
                return result is not None
                
            elif data.get("action") == "preview":
                result = generate_live_preview(text, engine, voice, speed)
                return result is not None
                
        return False
