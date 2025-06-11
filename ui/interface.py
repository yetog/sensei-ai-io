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
    quick_action_summarize, quick_action_enhance, quick_action_translate
)

def play_script(script_text: str, speed: float, volume: float, engine: str, voice: str, pitch: int) -> Tuple[Optional[str], str, str, str]:
    """Generate and return audio for the script with enhanced options"""
    if not script_text.strip():
        return None, "⚠️ No script text to convert to speech", "", ""
    
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
        return None, "❌ Selected TTS engine not available", "", ""
    
    if audio_file and os.path.exists(audio_file):
        session_data["last_audio_file"] = audio_file
        session_data["audio_history"].append({
            "file": audio_file,
            "timestamp": datetime.now().isoformat(),
            "settings": session_data["settings"].copy()
        })
        
        file_info = get_audio_file_info(audio_file)
        success_msg = "✅ Audio generated successfully! Use the download button below the audio player."
        
        return audio_file, success_msg, file_info, f"🎵 Ready to play"
    else:
        return None, "❌ Failed to generate audio", "", ""

def save_project_enhanced(project_name: str, script: str, notes: str) -> Tuple[str, list]:
    """Enhanced project save with proper feedback and list update"""
    result = save_project(project_name, script, notes)
    updated_list = [f"📘 {name}" if session_data["projects"].get(name, {}).get("is_sample") else name 
                   for name in get_project_list()]
    return result, gr.update(choices=updated_list, value=project_name)

def load_project_enhanced(project_name: str) -> Tuple[str, str, str, str]:
    """Enhanced project load with proper feedback"""
    clean_name = project_name.replace("📘 ", "") if project_name and project_name.startswith("📘") else project_name
    script, notes, status = load_project(clean_name)
    return script, notes, status, clean_name

def create_highlighted_text(script_text: str, current_word: int = 0) -> str:
    """Create highlighted version of script for audio follow-along"""
    if not script_text.strip():
        return ""
    
    words = script_text.split()
    if current_word >= len(words):
        return script_text
    
    highlighted_words = []
    for i, word in enumerate(words):
        if i == current_word:
            highlighted_words.append(f'<span style="background-color: #FFD700; color: #000; padding: 2px 4px; border-radius: 3px; font-weight: bold;">{word}</span>')
        elif i < current_word:
            highlighted_words.append(f'<span style="color: #888;">{word}</span>')
        else:
            highlighted_words.append(word)
    
    return " ".join(highlighted_words)

def start_audio_followalong(script_text: str) -> str:
    """Start audio follow-along highlighting"""
    if not script_text.strip():
        return ""
    
    # Calculate timing for word progression
    words = script_text.split()
    word_count = len(words)
    
    # Estimate reading speed (words per minute) based on settings
    reading_speed = 150 * session_data["settings"].get("speed", 1.0)  # Adjust for speed setting
    
    # Create initial highlighted text
    return create_highlighted_text(script_text, 0)

def create_interface():
    """Create the main Gradio interface for Wolf AI"""
    # Custom CSS for modern, dark theme with improved collapsibles and fullscreen chat
    custom_css = """
    .gradio-container {
        background: linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%);
        color: #ffffff;
    }
    
    .dark {
        background: #0c0c0c;
        color: #ffffff;
    }
    
    .header-section {
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
    }
    
    .control-panel {
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 15px;
    }
    
    .main-editor {
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
    }
    
    .sidebar-panel {
        background: #151515;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 15px;
    }
    
    .audio-controls {
        background: #1a1a1a;
        border: 1px solid #444;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
    }
    
    .fullscreen-chat {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 9999 !important;
        background: #0c0c0c !important;
        padding: 20px !important;
    }
    
    .resizable-editor {
        resize: vertical !important;
        min-height: 200px !important;
        max-height: 800px !important;
    }
    
    .highlighted-text {
        background-color: #FFD700 !important;
        color: #000 !important;
        padding: 2px 4px !important;
        border-radius: 3px !important;
        font-weight: bold !important;
    }
    
    .patch-notes {
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
    }
    
    .patch-section {
        margin-bottom: 15px;
        padding: 10px;
        background: #222;
        border-radius: 6px;
        border-left: 3px solid #FFD700;
    }
    
    button {
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.2s ease;
    }
    
    .primary-btn {
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        color: #000;
        border: none;
    }
    
    .primary-btn:hover {
        background: linear-gradient(135deg, #FFED4A 0%, #FFB84D 100%);
        transform: translateY(-1px);
    }
    
    .secondary-btn {
        background: #333;
        color: #fff;
        border: 1px solid #555;
    }
    
    .secondary-btn:hover {
        background: #444;
        border-color: #666;
    }
    
    .quick-action-btn {
        background: #2a2a2a;
        color: #fff;
        border: 1px solid #444;
        margin: 2px;
    }
    
    .quick-action-btn:hover {
        background: #3a3a3a;
        border-color: #666;
    }
    """
    
    with gr.Blocks(
        title=f"{APP_NAME} - AI-Powered Script Editor", 
        theme=gr.themes.Base(primary_hue="yellow", secondary_hue="gray"),
        css=custom_css
    ) as app:
        
        # Header Section - Compact and modern
        with gr.Row(elem_classes="header-section"):
            with gr.Column(scale=2):
                gr.HTML(f"""
                <div style="display: flex; align-items: center; gap: 15px;">
                    <h1 style="margin: 0; font-size: 2rem; font-weight: bold; color: #FFD700;">
                        🐺 {APP_NAME}
                    </h1>
                    <span style="color: #ccc; font-size: 1rem;">AI-Powered Script Editor & Voice Generator v2.1</span>
                </div>
                """)
            
            with gr.Column(scale=1):
                # Compact stats display
                stats_display = gr.HTML("""
                <div style="text-align: right; color: #ccc;">
                    <div>Words: 0 | Characters: 0</div>
                    <div>Estimated TTS: ~0 min</div>
                </div>
                """)
        
        # Main Content Layout
        with gr.Row():
            # Left Sidebar - Controls & Settings
            with gr.Column(scale=1, elem_classes="sidebar-panel"):
                
                # Audio Controls - Collapsible
                with gr.Accordion("🎵 Audio Controls", open=True):
                    with gr.Group(elem_classes="control-panel"):
                        with gr.Row():
                            engine_dropdown = gr.Dropdown(
                                label="Engine",
                                choices=["gtts", "pyttsx3"],
                                value="gtts",
                                scale=1
                            )
                            
                            voice_dropdown = gr.Dropdown(
                                label="Voice",
                                choices=get_available_voices(),
                                value="en",
                                scale=2
                            )
                        
                        with gr.Row():
                            speed_slider = gr.Slider(
                                minimum=0.5,
                                maximum=2.0,
                                value=1.0,
                                step=0.1,
                                label="Speed",
                                scale=1
                            )
                            
                            volume_slider = gr.Slider(
                                minimum=0,
                                maximum=100,
                                value=80,
                                step=5,
                                label="Volume",
                                scale=1
                            )
                        
                        pitch_slider = gr.Slider(
                            minimum=-50,
                            maximum=50,
                            value=0,
                            step=5,
                            label="Pitch",
                            visible=False
                        )
                    
                    # Primary Action Buttons
                    with gr.Row():
                        play_btn = gr.Button("🎵 Generate Audio", variant="primary", scale=2, elem_classes="primary-btn")
                    
                    # Audio Player with built-in download functionality
                    audio_output = gr.Audio(
                        label="Generated Audio", 
                        show_download_button=True,
                        interactive=True
                    )
                    audio_status = gr.Markdown("Ready to generate audio")
                
                # Project Management - Enhanced
                with gr.Accordion("📁 Project Management", open=False):
                    project_name_input = gr.Textbox(
                        label="Project Name",
                        placeholder="Enter project name...",
                        value=""
                    )
                    
                    project_dropdown = gr.Dropdown(
                        label="Load Project",
                        choices=[f"📘 {name}" if session_data["projects"].get(name, {}).get("is_sample") else name 
                                for name in get_project_list()],
                        interactive=True
                    )
                    
                    with gr.Row():
                        save_btn = gr.Button("💾 Save Project", size="sm")
                        load_btn = gr.Button("📂 Load Project", size="sm")
                        export_btn = gr.Button("📤 Export", size="sm")
                    
                    project_status = gr.Markdown("Ready")
                
                # Settings
                with gr.Accordion("⚙️ Settings", open=False):
                    auto_save_toggle = gr.Checkbox(
                        label="Auto-save changes",
                        value=session_data["settings"]["auto_save"]
                    )
                    
                    live_preview_toggle = gr.Checkbox(
                        label="Live preview (Note: May not work for long scripts)",
                        value=session_data["settings"]["live_preview"]
                    )
                    
                    # Script Editor Size Controls
                    editor_height = gr.Slider(
                        minimum=200,
                        maximum=800,
                        value=400,
                        step=50,
                        label="Script Editor Height (px)"
                    )
                    
                    auto_save_status = gr.Markdown("")
                
                # Patch Notes & Roadmap - Replacing Batch Operations
                with gr.Accordion("📋 Patch Notes & Roadmap", open=False):
                    patch_notes_html = gr.HTML("""
                    <div class="patch-notes">
                        <div class="patch-section">
                            <h4 style="color: #FFD700; margin: 0 0 8px 0;">🎯 Current Version (v2.1)</h4>
                            <ul style="margin: 0; padding-left: 20px; color: #ccc;">
                                <li>AI-powered script improvement</li>
                                <li>Multi-voice TTS generation (gTTS & pyttsx3)</li>
                                <li>Project save/load system</li>
                                <li>Real-time chat assistant</li>
                                <li>Fullscreen chat mode</li>
                            </ul>
                        </div>
                        
                        <div class="patch-section">
                            <h4 style="color: #4CAF50; margin: 0 0 8px 0;">✅ Recent Fixes</h4>
                            <ul style="margin: 0; padding-left: 20px; color: #ccc;">
                                <li>Fixed project management save/load issues</li>
                                <li>Enhanced script editor with size controls</li>
                                <li>Added fullscreen chat functionality</li>
                                <li>Streamlined download using built-in audio controls</li>
                                <li>Improved agent system integration</li>
                            </ul>
                        </div>
                        
                        <div class="patch-section">
                            <h4 style="color: #FF9800; margin: 0 0 8px 0;">⚠️ Known Issues</h4>
                            <ul style="margin: 0; padding-left: 20px; color: #ccc;">
                                <li>Audio follow-along text highlighting not working</li>
                                <li>Batch processing temporarily disabled</li>
                                <li>Some voice options may vary by browser</li>
                                <li>Large scripts may have slower processing</li>
                            </ul>
                        </div>
                        
                        <div class="patch-section">
                            <h4 style="color: #2196F3; margin: 0 0 8px 0;">🚀 Coming Soon</h4>
                            <ul style="margin: 0; padding-left: 20px; color: #ccc;">
                                <li>Fix for audio follow-along highlighting</li>
                                <li>ElevenLabs integration for premium voices</li>
                                <li>Batch script processing</li>
                                <li>Audio-to-text transcription</li>
                                <li>Advanced pronunciation controls</li>
                                <li>Export to multiple audio formats</li>
                                <li>Cloud project sync</li>
                            </ul>
                        </div>
                        
                        <div class="patch-section">
                            <h4 style="color: #9C27B0; margin: 0 0 8px 0;">🔮 Future Roadmap</h4>
                            <ul style="margin: 0; padding-left: 20px; color: #ccc;">
                                <li>Multi-language script translation</li>
                                <li>Voice cloning capabilities</li>
                                <li>Real-time collaboration</li>
                                <li>Mobile app companion</li>
                                <li>Advanced AI script analysis</li>
                            </ul>
                        </div>
                    </div>
                    """)
                
                # Hidden components for internal use
                download_file = gr.File(label="Download", visible=False)
                download_info = gr.Markdown("", visible=False)
                playback_status = gr.Markdown("", visible=False)
                cache_status = gr.Markdown("", visible=False)
                generation_status = gr.Markdown("", visible=False)
                
            # Main Editor - Center
            with gr.Column(scale=2, elem_classes="main-editor"):
                
                # Quick Start Guide
                with gr.Group():
                    gr.HTML(f"""
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; border: 1px solid #333; margin-bottom: 15px;">
                        <h3 style="margin: 0 0 10px 0; color: #FFD700;">🚀 Quick Start</h3>
                        <div style="color: #ccc; font-size: 0.9rem;">
                            1. Load a sample script or start writing<br>
                            2. Select voice and adjust settings in Audio Controls<br>
                            3. Click 'Generate Audio' to create TTS<br>
                            4. Use the download button on the audio player
                        </div>
                    </div>
                    """)
                
                # Main Script Editor with resizable controls
                script_editor = gr.Textbox(
                    label="Script Editor",
                    placeholder="Start writing your script or load a sample...",
                    lines=20,
                    max_lines=40,
                    show_label=False,
                    elem_classes="resizable-editor"
                )
                
                # Audio Follow-Along Display
                highlighted_script = gr.HTML(
                    value="",
                    label="🎯 Audio Follow-Along",
                    visible=False
                )
                
                # Notes Section
                with gr.Accordion("📝 Notes & Comments", open=False):
                    notes_editor = gr.Textbox(
                        label="Project Notes",
                        placeholder="Add your notes, ideas, or improvements...",
                        lines=4
                    )
                
                # Performance indicators (compact)
                reading_time_display = gr.Markdown("", visible=False)
                tts_duration_display = gr.Markdown("", visible=False)
                word_count_display = gr.Markdown("", visible=False)
                
            # Right Sidebar - AI Assistant with Fullscreen
            with gr.Column(scale=1, elem_classes="sidebar-panel"):
                
                # AI Chat Interface
                with gr.Row():
                    gr.Markdown("### 🤖 AI Assistant")
                    fullscreen_btn = gr.Button("⛶", size="sm", elem_classes="secondary-btn")
                
                # API Key Setup (collapsible)
                with gr.Accordion("🔑 API Setup", open=False):
                    gr.Markdown("✅ **IONOS API Key is pre-configured and ready!**")
                    ionos_api_input = gr.Textbox(
                        label="Custom IONOS AI API Key (Optional)",
                        placeholder="Leave blank to use default...",
                        type="password",
                        value=""
                    )
                    set_ionos_btn = gr.Button("Set Custom Key", size="sm")
                    api_status = gr.Markdown("**Status:** Using default API key")
                
                # Chat Interface
                chat_history = gr.Chatbot(
                    label="Chat",
                    height=300,
                    show_copy_button=True
                )
                
                chat_input = gr.Textbox(
                    label="Message",
                    placeholder="Ask AI for help...",
                    lines=2,
                    show_label=False
                )
                
                with gr.Row():
                    chat_btn = gr.Button("Send", variant="primary", scale=2)
                    clear_chat_btn = gr.Button("Clear", scale=1)
                
                # Enhanced Quick Actions
                gr.Markdown("### ⚡ Quick Actions")
                with gr.Column():
                    # Primary quick actions
                    with gr.Row():
                        improve_btn = gr.Button("✨ Improve", size="sm", elem_classes="quick-action-btn")
                        enhance_btn = gr.Button("🔧 Enhance", size="sm", elem_classes="quick-action-btn")
                    
                    with gr.Row():
                        professional_btn = gr.Button("💼 Professional", size="sm", elem_classes="quick-action-btn")
                        dramatic_btn = gr.Button("🎭 Add Drama", size="sm", elem_classes="quick-action-btn")
                    
                    with gr.Row():
                        continue_btn = gr.Button("📖 Continue", size="sm", elem_classes="quick-action-btn")
                        summarize_btn = gr.Button("📋 Summarize", size="sm", elem_classes="quick-action-btn")
                    
                    # Translation dropdown
                    with gr.Row():
                        translate_lang = gr.Dropdown(
                            label="Translate to:",
                            choices=["Spanish", "French", "German", "Italian", "Portuguese", "Chinese", "Japanese"],
                            value="Spanish",
                            scale=2
                        )
                        translate_btn = gr.Button("🌐 Translate", size="sm", scale=1, elem_classes="quick-action-btn")
                
                # Additional quick actions
                romantic_btn = gr.Button("💕 Make Romantic", size="sm", visible=False)
        
        # Fullscreen Chat Modal (initially hidden)
        with gr.Column(visible=False, elem_classes="fullscreen-chat") as fullscreen_chat:
            with gr.Row():
                gr.Markdown("# 🤖 AI Assistant - Fullscreen Mode")
                close_fullscreen_btn = gr.Button("✕ Close", size="sm", elem_classes="secondary-btn")
            
            fullscreen_chat_history = gr.Chatbot(
                label="Chat",
                height=600,
                show_copy_button=True
            )
            
            fullscreen_chat_input = gr.Textbox(
                label="Message",
                placeholder="Ask AI for help...",
                lines=3,
                show_label=False
            )
            
            with gr.Row():
                fullscreen_chat_btn = gr.Button("Send", variant="primary", scale=2)
                fullscreen_clear_btn = gr.Button("Clear", scale=1)
        
        # Setup event handlers
        setup_event_handlers(
            script_editor, notes_editor, word_count_display, reading_time_display, 
            tts_duration_display, auto_save_status, cache_status, generation_status,
            engine_dropdown, pitch_slider, play_btn,
            speed_slider, volume_slider, voice_dropdown, audio_output, audio_status,
            download_file, download_info, playback_status, project_name_input,
            save_btn, load_btn, gr.Button("🗑️ Delete", visible=False), export_btn, project_status, project_dropdown,
            ionos_api_input, set_ionos_btn, api_status, auto_save_toggle, live_preview_toggle,
            chat_input, chat_history, chat_btn, clear_chat_btn, improve_btn, professional_btn,
            dramatic_btn, romantic_btn, continue_btn, summarize_btn,
            stats_display, enhance_btn, translate_btn, translate_lang,
            editor_height, highlighted_script, fullscreen_btn, fullscreen_chat,
            fullscreen_chat_history, fullscreen_chat_input, fullscreen_chat_btn,
            fullscreen_clear_btn, close_fullscreen_btn
        )
    
    return app

def setup_event_handlers(*components):
    """Setup all event handlers for the interface"""
    # Unpack all components
    (script_editor, notes_editor, word_count_display, reading_time_display, 
     tts_duration_display, auto_save_status, cache_status, generation_status,
     engine_dropdown, pitch_slider, play_btn,
     speed_slider, volume_slider, voice_dropdown, audio_output, audio_status,
     download_file, download_info, playback_status, project_name_input,
     save_btn, load_btn, delete_btn, export_btn, project_status, project_dropdown,
     ionos_api_input, set_ionos_btn, api_status, auto_save_toggle, live_preview_toggle,
     chat_input, chat_history, chat_btn, clear_chat_btn, improve_btn, professional_btn,
     dramatic_btn, romantic_btn, continue_btn, summarize_btn,
     stats_display, enhance_btn, translate_btn, translate_lang,
     editor_height, highlighted_script, fullscreen_btn, fullscreen_chat,
     fullscreen_chat_history, fullscreen_chat_input, fullscreen_chat_btn,
     fullscreen_clear_btn, close_fullscreen_btn) = components
    
    # Enhanced interface update function
    def update_interface_on_text_change(text):
        word_info, reading_info, tts_info = update_word_count(text)
        auto_save_info = auto_save_script(text, "")
        
        # Extract numbers for stats display
        words = len(text.split()) if text.strip() else 0
        chars = len(text)
        tts_minutes = max(1, words // 150)
        
        stats_html = f"""
        <div style="text-align: right; color: #ccc;">
            <div>Words: {words} | Characters: {chars}</div>
            <div>Estimated TTS: ~{tts_minutes} min</div>
        </div>
        """
        
        cache_info = f"🗂️ Cache: {len(session_data['audio_cache'])} files"
        
        return word_info, reading_info, tts_info, auto_save_info, cache_info, stats_html
    
    script_editor.change(
        fn=update_interface_on_text_change,
        inputs=[script_editor],
        outputs=[word_count_display, reading_time_display, tts_duration_display, 
                auto_save_status, cache_status, stats_display]
    )
    
    # Editor height control
    def update_editor_height(height):
        return gr.update(lines=int(height/20))
    
    editor_height.change(
        fn=update_editor_height,
        inputs=[editor_height],
        outputs=[script_editor]
    )
    
    # Show/hide pitch control based on engine
    def update_engine_controls(engine):
        return gr.update(visible=(engine == "pyttsx3"))
    
    engine_dropdown.change(
        fn=update_engine_controls,
        inputs=[engine_dropdown],
        outputs=[pitch_slider]
    )
    
    # Main TTS generation with better feedback
    play_btn.click(
        fn=play_script,
        inputs=[script_editor, speed_slider, volume_slider, engine_dropdown, voice_dropdown, pitch_slider],
        outputs=[audio_output, audio_status, download_info, playback_status]
    )
    
    # Enhanced project management
    save_btn.click(
        fn=save_project_enhanced,
        inputs=[project_name_input, script_editor, notes_editor],
        outputs=[project_status, project_dropdown]
    )
    
    load_btn.click(
        fn=load_project_enhanced,
        inputs=[project_dropdown],
        outputs=[script_editor, notes_editor, project_status, project_name_input]
    )
    
    export_btn.click(
        fn=lambda project_name: export_project(project_name.replace("📘 ", "") if project_name and project_name.startswith("📘") else project_name),
        inputs=[project_dropdown],
        outputs=[download_file]
    )
    
    # API and settings
    set_ionos_btn.click(
        fn=lambda key: set_api_key("ionos_api_key", key),
        inputs=[ionos_api_input],
        outputs=[api_status]
    )
    
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
    
    # Fullscreen chat functionality
    def toggle_fullscreen_chat(chat_hist):
        return gr.update(visible=True), chat_hist
    
    def close_fullscreen_chat():
        return gr.update(visible=False)
    
    fullscreen_btn.click(
        fn=toggle_fullscreen_chat,
        inputs=[chat_history],
        outputs=[fullscreen_chat, fullscreen_chat_history]
    )
    
    close_fullscreen_btn.click(
        fn=close_fullscreen_chat,
        outputs=[fullscreen_chat]
    )
    
    # Fullscreen chat controls
    fullscreen_chat_btn.click(
        fn=chat_with_ai,
        inputs=[fullscreen_chat_input, fullscreen_chat_history, script_editor],
        outputs=[fullscreen_chat_history, fullscreen_chat_input]
    )
    
    fullscreen_clear_btn.click(
        fn=lambda: [],
        outputs=[fullscreen_chat_history]
    )
    
    # Enhanced quick action handlers
    improve_btn.click(
        fn=quick_action_improve,
        inputs=[script_editor, chat_history],
        outputs=[chat_history, chat_input]
    )
    
    enhance_btn.click(
        fn=quick_action_enhance,
        inputs=[script_editor, chat_history],
        outputs=[chat_history, chat_input]
    )
    
    professional_btn.click(
        fn=quick_action_professional,
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
    
    # Translation functionality
    def handle_translate(script, lang, history):
        return quick_action_translate(script, lang, history)
    
    translate_btn.click(
        fn=handle_translate,
        inputs=[script_editor, translate_lang, chat_history],
        outputs=[chat_history, chat_input]
    )

    # Audio follow-along functionality with improved timing
    def start_audio_followalong_enhanced(script_text):
        """Enhanced audio follow-along with proper timing"""
        if not script_text.strip():
            return gr.update(visible=False)
        
        # Create initial highlighted text and show the component
        highlighted_text = start_audio_followalong(script_text)
        return gr.update(value=highlighted_text, visible=True)
    
    # Update highlighted text when audio starts playing
    audio_output.play(
        fn=start_audio_followalong_enhanced,
        inputs=[script_editor],
        outputs=[highlighted_script]
    )
    
    # Hide follow-along when audio stops
    def stop_audio_followalong():
        return gr.update(visible=False)
    
    audio_output.stop(
        fn=stop_audio_followalong,
        outputs=[highlighted_script]
    )
    
    audio_output.pause(
        fn=stop_audio_followalong,
        outputs=[highlighted_script]
    )
