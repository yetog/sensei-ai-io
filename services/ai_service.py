
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

# IONOS API Configuration
IONOS_API_TOKEN = "eyJ0eXAiOiJKV1QiLCJraWQiOiJkZDZkNWExYS00NDY0LTQ0MGEtYjJhMC05NjY0Y2IzNDZiNDYiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpb25vc2Nsb3VkIiwiaWF0IjoxNzQ4NDgwMjk5LCJjbGllbnQiOiJVU0VSIiwiaWRlbnRpdHkiOnsiaXNQYXJlbnQiOmZhbHNlLCJjb250cmFjdE51bWJlciI6MzM5NzEwMzMsInJvbGUiOiJvd25lciIsInJlZ0RvbWFpbiI6Imlvbm9zLmNvbSIsInJlc2VsbGVySWQiOjEsInV1aWQiOiI3YmNiNzg4MS1hZDMxLTQxMDgtOGI3Zi0wOGIyNjdiYTI0ZWUiLCJwcml2aWxlZ2VzIjpbIkRBVEFfQ0VOVEVSX0NSRUFURSIsIlNOQVBTSE9UX0NSRUFURSIsIklQX0JMT0NLX1JFU0VSVkUiLCJNQU5BR0VfREFUQVBMQVRGT1JNIiwiQUNDRVNTX0FDVElWSVRZX0xPRyIsIlBDQ19DUkVBVEUiLCJBQ0NFU1NfUzNfT0JKRUNUX1NUT1JBR0UiLCJCQUNLVVBfVU5JVF9DUkVBVEUiLCJDUkVBVEVfSU5URVJORVRfQUNDRVNTIiwiSzhTX0NMVVNURVJfQ1JFQVRFIiwiRkxPV19MT0dfQ1JFQVRFIiwiQUNDRVNTX0FORF9NQU5BR0VfTU9OSVRPUklORyIsIkFDQ0VTU19BTkRfTUFOQUdFX0NFUlRJRklDQVRFUyIsIkFDQ0VTU19BTkRfTUFOQUdFX0xPR0dJTkciLCJNQU5BR0VfREJBQVMiLCJBQ0NFU1NfQU5EX01BTkFHRV9ETlMiLCJNQU5BR0VfUkVHSVNUUlkiLCJBQ0NFU1NfQU5EX01BTkFHRV9DRE4iLCJBQ0NFU1NfQU5EX01BTkFHRV9WUE4iLCJBQ0NFU1NfQU5EX01BTkFHRV9BUElfR0FURVdBWSIsIkFDQ0VTU19BTkRfTUFOQUdFX05HUyIsIkFDQ0VTU19BTkRfTUFOQUdFX0tBQVMiLCJBQ0NFU1NfQU5EX01BTkFHRV9ORVRXT1JLX0ZJTEVfU1RPUkFHRSIsIkFDQ0VTU19BTkRfTUFOQUdFX0FJX01PREVMX0hVQiIsIkNSRUFURV9ORVRXT1JLX1NFQ1VSSVRZX0dST1VQUyIsIkFDQ0VTU19BTkRfTUFOQUdFX0lBTV9SRVNPVVJDRVMiXX0sImV4cCI6MTc1NjI1NjI5OX0.MWVvOpvWZFsqQSegbv2IowICHBug2IJODqMk9qSKLRkbzBpLf63JtXwhC8jLDzSFUBgg40mXvMMo0s0-AAcalDeCAKDMccWZYzsKuKVfalTAsh0EGhc8aegs53zXX75MYx02pBddAb2pXrQ96sOknoyffekiM0vufIkD39Rj92gXAUStt7BPjTor1eCqs48BPvHjVojdE_tVJZg5kYAq5f_nAKTT3yDj1_2CQQdtrUZVI_FY8yl5Q_0DyN4oASNDsALhIv2wr49V2dvb9EB-AqIO1TndgkyZxH66Isnz2zJ2BA1tWgSMGTnXAQXNQ5O8qXq0gq97xDoqMjVEk9TahA"
MODEL_NAME = "meta-llama/Meta-Llama-3.1-8B-Instruct"
ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/chat/completions"

async def call_ionos_ai(message: str, script_context: str = "", api_key: str = "") -> str:
    """Call IONOS AI API with proper authentication"""
    # Use the hardcoded API key if none provided
    if not api_key:
        api_key = IONOS_API_TOKEN
    
    if not api_key:
        return "❌ IONOS API key not configured. Please set your API key in the settings."
    
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": MODEL_NAME,
            "messages": [
                {
                    "role": "system",
                    "content": f"You are an AI assistant helping with script writing and improvement for Wolf AI. You provide concise, actionable advice for improving scripts and content. Current script context: {script_context[:500]}..."
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        print(f"Making API request to: {ENDPOINT}")
        print(f"Using model: {MODEL_NAME}")
        
        response = requests.post(ENDPOINT, headers=headers, json=payload, timeout=30)
        
        print(f"API response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "No response received")
            print(f"✅ API call successful")
            return content
        else:
            error_text = response.text
            print(f"❌ API Error: {response.status_code} - {error_text}")
            return f"❌ API Error: {response.status_code} - {error_text}"
            
    except requests.RequestException as e:
        print(f"❌ Network Error: {str(e)}")
        return f"❌ Network Error: {str(e)}"
    except Exception as e:
        print(f"❌ Unexpected Error: {str(e)}")
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
    
    # Use the hardcoded API key
    ionos_key = session_data["api_keys"].get("ionos_api_key", IONOS_API_TOKEN)
    
    try:
        # Use asyncio to call the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        response = loop.run_until_complete(call_ionos_ai(message, script_context, ionos_key))
        loop.close()
        
        history.append((message, response))
        return history, ""
    except Exception as e:
        error_msg = f"❌ AI Error: {str(e)}"
        print(error_msg)
        history.append((message, error_msg))
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

def quick_action_enhance(script: str, chat_history: List) -> Tuple[List, str]:
    """Quick action: General enhancement"""
    return chat_with_ai("Enhance this script by improving clarity, flow, and impact while maintaining the original message and tone.", chat_history, script)

def quick_action_translate(script: str, target_lang: str, chat_history: List) -> Tuple[List, str]:
    """Quick action: Translate script"""
    return chat_with_ai(f"Translate this script to {target_lang} while maintaining the tone, style, and natural flow for TTS pronunciation.", chat_history, script)
