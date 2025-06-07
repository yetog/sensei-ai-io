
import os
import shutil
from datetime import datetime
from typing import Optional, List
from core.config import AUDIO_DIR, CACHE_DIR, session_data
from core.utils import get_cache_key, get_cached_audio

# TTS imports
try:
    from gtts import gTTS
    import pyttsx3
    GTTS_AVAILABLE = True
    PYTTSX3_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False
    PYTTSX3_AVAILABLE = False

# Initialize TTS engines
tts_engine = None
if PYTTSX3_AVAILABLE:
    try:
        tts_engine = pyttsx3.init()
    except:
        tts_engine = None

def cache_audio(cache_key: str, audio_file: str) -> None:
    """Cache audio file"""
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.mp3")
    try:
        shutil.copy2(audio_file, cache_file)
        session_data["audio_cache"][cache_key] = cache_file
    except Exception as e:
        print(f"Cache error: {e}")

def generate_tts_gtts(text: str, speed: float = 1.0, voice: str = "en") -> Optional[str]:
    """Generate TTS using Google Text-to-Speech with voice options"""
    if not GTTS_AVAILABLE or not text.strip():
        return None
    
    try:
        # Check cache first
        cache_key = get_cache_key(text, "gtts", voice, speed, 0)
        cached_file = get_cached_audio(cache_key, CACHE_DIR)
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
        cached_file = get_cached_audio(cache_key, CACHE_DIR)
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

def batch_generate_audio(scripts: List[str], settings: dict) -> List[str]:
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
