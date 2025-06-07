
import gradio as gr
import os
from datetime import datetime
from typing import Tuple, Optional

from core.config import APP_NAME, APP_DESCRIPTION, session_data
from core.utils import update_word_count, get_audio_file_info, cleanup_old_audio_files
from services.tts_service import (
    generate_tts_gtts, generate_tts_pyttsx3, get_available_voices, 
    generate_live_preview, batch_generate_audio, GTTS_AVAILABLE, PYTTSX3_AVAILABLE
)
from services.project_service import (
    save_project, load_project, delete_project, export_project, 
    get_project_list, auto_save_script, toggle_auto_save, toggle_live_preview
)
from services.ai_service import (
    chat_with_ai, set_api_key, quick_action_improve, quick_action_professional,
    quick_action_dramatic, quick_action_romantic, quick_action_continue, 
    quick_action_summarize
)

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

def create_interface():
    """Create the main Gradio interface for Wolf AI"""
    with gr.Blocks(title=f"{APP_NAME} - AI-Powered Script Editor", theme=gr.themes.Soft()) as app:
        gr.Markdown(f"# 🐺 {APP_NAME} - AI-Powered Script Editor")
        gr.Markdown(f"*{APP_DESCRIPTION} - Write, edit, and bring your scripts to life with advanced text-to-speech, AI assistance, and professional tools*")
        
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
                    gr.Markdown(f"""
                    ### 🚀 Quick Start Guide - {APP_NAME}
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
        
        # Setup event handlers
        setup_event_handlers(
            script_editor, notes_editor, word_count_display, reading_time_display, 
            tts_duration_display, auto_save_status, cache_status, generation_status,
            engine_dropdown, pitch_slider, play_btn, preview_btn, download_btn,
            speed_slider, volume_slider, voice_dropdown, audio_output, audio_status,
            download_file, download_info, playback_status, project_name_input,
            save_btn, load_btn, delete_btn, export_btn, project_status, project_dropdown,
            ionos_api_input, set_ionos_btn, api_status, auto_save_toggle, live_preview_toggle,
            chat_input, chat_history, chat_btn, clear_chat_btn, improve_btn, professional_btn,
            dramatic_btn, romantic_btn, continue_btn, summarize_btn, batch_input, batch_btn,
            batch_status
        )
    
    return app

def setup_event_handlers(*components):
    """Setup all event handlers for the interface"""
    # Unpack all components
    (script_editor, notes_editor, word_count_display, reading_time_display, 
     tts_duration_display, auto_save_status, cache_status, generation_status,
     engine_dropdown, pitch_slider, play_btn, preview_btn, download_btn,
     speed_slider, volume_slider, voice_dropdown, audio_output, audio_status,
     download_file, download_info, playback_status, project_name_input,
     save_btn, load_btn, delete_btn, export_btn, project_status, project_dropdown,
     ionos_api_input, set_ionos_btn, api_status, auto_save_toggle, live_preview_toggle,
     chat_input, chat_history, chat_btn, clear_chat_btn, improve_btn, professional_btn,
     dramatic_btn, romantic_btn, continue_btn, summarize_btn, batch_input, batch_btn,
     batch_status) = components
    
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
