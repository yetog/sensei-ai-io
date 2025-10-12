"""
ElevenLabs Voice Agent Service
Handles secure signed URL generation for GDPR-compliant voice coaching
"""

import os
import requests
from typing import Dict, Optional

class ElevenLabsVoiceService:
    def __init__(self):
        self.api_key = os.getenv('ELEVEN_LABS_API_KEY')
        self.agent_id = os.getenv('ELEVEN_LABS_AGENT_ID')
        self.base_url = 'https://api.elevenlabs.io/v1'
        
    def is_configured(self) -> bool:
        """Check if credentials are configured"""
        return bool(self.api_key and self.agent_id)
    
    def get_signed_url(self) -> str:
        """
        Get a signed WebSocket URL for secure connection
        
        Returns:
            str: Signed WebSocket URL
            
        Raises:
            Exception: If credentials missing or API request fails
        """
        if not self.is_configured():
            raise Exception('ElevenLabs credentials not configured in environment variables')
        
        try:
            response = requests.get(
                f'{self.base_url}/convai/conversation/get_signed_url',
                params={'agent_id': self.agent_id},
                headers={'xi-api-key': self.api_key},
                timeout=10
            )
            
            response.raise_for_status()
            data = response.json()
            
            if 'signed_url' not in data:
                raise Exception('Invalid response from ElevenLabs API')
            
            return data['signed_url']
            
        except requests.RequestException as e:
            raise Exception(f'Failed to get signed URL: {str(e)}')
    
    def get_agent_id(self) -> str:
        """Get configured agent ID"""
        return self.agent_id
    
    def health_check(self) -> Dict:
        """Health check for service"""
        return {
            'configured': self.is_configured(),
            'agent_id': '✓' if self.agent_id else '✗',
            'api_key': '✓' if self.api_key else '✗'
        }

# Global instance
elevenlabs_service = ElevenLabsVoiceService()
