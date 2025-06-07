
import os
import hashlib
import time
from datetime import datetime
from typing import Tuple, Optional, List

def get_cache_key(text: str, engine: str, voice: str, speed: float, pitch: int) -> str:
    """Generate cache key for TTS audio"""
    content = f"{text}_{engine}_{voice}_{speed}_{pitch}"
    return hashlib.md5(content.encode()).hexdigest()

def get_cached_audio(cache_key: str, cache_dir: str) -> Optional[str]:
    """Get cached audio file if available"""
    cache_file = os.path.join(cache_dir, f"{cache_key}.mp3")
    if os.path.exists(cache_file):
        return cache_file
    return None

def update_word_count(text: str) -> Tuple[str, str, str]:
    """Update word and character count display with reading time"""
    words = len(text.split()) if text.strip() else 0
    chars = len(text)
    reading_time = max(1, words // 200)
    
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

def cleanup_old_audio_files(audio_dir: str, cache_dir: str):
    """Clean up audio files older than 1 hour"""
    try:
        current_time = time.time()
        for directory in [audio_dir, cache_dir]:
            for filename in os.listdir(directory):
                file_path = os.path.join(directory, filename)
                if os.path.isfile(file_path):
                    file_age = current_time - os.path.getmtime(file_path)
                    if file_age > 3600:  # 1 hour
                        os.remove(file_path)
    except Exception as e:
        print(f"Cleanup error: {e}")
