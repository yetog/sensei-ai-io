
import os
from datetime import datetime
from typing import Dict, Any

# Wolf AI Configuration
APP_NAME = "Wolf AI"
APP_DESCRIPTION = "AI-Powered Script Editor & Voice Generator"

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
        "script": f"""Welcome to {APP_NAME}, your AI-powered script editor!

This is a demonstration of how you can create engaging scripts and convert them to natural-sounding speech.

Try editing this text, then click 'Generate Audio' to hear it spoken aloud. You can adjust the speed, volume, and voice settings to customize the output.

The AI assistant can help you improve your scripts, check for flow issues, or make them more engaging. Just ask!""",
        "notes": "Demo script showcasing basic functionality"
    },
    "Podcast Intro": {
        "script": f"""Hello and welcome back to Tech Talk Tuesday, the podcast where we explore the latest innovations in technology.

I'm your host, and today we're diving deep into the world of artificial intelligence and its impact on content creation.

We'll be discussing how AI tools like {APP_NAME} are revolutionizing the way we write, edit, and produce audio content. So grab your coffee, settle in, and let's get started!""",
        "notes": "Sample podcast introduction with natural pacing"
    },
    "Product Demo": {
        "script": f"""Introducing {APP_NAME} - the future of voice technology where your words come to life with stunning clarity and natural expression.

Our advanced text-to-speech system transforms any written content into professional-quality audio, perfect for presentations, podcasts, audiobooks, and more.

With customizable voices, adjustable speed controls, and AI-powered script optimization, creating compelling audio content has never been easier.

Experience the difference today and revolutionize your content creation workflow.""",
        "notes": "Product demonstration script with marketing tone"
    }
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
