
import gradio as gr
import os
import json
import tempfile
from typing import Dict, List, Tuple, Optional
import time
from datetime import datetime
import shutil

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
    from dotenv import load_dotenv
    load_dotenv()
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False

# Create audio output directory
AUDIO_DIR = "generated_audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

# Global state for session management
session_data = {
    "projects": {},
    "current_project": "default",
    "settings": {
        "voice": "en",
        "speed": 1.0,
        "volume": 80,
        "engine": "gtts"
    },
    "last_audio_file": None
}

# Initialize TTS engines
tts_engine = None
if PYTTSX3_AVAILABLE:
    try:
        tts_engine = pyttsx3.init()
    except:
        tts_engine = None

def initialize_project(project_name: str = "default") -> Dict:
    """Initialize a new project with default structure"""
    return {
        "name": project_name,
        "script": "",
        "notes": "",
        "created_at": datetime.now().isoformat(),
        "word_count": 0,
        "character_count": 0
    }

def update_word_count(text: str) -> Tuple[str, str]:
    """Update word and character count display"""
    words = len(text.split()) if text.strip() else 0
    chars = len(text)
    
    # Update session data
    if session_data["current_project"] in session_data["projects"]:
        session_data["projects"][session_data["current_project"]]["word_count"] = words
        session_data["projects"][session_data["current_project"]]["character_count"] = chars
    
    return (
        f"**Words:** {words} | **Characters:** {chars}",
        f"**Estimated reading time:** {max(1, words // 200)} min"
    )

def generate_tts_gtts(text: str, speed: float = 1.0) -> Optional[str]:
    """Generate TTS using Google Text-to-Speech"""
    if not GTTS_AVAILABLE or not text.strip():
        return None
    
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"script_audio_{timestamp}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)
        
        tts = gTTS(text=text, lang='en', slow=(speed < 0.8))
        tts.save(filepath)
        
        return filepath
    except Exception as e:
        print(f"TTS Error: {e}")
        return None

def generate_tts_pyttsx3(text: str, speed: float = 1.0) -> Optional[str]:
    """Generate TTS using pyttsx3"""
    if not PYTTSX3_AVAILABLE or not tts_engine or not text.strip():
        return None
    
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"script_audio_{timestamp}.wav"
        filepath = os.path.join(AUDIO_DIR, filename)
        
        # Set properties
        tts_engine.setProperty('rate', int(200 * speed))
        tts_engine.save_to_file(text, filepath)
        tts_engine.runAndWait()
        
        return filepath
    except Exception as e:
        print(f"TTS Error: {e}")
        return None

def play_script(script_text: str, speed: float, volume: float, engine: str) -> Tuple[Optional[str], str, Optional[str], str]:
    """Generate and return audio for the script with download option"""
    if not script_text.strip():
        return None, "⚠️ No script text to convert to speech", None, ""
    
    status_msg = f"🔄 Generating audio with {engine.upper()}..."
    
    if engine == "gtts" and GTTS_AVAILABLE:
        audio_file = generate_tts_gtts(script_text, speed)
    elif engine == "pyttsx3" and PYTTSX3_AVAILABLE:
        audio_file = generate_tts_pyttsx3(script_text, speed)
    else:
        return None, "❌ Selected TTS engine not available", None, ""
    
    if audio_file and os.path.exists(audio_file):
        session_data["last_audio_file"] = audio_file
        file_size = os.path.getsize(audio_file) / 1024  # KB
        download_info = f"📁 **Audio File:** {os.path.basename(audio_file)} ({file_size:.1f} KB)"
        return audio_file, "✅ Audio generated successfully!", audio_file, download_info
    else:
        return None, "❌ Failed to generate audio", None, ""

def get_audio_download() -> Optional[str]:
    """Get the last generated audio file for download"""
    if session_data["last_audio_file"] and os.path.exists(session_data["last_audio_file"]):
        return session_data["last_audio_file"]
    return None

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
        "character_count": len(script)
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

def get_project_list() -> List[str]:
    """Get list of available projects"""
    return list(session_data["projects"].keys())

def chat_with_ai(message: str, history: List, script_context: str) -> Tuple[List, str]:
    """Handle AI chat interactions"""
    if not AI_AVAILABLE:
        history.append((message, "❌ AI functionality not available. Please set up OpenAI API key."))
        return history, ""
    
    try:
        # Add script context to the message
        context_message = f"Current script context:\n{script_context}\n\nUser message: {message}"
        
        # This is a placeholder - replace with actual AI API call
        response = f"🤖 AI Response to: {message}\n\nI can help you improve your script! Here are some suggestions based on your current content."
        
        history.append((message, response))
        return history, ""
    except Exception as e:
        history.append((message, f"❌ AI Error: {str(e)}"))
        return history, ""

def quick_action_improve(script: str, chat_history: List) -> Tuple[List, str]:
    """Quick action: Improve script"""
    return chat_with_ai("Please improve this script for better flow and readability", chat_history, script)

def quick_action_romantic(script: str, chat_history: List) -> Tuple[List, str]:
    """Quick action: Rewrite in romantic tone"""
    return chat_with_ai("Rewrite this script in a more romantic tone", chat_history, script)

def quick_action_dramatic(script: str, chat_history: List) -> Tuple[List, str]:
    """Quick action: Add dramatic pauses"""
    return chat_with_ai("Add dramatic pauses and emphasis to this script for better TTS delivery", chat_history, script)

def quick_action_continue(script: str, chat_history: List) -> Tuple[List, str]:
    """Quick action: Continue story"""
    return chat_with_ai("Continue this story with an engaging next paragraph", chat_history, script)

# Load existing projects on startup
try:
    if os.path.exists("projects.json"):
        with open("projects.json", "r") as f:
            session_data["projects"] = json.load(f)
except:
    pass

# Create Gradio interface
def create_interface():
    with gr.Blocks(title="ScriptVoice - AI-Powered Script Editor", theme=gr.themes.Soft()) as app:
        gr.Markdown("# 🎭 ScriptVoice - AI-Powered Script Editor")
        gr.Markdown("*Write, edit, and bring your scripts to life with text-to-speech and AI assistance*")
        
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
                
                project_status = gr.Markdown("Ready to create your script!")
                
                # Project List
                project_dropdown = gr.Dropdown(
                    label="Existing Projects",
                    choices=get_project_list(),
                    interactive=True
                )
                
                # Enhanced Audio Controls
                gr.Markdown("### 🔊 Audio Controls")
                
                with gr.Group():
                    engine_dropdown = gr.Dropdown(
                        label="TTS Engine",
                        choices=["gtts", "pyttsx3"],
                        value="gtts"
                    )
                    
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
                
                with gr.Row():
                    play_btn = gr.Button("🎵 Generate Audio", variant="secondary", scale=2)
                    download_btn = gr.Button("⬇️ Download", variant="outline", scale=1)
                
                # Audio Player and Status
                audio_output = gr.Audio(label="Generated Audio", show_download_button=True)
                audio_status = gr.Markdown("Click 'Generate Audio' to create speech from your script")
                
                # Download Information
                download_info = gr.Markdown("")
                download_file = gr.File(label="Download Audio", visible=False)
                
            with gr.Column(scale=2):
                # Main Script Editor
                gr.Markdown("### ✍️ Script Editor")
                script_editor = gr.Textbox(
                    label="Write your script here...",
                    placeholder="Start writing your script...",
                    lines=15,
                    max_lines=20
                )
                
                # Word Count Display
                with gr.Row():
                    word_count_display = gr.Markdown("**Words:** 0 | **Characters:** 0")
                    reading_time_display = gr.Markdown("**Estimated reading time:** 0 min")
                
                # Notes Section
                gr.Markdown("### 📝 Project Notes")
                notes_editor = gr.Textbox(
                    label="Notes",
                    placeholder="Add your project notes here...",
                    lines=5
                )
                
            with gr.Column(scale=1):
                # AI Chat Interface
                gr.Markdown("### 🤖 AI Assistant")
                chat_history = gr.Chatbot(
                    label="Chat with AI",
                    height=300
                )
                
                chat_input = gr.Textbox(
                    label="Ask AI for help",
                    placeholder="How can I improve this script?",
                    lines=2
                )
                
                with gr.Row():
                    chat_btn = gr.Button("💬 Send")
                    clear_chat_btn = gr.Button("🗑️ Clear")
                
                # Quick Actions
                gr.Markdown("### ⚡ Quick Actions")
                with gr.Column():
                    improve_btn = gr.Button("✨ Improve Script")
                    romantic_btn = gr.Button("💕 Make Romantic")
                    dramatic_btn = gr.Button("🎭 Add Drama")
                    continue_btn = gr.Button("📖 Continue Story")
        
        # Event handlers
        script_editor.change(
            fn=update_word_count,
            inputs=[script_editor],
            outputs=[word_count_display, reading_time_display]
        )
        
        play_btn.click(
            fn=play_script,
            inputs=[script_editor, speed_slider, volume_slider, engine_dropdown],
            outputs=[audio_output, audio_status, download_file, download_info]
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
            fn=load_project,
            inputs=[project_dropdown],
            outputs=[script_editor, notes_editor, project_status]
        )
        
        chat_btn.click(
            fn=chat_with_ai,
            inputs=[chat_input, chat_history, script_editor],
            outputs=[chat_history, chat_input]
        )
        
        clear_chat_btn.click(
            fn=lambda: [],
            outputs=[chat_history]
        )
        
        # Quick action handlers
        improve_btn.click(
            fn=quick_action_improve,
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
    
    return app

if __name__ == "__main__":
    app = create_interface()
    app.launch(
        share=True,
        debug=True,
        server_name="0.0.0.0",
        server_port=7860
    )
