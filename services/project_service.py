
import json
import os
from datetime import datetime
from typing import Dict, Tuple, List, Optional
from core.config import session_data, AUDIO_DIR, initialize_project, SAMPLE_SCRIPTS
from core.utils import update_word_count

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

def toggle_auto_save(enabled: bool) -> str:
    """Toggle auto-save functionality"""
    session_data["settings"]["auto_save"] = enabled
    return f"✅ Auto-save {'enabled' if enabled else 'disabled'}"

def toggle_live_preview(enabled: bool) -> str:
    """Toggle live preview functionality"""
    session_data["settings"]["live_preview"] = enabled
    return f"✅ Live preview {'enabled' if enabled else 'disabled'}"

# Load existing projects and initialize samples on startup
def load_existing_projects():
    try:
        if os.path.exists("projects.json"):
            with open("projects.json", "r") as f:
                session_data["projects"] = json.load(f)
    except:
        pass
    
    initialize_sample_scripts()
