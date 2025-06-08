
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
    """Save current project with enhanced error handling"""
    if not project_name.strip():
        return "❌ Please enter a project name"
    
    # Clean project name
    project_name = project_name.strip()
    
    # Update session data
    session_data["projects"][project_name] = {
        "name": project_name,
        "script": script,
        "notes": notes,
        "created_at": session_data["projects"].get(project_name, {}).get("created_at", datetime.now().isoformat()),
        "last_modified": datetime.now().isoformat(),
        "word_count": len(script.split()) if script.strip() else 0,
        "character_count": len(script),
        "is_sample": False
    }
    session_data["current_project"] = project_name
    
    # Save to file with error handling
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(os.path.abspath("projects.json")), exist_ok=True)
        
        # Create backup of existing file
        if os.path.exists("projects.json"):
            backup_path = f"projects_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            try:
                with open("projects.json", "r") as f:
                    backup_data = f.read()
                with open(backup_path, "w") as f:
                    f.write(backup_data)
            except:
                pass  # Backup failed, but continue with save
        
        # Save the file
        with open("projects.json", "w", encoding='utf-8') as f:
            json.dump(session_data["projects"], f, indent=2, ensure_ascii=False)
        
        return f"✅ Project '{project_name}' saved successfully! ({len(script.split())} words)"
    except Exception as e:
        print(f"Save error: {str(e)}")
        return f"❌ Error saving project: {str(e)}"

def load_project(project_name: str) -> Tuple[str, str, str]:
    """Load a project with enhanced error handling"""
    if not project_name:
        return "", "", "❌ No project selected"
    
    if project_name in session_data["projects"]:
        try:
            project = session_data["projects"][project_name]
            session_data["current_project"] = project_name
            
            script = project.get("script", "")
            notes = project.get("notes", "")
            
            # Update word count if needed
            if "word_count" not in project:
                project["word_count"] = len(script.split()) if script.strip() else 0
            
            return script, notes, f"✅ Loaded project '{project_name}' ({project.get('word_count', 0)} words)"
        except Exception as e:
            print(f"Load error: {str(e)}")
            return "", "", f"❌ Error loading project: {str(e)}"
    
    return "", "", f"❌ Project '{project_name}' not found"

def delete_project(project_name: str) -> Tuple[str, List[str]]:
    """Delete a project"""
    if project_name in session_data["projects"]:
        if session_data["projects"][project_name].get("is_sample", False):
            return "❌ Cannot delete sample projects", get_project_list()
        
        try:
            del session_data["projects"][project_name]
            
            # Save to file
            with open("projects.json", "w", encoding='utf-8') as f:
                json.dump(session_data["projects"], f, indent=2, ensure_ascii=False)
            return f"✅ Project '{project_name}' deleted successfully!", get_project_list()
        except Exception as e:
            print(f"Delete error: {str(e)}")
            return f"❌ Error deleting project: {str(e)}", get_project_list()
    
    return f"❌ Project '{project_name}' not found", get_project_list()

def export_project(project_name: str) -> Optional[str]:
    """Export project as JSON file with enhanced error handling"""
    if project_name in session_data["projects"]:
        try:
            project = session_data["projects"][project_name]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # Clean filename
            safe_name = "".join(c for c in project_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
            filename = f"project_{safe_name}_{timestamp}.json"
            
            # Ensure audio directory exists
            os.makedirs(AUDIO_DIR, exist_ok=True)
            filepath = os.path.join(AUDIO_DIR, filename)
            
            # Export with metadata
            export_data = {
                "project_name": project_name,
                "exported_at": datetime.now().isoformat(),
                "app_version": "Wolf AI v1.0",
                "project_data": project
            }
            
            with open(filepath, "w", encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
            
            return filepath
        except Exception as e:
            print(f"Export error: {str(e)}")
            return None
    return None

def get_project_list() -> List[str]:
    """Get list of available projects"""
    try:
        return list(session_data["projects"].keys())
    except:
        return []

def toggle_auto_save(enabled: bool) -> str:
    """Toggle auto-save functionality"""
    session_data["settings"]["auto_save"] = enabled
    return f"✅ Auto-save {'enabled' if enabled else 'disabled'}"

def toggle_live_preview(enabled: bool) -> str:
    """Toggle live preview functionality"""
    session_data["settings"]["live_preview"] = enabled
    return f"✅ Live preview {'enabled' if enabled else 'disabled'}"

def create_new_project(name: str = None) -> str:
    """Create a new empty project"""
    if not name:
        # Generate unique name
        base_name = f"New_Project_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        name = base_name
    
    counter = 1
    original_name = name
    while name in session_data["projects"]:
        name = f"{original_name}_{counter}"
        counter += 1
    
    session_data["projects"][name] = initialize_project(name)
    session_data["current_project"] = name
    
    try:
        with open("projects.json", "w", encoding='utf-8') as f:
            json.dump(session_data["projects"], f, indent=2, ensure_ascii=False)
        return f"✅ New project '{name}' created successfully!"
    except Exception as e:
        return f"❌ Error creating project: {str(e)}"

# Load existing projects and initialize samples on startup
def load_existing_projects():
    try:
        if os.path.exists("projects.json"):
            with open("projects.json", "r", encoding='utf-8') as f:
                loaded_projects = json.load(f)
                
            # Validate loaded projects
            for name, project in loaded_projects.items():
                if isinstance(project, dict) and "script" in project:
                    session_data["projects"][name] = project
                else:
                    print(f"Warning: Invalid project data for '{name}', skipping...")
                    
    except Exception as e:
        print(f"Warning: Could not load existing projects: {str(e)}")
        # Continue with empty projects dict
    
    initialize_sample_scripts()
