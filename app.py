
import gradio as gr
import os
import json
import tempfile
from typing import Dict, List, Tuple, Optional
import time
from datetime import datetime
import shutil
import threading
import asyncio

# TTS imports
try:
    from gtts import gTTS
    import pyttsx3
    GTTS_AVAILABLE = True
    PYTTSX3_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False
    PYTTSX3_AVAILABLE = False

# AI imports
try:
    import openai
    import requests
    from dotenv import load_dotenv
    load_dotenv()
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False

# Create directories
AUDIO_DIR = "generated_audio"
CACHE_DIR = "audio_cache"
TEMPLATES_DIR = "script_templates"
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(TEMPLATES_DIR, exist_ok=True)

# Global state for session management
session_data = {
    "projects": {},
    "current_project": "default",
    "settings": {
        "voice": "en",
        "speed": 1.0,
        "volume": 80,
        "engine": "gtts",
        "pitch": 0,
        "tone": "normal",
        "auto_save": True,
        "live_preview": False
    },
    "last_audio_file": None,
    "audio_history": [],
    "audio_cache": {},
    "api_keys": {
        "ionos_api_key": "",
        "openai_api_key": ""
    }
}

# Sample scripts for demo
SAMPLE_SCRIPTS = {
    "Welcome Demo": {
        "script": """Welcome to ScriptVoice, your AI-powered script editor!

This is a demonstration of how you can create engaging scripts and convert them to natural-sounding speech.

Try editing this text, then click 'Generate Audio' to hear it spoken aloud. You can adjust the speed, volume, and voice settings to customize the output.

The AI assistant can help you improve your scripts, check for flow issues, or make them more engaging. Just ask!""",
        "notes": "Demo script showcasing basic functionality"
    },
    "Podcast Intro": {
        "script": """Hello and welcome back to Tech Talk Tuesday, the podcast where we explore the latest innovations in technology.

I'm your host, and today we're diving deep into the world of artificial intelligence and its impact on content creation.

We'll be discussing how AI tools are revolutionizing the way we write, edit, and produce audio content. So grab your coffee, settle in, and let's get started!""",
        "notes": "Sample podcast introduction with natural pacing"
    },
    "Product Demo": {
        "script": """Introducing the future of voice technology - where your words come to life with stunning clarity and natural expression.

Our advanced text-to-speech system transforms any written content into professional-quality audio, perfect for presentations, podcasts, audiobooks, and more.

With customizable voices, adjustable speed controls, and AI-powered script optimization, creating compelling audio content has never been easier.

Experience the difference today and revolutionize your content creation workflow.""",
        "notes": "Product demonstration script with marketing tone"
    }
}

# Initialize TTS engines
tts_engine = None
if PYTTSX3_AVAILABLE:
    try:
        tts_engine = pyttsx3.init()
    except:
        tts_engine = None

# Load sample scripts on startup
def initialize_sample_scripts():
    """Initialize sample scripts in the projects"""
    for name, content in SAMPLE_SCRIPTS.items():
        if name not in session_data["projects"]:
            session_data["projects"][name] = {
                "name": name,
                "script": content["script"],
                "notes": content["notes"],
                "created_at": datetime.now().isoformat(),
                "word_count": len(content["script"].split()),
                "character_count": len(content["script"]),
                "is_sample": True
            }

def initialize_project(project_name: str = "default") -> Dict:
    """Initialize a new project with default structure"""
    return {
        "name": project_name,
        "script": "",
        "notes": "",
        "created_at": datetime.now().isoformat(),
        "word_count": 0,
        "character_count": 0,
        "is_sample": False
    }

def get_cache_key(text: str, engine: str, voice: str, speed: float, pitch: int) -> str:
    """Generate cache key for TTS audio"""
    import hashlib
    content = f"{text}_{engine}_{voice}_{speed}_{pitch}"
    return hashlib.md5(content.encode()).hexdigest()

def get_cached_audio(cache_key: str) -> Optional[str]:
    """Get cached audio file if available"""
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.mp3")
    if os.path.exists(cache_file):
        return cache_file
    return None

def cache_audio(cache_key: str, audio_file: str) -> None:
    """Cache audio file"""
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.mp3")
    try:
        shutil.copy2(audio_file, cache_file)
        session_data["audio_cache"][cache_key] = cache_file
    except Exception as e:
        print(f"Cache error: {e}")

def update_word_count(text: str) -> Tuple[str, str, str]:
    """Update word and character count display with reading time"""
    words = len(text.split()) if text.strip() else 0
    chars = len(text)
    reading_time = max(1, words // 200)
    
    # Update session data
    if session_data["current_project"] in session_data["projects"]:
        session_data["projects"][session_data["current_project"]]["word_count"] = words
        session_data["projects"][session_data["current_project"]]["character_count"] = chars
    
    return (
        f"**Words:** {words} | **Characters:** {chars}",
        f"**Estimated reading time:** {reading_time} min",
        f"**TTS Duration:** ~{max(1, words // 150)} min"
    )

def get_audio_file_info(filepath: str) -> str:
    """Get audio file information"""
    if not filepath or not os.path.exists(filepath):
        return ""
    
    file_size = os.path.getsize(filepath) / 1024  # KB
    filename = os.path.basename(filepath)
    creation_time = datetime.fromtimestamp(os.path.getctime(filepath)).strftime("%H:%M:%S")
    return f"📁 **{filename}** ({file_size:.1f} KB) - Created: {creation_time}"

def generate_tts_gtts(text: str, speed: float = 1.0, voice: str = "en") -> Optional[str]:
    """Generate TTS using Google Text-to-Speech with voice options"""
    if not GTTS_AVAILABLE or not text.strip():
        return None
    
    try:
        # Check cache first
        cache_key = get_cache_key(text, "gtts", voice, speed, 0)
        cached_file = get_cached_audio(cache_key)
        if cached_file:
            print(f"Using cached audio: {cache_key}")
            return cached_file
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"script_audio_{timestamp}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)
        
        # Support different languages/voices for gTTS
        lang_map = {
            "en": "en",
            "en-us": "en",
            "en-uk": "en-uk", 
            "es": "es",
            "fr": "fr",
            "de": "de",
            "it": "it",
            "pt": "pt",
            "ru": "ru",
            "ja": "ja",
            "ko": "ko",
            "zh": "zh"
        }
        
        tts_lang = lang_map.get(voice.lower(), "en")
        tts = gTTS(text=text, lang=tts_lang, slow=(speed < 0.8))
        tts.save(filepath)
        
        # Cache the result
        cache_audio(cache_key, filepath)
        
        return filepath
    except Exception as e:
        print(f"gTTS Error: {e}")
        return None

def generate_tts_pyttsx3(text: str, speed: float = 1.0, voice: str = "default", pitch: int = 0) -> Optional[str]:
    """Generate TTS using pyttsx3 with voice and pitch options"""
    if not PYTTSX3_AVAILABLE or not tts_engine or not text.strip():
        return None
    
    try:
        # Check cache first
        cache_key = get_cache_key(text, "pyttsx3", voice, speed, pitch)
        cached_file = get_cached_audio(cache_key)
        if cached_file:
            print(f"Using cached audio: {cache_key}")
            return cached_file
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"script_audio_{timestamp}.wav"
        filepath = os.path.join(AUDIO_DIR, filename)
        
        # Get available voices
        voices = tts_engine.getProperty('voices')
        
        # Set voice if available
        if voice != "default" and voices:
            for v in voices:
                if voice.lower() in v.name.lower():
                    tts_engine.setProperty('voice', v.id)
                    break
        
        # Set properties
        tts_engine.setProperty('rate', int(200 * speed))
        
        # Set pitch if supported
        try:
            current_voice = tts_engine.getProperty('voice')
            if hasattr(tts_engine, 'setProperty'):
                tts_engine.setProperty('pitch', pitch)
        except:
            pass
        
        tts_engine.save_to_file(text, filepath)
        tts_engine.runAndWait()
        
        # Cache the result
        cache_audio(cache_key, filepath)
        
        return filepath
    except Exception as e:
        print(f"pyttsx3 Error: {e}")
        return None

def get_available_voices() -> List[str]:
    """Get list of available voices for the current engine"""
    voices = ["default", "en", "en-us", "en-uk"]
    
    if PYTTSX3_AVAILABLE and tts_engine:
        try:
            system_voices = tts_engine.getProperty('voices')
            if system_voices:
                voices.extend([voice.name[:20] for voice in system_voices[:8]])  # Limit and truncate
        except:
            pass
    
    # Add gTTS language options
    if GTTS_AVAILABLE:
        voices.extend(["es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh"])
    
    return list(dict.fromkeys(voices))  # Remove duplicates while preserving order

def generate_live_preview(text: str, engine: str, voice: str, speed: float) -> Optional[str]:
    """Generate a short preview of the first few words"""
    if not text.strip() or not session_data["settings"]["live_preview"]:
        return None
    
    # Get first 10 words for preview
    words = text.split()[:10]
    preview_text = " ".join(words) + "..."
    
    if engine == "gtts" and GTTS_AVAILABLE:
        return generate_tts_gtts(preview_text, speed, voice)
    elif engine == "pyttsx3" and PYTTSX3_AVAILABLE:
        return generate_tts_pyttsx3(preview_text, speed, voice)
    
    return None

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
                    "content": f"You are an AI assistant helping with script writing and improvement. Current script context: {script_context[:500]}..."
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

def play_script(script_text: str, speed: float, volume: float, engine: str, voice: str, pitch: int) -> Tuple[Optional[str], str, Optional[str], str, str]:
    """Generate and return audio for the script with enhanced options"""
    if not script_text.strip():
        return None, "⚠️ No script text to convert to speech", None, "", ""
    
    # Update session settings
    session_data["settings"].update({
        "speed": speed,
        "volume": volume,
        "engine": engine,
        "voice": voice,
        "pitch": pitch
    })
    
    status_msg = f"🔄 Generating audio with {engine.upper()}... (Volume: {volume}%)"
    
    if engine == "gtts" and GTTS_AVAILABLE:
        audio_file = generate_tts_gtts(script_text, speed, voice)
    elif engine == "pyttsx3" and PYTTSX3_AVAILABLE:
        audio_file = generate_tts_pyttsx3(script_text, speed, voice, pitch)
    else:
        return None, "❌ Selected TTS engine not available", None, "", ""
    
    if audio_file and os.path.exists(audio_file):
        session_data["last_audio_file"] = audio_file
        session_data["audio_history"].append({
            "file": audio_file,
            "timestamp": datetime.now().isoformat(),
            "settings": session_data["settings"].copy()
        })
        
        file_info = get_audio_file_info(audio_file)
        success_msg = "✅ Audio generated successfully! Use the download button below to save the file."
        
        return audio_file, success_msg, audio_file, file_info, f"🎵 Ready to play • Volume: {volume}%"
    else:
        return None, "❌ Failed to generate audio", None, "", ""

def get_audio_download() -> Optional[str]:
    """Get the last generated audio file for download"""
    if session_data["last_audio_file"] and os.path.exists(session_data["last_audio_file"]):
        return session_data["last_audio_file"]
    return None

def cleanup_old_audio_files():
    """Clean up audio files older than 1 hour"""
    try:
        current_time = time.time()
        for directory in [AUDIO_DIR, CACHE_DIR]:
            for filename in os.listdir(directory):
                file_path = os.path.join(directory, filename)
                if os.path.isfile(file_path):
                    file_age = current_time - os.path.getmtime(file_path)
                    if file_age > 3600:  # 1 hour
                        os.remove(file_path)
    except Exception as e:
        print(f"Cleanup error: {e}")

def batch_generate_audio(scripts: List[str], settings: Dict) -> List[str]:
    """Generate audio for multiple scripts"""
    results = []
    for i, script in enumerate(scripts):
        if script.strip():
            audio_file = None
            if settings["engine"] == "gtts":
                audio_file = generate_tts_gtts(script, settings["speed"], settings["voice"])
            elif settings["engine"] == "pyttsx3":
                audio_file = generate_tts_pyttsx3(script, settings["speed"], settings["voice"], settings["pitch"])
            
            if audio_file:
                results.append(audio_file)
            else:
                results.append(f"Failed to generate audio for script {i+1}")
        else:
            results.append(f"Empty script {i+1}")
    
    return results

def auto_save_script(script: str, notes: str) -> str:
    """Auto-save script changes with debouncing"""
    if not session_data["settings"]["auto_save"]:
        return ""
    
    if not script.strip() and not notes.strip():
        return ""
    
    project_name = session_data["current_project"]
    if project_name not in session_data["projects"]:
        session_data["projects"][project_name] = initialize_project(project_name)
    
    session_data["projects"][project_name].update({
        "script": script,
        "notes": notes,
        "last_modified": datetime.now().isoformat()
    })
    
    # Save to file periodically
    try:
        with open("projects.json", "w") as f:
            json.dump(session_data["projects"], f, indent=2)
        return "💾 Auto-saved"
    except:
        return ""

def save_project(project_name: str, script: str, notes: str) -> str:
    """Save current project"""
    if not project_name.strip():
        return "❌ Please enter a project name"
    
    # Update session data
    session_data["projects"][project_name] = {
        "name": project_name,
        "script": script,
        "notes": notes,
        "created_at": datetime.now().isoformat(),
        "word_count": len(script.split()) if script.strip() else 0,
        "character_count": len(script),
        "is_sample": False
    }
    session_data["current_project"] = project_name
    
    # Save to file
    try:
        with open("projects.json", "w") as f:
            json.dump(session_data["projects"], f, indent=2)
        return f"✅ Project '{project_name}' saved successfully!"
    except Exception as e:
        return f"❌ Error saving project: {str(e)}"

def load_project(project_name: str) -> Tuple[str, str, str]:
    """Load a project"""
    if project_name in session_data["projects"]:
        project = session_data["projects"][project_name]
        session_data["current_project"] = project_name
        return project["script"], project["notes"], f"✅ Loaded project '{project_name}'"
    return "", "", f"❌ Project '{project_name}' not found"

def delete_project(project_name: str) -> Tuple[str, List[str]]:
    """Delete a project"""
    if project_name in session_data["projects"]:
        if session_data["projects"][project_name].get("is_sample", False):
            return "❌ Cannot delete sample projects", get_project_list()
        
        del session_data["projects"][project_name]
        
        # Save to file
        try:
            with open("projects.json", "w") as f:
                json.dump(session_data["projects"], f, indent=2)
            return f"✅ Project '{project_name}' deleted successfully!", get_project_list()
        except Exception as e:
            return f"❌ Error deleting project: {str(e)}", get_project_list()
    return f"❌ Project '{project_name}' not found", get_project_list()

def export_project(project_name: str) -> Optional[str]:
    """Export project as JSON file"""
    if project_name in session_data["projects"]:
        project = session_data["projects"][project_name]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"project_{project_name}_{timestamp}.json"
        filepath = os.path.join(AUDIO_DIR, filename)
        
        try:
            with open(filepath, "w") as f:
                json.dump(project, f, indent=2)
            return filepath
        except Exception as e:
            print(f"Export error: {e}")
            return None
    return None

def get_project_list() -> List[str]:
    """Get list of available projects"""
    return list(session_data["projects"].keys())

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

def toggle_auto_save(enabled: bool) -> str:
    """Toggle auto-save functionality"""
    session_data["settings"]["auto_save"] = enabled
    return f"✅ Auto-save {'enabled' if enabled else 'disabled'}"

def toggle_live_preview(enabled: bool) -> str:
    """Toggle live preview functionality"""
    session_data["settings"]["live_preview"] = enabled
    return f"✅ Live preview {'enabled' if enabled else 'disabled'}"

# Load existing projects and initialize samples on startup
try:
    if os.path.exists("projects.json"):
        with open("projects.json", "r") as f:
            session_data["projects"] = json.load(f)
except:
    pass

initialize_sample_scripts()

# Clean up old files on startup
cleanup_old_audio_files()

# Create Gradio interface
def create_interface():
    with gr.Blocks(title="ScriptVoice Pro - AI-Powered Script Editor", theme=gr.themes.Soft()) as app:
        gr.Markdown("# 🎭 ScriptVoice Pro - AI-Powered Script Editor")
        gr.Markdown("*Write, edit, and bring your scripts to life with advanced text-to-speech, AI assistance, and professional tools*")
        
        with gr.Row():
            with gr.Column(scale=1):
                # Project Management
                gr.Markdown("### 📁 Project Management")
                project_name_input = gr.Textbox(
                    label="Project Name",
                    placeholder="Enter project name...",
                    value="default"
                )
                
                with gr.Row():
                    save_btn = gr.Button("💾 Save", variant="primary")
                    load_btn = gr.Button("📂 Load")
                    delete_btn = gr.Button("🗑️ Delete", variant="stop")
                    export_btn = gr.Button("📤 Export")
                
                project_status = gr.Markdown("Ready to create your script!")
                auto_save_status = gr.Markdown("")
                
                # Project List with samples
                project_dropdown = gr.Dropdown(
                    label="Available Projects (📘 = Sample)",
                    choices=[f"📘 {name}" if session_data["projects"].get(name, {}).get("is_sample") else name 
                            for name in get_project_list()],
                    interactive=True
                )
                
                # Settings Panel
                gr.Markdown("### ⚙️ Settings")
                
                with gr.Group():
                    auto_save_toggle = gr.Checkbox(
                        label="Auto-save changes",
                        value=session_data["settings"]["auto_save"]
                    )
                    
                    live_preview_toggle = gr.Checkbox(
                        label="Live preview (first 10 words)",
                        value=session_data["settings"]["live_preview"]
                    )
                
                # API Configuration
                gr.Markdown("### 🔑 AI Configuration")
                
                with gr.Group():
                    ionos_api_input = gr.Textbox(
                        label="IONOS AI API Key",
                        placeholder="Enter your IONOS API key...",
                        type="password",
                        value=session_data["api_keys"]["ionos_api_key"]
                    )
                    
                    set_ionos_btn = gr.Button("Set IONOS Key", size="sm")
                    api_status = gr.Markdown("")
                
                # Enhanced Audio Controls
                gr.Markdown("### 🔊 Audio Controls")
                
                with gr.Group():
                    engine_dropdown = gr.Dropdown(
                        label="TTS Engine",
                        choices=["gtts", "pyttsx3"],
                        value="gtts"
                    )
                    
                    voice_dropdown = gr.Dropdown(
                        label="Voice/Language",
                        choices=get_available_voices(),
                        value="en"
                    )
                    
                    with gr.Row():
                        speed_slider = gr.Slider(
                            minimum=0.5,
                            maximum=2.0,
                            value=1.0,
                            step=0.1,
                            label="Speech Speed"
                        )
                        
                        volume_slider = gr.Slider(
                            minimum=0,
                            maximum=100,
                            value=80,
                            step=5,
                            label="Volume (%)"
                        )
                    
                    pitch_slider = gr.Slider(
                        minimum=-50,
                        maximum=50,
                        value=0,
                        step=5,
                        label="Pitch Adjustment",
                        visible=False
                    )
                
                with gr.Row():
                    play_btn = gr.Button("🎵 Generate Audio", variant="primary", scale=2)
                    preview_btn = gr.Button("👂 Preview", variant="secondary", scale=1)
                    download_btn = gr.Button("⬇️ Download", variant="secondary", scale=1)
                
                # Audio Player and Status
                audio_output = gr.Audio(
                    label="Generated Audio", 
                    show_download_button=True,
                    interactive=True
                )
                audio_status = gr.Markdown("Click 'Generate Audio' to create speech from your script")
                
                # Download Information
                download_info = gr.Markdown("")
                download_file = gr.File(label="Download Audio", visible=False)
                playback_status = gr.Markdown("")
                
            with gr.Column(scale=2):
                # Tutorial/Demo Banner
                with gr.Group():
                    gr.Markdown("""
                    ### 🚀 Quick Start Guide
                    1. **Load a sample**: Select a sample script from the dropdown
                    2. **Edit**: Modify the script in the editor below
                    3. **Generate**: Click 'Generate Audio' to hear your script
                    4. **Improve**: Use AI assistant for suggestions and improvements
                    """)
                
                # Main Script Editor
                gr.Markdown("### ✍️ Script Editor")
                script_editor = gr.Textbox(
                    label="Write your script here...",
                    placeholder="Start writing your script or load a sample...",
                    lines=15,
                    max_lines=25
                )
                
                # Word Count Display
                with gr.Row():
                    word_count_display = gr.Markdown("**Words:** 0 | **Characters:** 0")
                    reading_time_display = gr.Markdown("**Estimated reading time:** 0 min")
                    tts_duration_display = gr.Markdown("**TTS Duration:** ~0 min")
                
                # Performance Indicators
                with gr.Row():
                    cache_status = gr.Markdown("🗂️ **Cache:** Ready")
                    generation_status = gr.Markdown("⚡ **Status:** Ready")
                
                # Notes Section
                gr.Markdown("### 📝 Project Notes")
                notes_editor = gr.Textbox(
                    label="Notes & Comments",
                    placeholder="Add your project notes, ideas, or improvements here...",
                    lines=5
                )
                
            with gr.Column(scale=1):
                # AI Chat Interface
                gr.Markdown("### 🤖 AI Assistant")
                chat_history = gr.Chatbot(
                    label="Chat with AI",
                    height=350,
                    show_copy_button=True
                )
                
                chat_input = gr.Textbox(
                    label="Ask AI for help",
                    placeholder="How can I improve this script?",
                    lines=2
                )
                
                with gr.Row():
                    chat_btn = gr.Button("💬 Send")
                    clear_chat_btn = gr.Button("🗑️ Clear")
                
                # Enhanced Quick Actions
                gr.Markdown("### ⚡ Quick Actions")
                with gr.Column():
                    improve_btn = gr.Button("✨ Improve Script")
                    professional_btn = gr.Button("💼 Make Professional")
                    dramatic_btn = gr.Button("🎭 Add Drama")
                    romantic_btn = gr.Button("💕 Make Romantic")
                    continue_btn = gr.Button("📖 Continue Story")
                    summarize_btn = gr.Button("📋 Summarize")
                
                # Batch Operations
                gr.Markdown("### 🔄 Batch Operations")
                with gr.Column():
                    batch_input = gr.Textbox(
                        label="Scripts (one per line)",
                        placeholder="Enter multiple scripts...",
                        lines=3
                    )
                    batch_btn = gr.Button("🎵 Generate All", variant="secondary")
                    batch_status = gr.Markdown("")
        
        # Event handlers with enhanced functionality
        def update_interface_on_text_change(text):
            word_info, reading_info, tts_info = update_word_count(text)
            auto_save_info = auto_save_script(text, "")
            
            # Update cache status
            cache_info = f"🗂️ **Cache:** {len(session_data['audio_cache'])} files cached"
            
            return word_info, reading_info, tts_info, auto_save_info, cache_info
        
        script_editor.change(
            fn=update_interface_on_text_change,
            inputs=[script_editor],
            outputs=[word_count_display, reading_time_display, tts_duration_display, auto_save_status, cache_status]
        )
        
        # Show/hide pitch control based on engine
        def update_engine_controls(engine):
            return gr.update(visible=(engine == "pyttsx3"))
        
        engine_dropdown.change(
            fn=update_engine_controls,
            inputs=[engine_dropdown],
            outputs=[pitch_slider]
        )
        
        # Enhanced project loading with sample handling
        def load_project_enhanced(project_name):
            # Remove sample indicator if present
            clean_name = project_name.replace("📘 ", "") if project_name.startswith("📘") else project_name
            return load_project(clean_name)
        
        play_btn.click(
            fn=play_script,
            inputs=[script_editor, speed_slider, volume_slider, engine_dropdown, voice_dropdown, pitch_slider],
            outputs=[audio_output, audio_status, download_file, download_info, playback_status]
        )
        
        # Preview functionality
        def generate_preview(text, engine, voice, speed):
            preview_file = generate_live_preview(text, engine, voice, speed)
            if preview_file:
                return preview_file, "🔊 Preview ready (first 10 words)"
            return None, "❌ Preview generation failed"
        
        preview_btn.click(
            fn=generate_preview,
            inputs=[script_editor, engine_dropdown, voice_dropdown, speed_slider],
            outputs=[audio_output, audio_status]
        )
        
        download_btn.click(
            fn=get_audio_download,
            outputs=[download_file]
        )
        
        save_btn.click(
            fn=save_project,
            inputs=[project_name_input, script_editor, notes_editor],
            outputs=[project_status]
        )
        
        load_btn.click(
            fn=load_project_enhanced,
            inputs=[project_dropdown],
            outputs=[script_editor, notes_editor, project_status]
        )
        
        # Delete project functionality
        def delete_project_handler(project_name):
            clean_name = project_name.replace("📘 ", "") if project_name.startswith("📘") else project_name
            status, updated_list = delete_project(clean_name)
            choices = [f"📘 {name}" if session_data["projects"].get(name, {}).get("is_sample") else name 
                      for name in updated_list]
            return status, gr.update(choices=choices)
        
        delete_btn.click(
            fn=delete_project_handler,
            inputs=[project_dropdown],
            outputs=[project_status, project_dropdown]
        )
        
        # Export project functionality
        def export_project_handler(project_name):
            clean_name = project_name.replace("📘 ", "") if project_name.startswith("📘") else project_name
            export_file = export_project(clean_name)
            if export_file:
                return f"✅ Project exported successfully!", export_file
            return "❌ Export failed", None
        
        export_btn.click(
            fn=export_project_handler,
            inputs=[project_dropdown],
            outputs=[project_status, download_file]
        )
        
        # API key management
        set_ionos_btn.click(
            fn=lambda key: set_api_key("ionos_api_key", key),
            inputs=[ionos_api_input],
            outputs=[api_status]
        )
        
        # Settings handlers
        auto_save_toggle.change(
            fn=toggle_auto_save,
            inputs=[auto_save_toggle],
            outputs=[auto_save_status]
        )
        
        live_preview_toggle.change(
            fn=toggle_live_preview,
            inputs=[live_preview_toggle],
            outputs=[generation_status]
        )
        
        # Chat functionality
        chat_btn.click(
            fn=chat_with_ai,
            inputs=[chat_input, chat_history, script_editor],
            outputs=[chat_history, chat_input]
        )
        
        clear_chat_btn.click(
            fn=lambda: [],
            outputs=[chat_history]
        )
        
        # Enhanced quick action handlers
        improve_btn.click(
            fn=quick_action_improve,
            inputs=[script_editor, chat_history],
            outputs=[chat_history, chat_input]
        )
        
        professional_btn.click(
            fn=quick_action_professional,
            inputs=[script_editor, chat_history],
            outputs=[chat_history, chat_input]
        )
        
        romantic_btn.click(
            fn=quick_action_romantic,
            inputs=[script_editor, chat_history],
            outputs=[chat_history, chat_input]
        )
        
        dramatic_btn.click(
            fn=quick_action_dramatic,
            inputs=[script_editor, chat_history],
            outputs=[chat_history, chat_input]
        )
        
        continue_btn.click(
            fn=quick_action_continue,
            inputs=[script_editor, chat_history],
            outputs=[chat_history, chat_input]
        )
        
        summarize_btn.click(
            fn=quick_action_summarize,
            inputs=[script_editor, chat_history],
            outputs=[chat_history, chat_input]
        )
        
        # Batch processing
        def batch_process_scripts(batch_text):
            if not batch_text.strip():
                return "❌ No scripts provided"
            
            scripts = [line.strip() for line in batch_text.split('\n') if line.strip()]
            if not scripts:
                return "❌ No valid scripts found"
            
            settings = session_data["settings"]
            results = batch_generate_audio(scripts, settings)
            
            success_count = sum(1 for r in results if not r.startswith("Failed"))
            return f"✅ Processed {len(scripts)} scripts. {success_count} successful, {len(scripts) - success_count} failed."
        
        batch_btn.click(
            fn=batch_process_scripts,
            inputs=[batch_input],
            outputs=[batch_status]
        )
    
    return app

if __name__ == "__main__":
    app = create_interface()
    app.launch(
        share=True,
        debug=True,
        server_name="0.0.0.0",
        server_port=7860,
        favicon_path=None,
        show_error=True
    )
