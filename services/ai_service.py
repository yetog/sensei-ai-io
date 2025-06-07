
import asyncio
import requests
from typing import List, Tuple
from core.config import session_data

# AI imports
try:
    import openai
    from dotenv import load_dotenv
    load_dotenv()
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False

async def call_ionos_ai(message: str, script_context: str = "", api_key: str = "") -> str:
    """Call IONOS AI API"""
    if not api_key:
        return "❌ IONOS API key not configured. Please set your API key in the settings."
    
    try:
        # IONOS AI API endpoint (placeholder - replace with actual endpoint)
        url = "https://api.ionos.com/ai/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "claude-3-5-sonnet-20241022",
            "messages": [
                {
                    "role": "system",
                    "content": f"You are an AI assistant helping with script writing and improvement for Wolf AI. Current script context: {script_context[:500]}..."
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            return result.get("choices", [{}])[0].get("message", {}).get("content", "No response received")
        else:
            return f"❌ API Error: {response.status_code} - {response.text}"
            
    except requests.RequestException as e:
        return f"❌ Network Error: {str(e)}"
    except Exception as e:
        return f"❌ Unexpected Error: {str(e)}"

def set_api_key(service: str, api_key: str) -> str:
    """Set API key for AI services"""
    if service in session_data["api_keys"]:
        session_data["api_keys"][service] = api_key
        return f"✅ {service.upper()} API key configured successfully!"
    return f"❌ Unknown service: {service}"

def chat_with_ai(message: str, history: List, script_context: str) -> Tuple[List, str]:
    """Handle AI chat interactions with IONOS integration"""
    if not AI_AVAILABLE:
        history.append((message, "❌ AI functionality not available. Please install required packages."))
        return history, ""
    
    # Check for API key
    ionos_key = session_data["api_keys"]["ionos_api_key"]
    if not ionos_key:
        history.append((message, "❌ IONOS API key not configured. Please set your API key in the settings below."))
        return history, ""
    
    try:
        # Use asyncio to call the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        response = loop.run_until_complete(call_ionos_ai(message, script_context, ionos_key))
        loop.close()
        
        history.append((message, response))
        return history, ""
    except Exception as e:
        history.append((message, f"❌ AI Error: {str(e)}"))
        return history, ""

def quick_action_improve(script: str, chat_history: List) -> Tuple[List, str]:
    """Quick action: Improve script"""
    return chat_with_ai("Please improve this script for better TTS pronunciation, flow, and engagement. Focus on natural speech patterns and clear articulation.", chat_history, script)

def quick_action_romantic(script: str, chat_history: List) -> Tuple[List, str]:
    """Quick action: Rewrite in romantic tone"""
    return chat_with_ai("Rewrite this script in a more romantic and emotional tone, suitable for intimate or heartfelt content.", chat_history, script)

def quick_action_dramatic(script: str, chat_history: List) -> Tuple[List, str]:
    """Quick action: Add dramatic pauses"""
    return chat_with_ai("Add dramatic pauses, emphasis, and emotional inflection to this script for better TTS delivery and impact.", chat_history, script)

def quick_action_continue(script: str, chat_history: List) -> Tuple[List, str]:
    """Quick action: Continue story"""
    return chat_with_ai("Continue this story or script with an engaging next paragraph that maintains the same tone and style.", chat_history, script)

def quick_action_summarize(script: str, chat_history: List) -> Tuple[List, str]:
    """Quick action: Summarize script"""
    return chat_with_ai("Create a concise summary of this script, highlighting the key points and main message.", chat_history, script)

def quick_action_professional(script: str, chat_history: List) -> Tuple[List, str]:
    """Quick action: Make professional"""
    return chat_with_ai("Rewrite this script in a professional business tone suitable for corporate presentations or formal communications.", chat_history, script)
