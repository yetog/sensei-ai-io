
import gradio as gr
from core.config import AUDIO_DIR, CACHE_DIR
from core.utils import cleanup_old_audio_files
from services.project_service import load_existing_projects
from ui.interface import create_interface

def main():
    """Main entry point for Wolf AI application"""
    # Load existing projects and initialize samples on startup
    load_existing_projects()
    
    # Clean up old files on startup
    cleanup_old_audio_files(AUDIO_DIR, CACHE_DIR)
    
    # Create and launch the interface
    app = create_interface()
    app.launch(
        share=True,
        debug=True,
        server_name="0.0.0.0",
        server_port=7860,
        favicon_path=None,
        show_error=True
    )

if __name__ == "__main__":
    main()
