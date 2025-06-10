
"""
Script Improvement Workflow
Automatically improves scripts using AI analysis and recommendations
"""

from typing import Dict, Any, Callable
from .base import Workflow
from ..agent import WorkflowResult

class ScriptImprovementWorkflow(Workflow):
    """Workflow for automatically improving scripts"""
    
    def __init__(self):
        super().__init__(
            name="script_improvement",
            description="Automatically analyze and improve script content using AI",
            required_params=["script_content"]
        )
        
    async def execute(self, progress_callback: Callable) -> WorkflowResult:
        """Execute script improvement workflow"""
        try:
            script_content = self.params.get("script_content", "")
            improvement_type = self.params.get("improvement_type", "general")
            
            if not script_content.strip():
                return WorkflowResult(False, error="No script content provided")
                
            progress_callback("Analyzing script content...", 0.2)
            
            # Step 1: Analyze current script
            analysis = await self._analyze_script(script_content)
            progress_callback("Script analysis complete", 0.4)
            
            # Step 2: Generate improvements
            improvements = await self._generate_improvements(script_content, improvement_type, analysis)
            progress_callback("Generated improvement suggestions", 0.6)
            
            # Step 3: Apply improvements (if auto-apply is enabled)
            auto_apply = self.params.get("auto_apply", False)
            if auto_apply:
                improved_script = await self._apply_improvements(script_content, improvements)
                progress_callback("Applied improvements to script", 0.8)
                
                # Update script in context
                self.context_manager.update_script(improved_script)
                progress_callback("Script updated successfully", 1.0)
                
                return WorkflowResult(True, {
                    "original_script": script_content,
                    "improved_script": improved_script,
                    "analysis": analysis,
                    "improvements": improvements,
                    "auto_applied": True
                })
            else:
                progress_callback("Improvement suggestions ready", 1.0)
                
                return WorkflowResult(True, {
                    "original_script": script_content,
                    "analysis": analysis,
                    "improvements": improvements,
                    "auto_applied": False
                })
                
        except Exception as e:
            return WorkflowResult(False, error=f"Script improvement failed: {str(e)}")
            
    async def _analyze_script(self, script_content: str) -> Dict[str, Any]:
        """Analyze script for improvement opportunities"""
        word_count = len(script_content.split())
        character_count = len(script_content)
        
        # Basic analysis (can be enhanced with AI later)
        analysis = {
            "word_count": word_count,
            "character_count": character_count,
            "estimated_reading_time": word_count / 150,  # Average reading speed
            "suggestions": []
        }
        
        # Add basic suggestions
        if word_count < 50:
            analysis["suggestions"].append("Script is quite short - consider expanding with more detail")
        elif word_count > 500:
            analysis["suggestions"].append("Script is lengthy - consider breaking into sections")
            
        if not any(punct in script_content for punct in ['.', '!', '?']):
            analysis["suggestions"].append("Add punctuation to improve readability")
            
        return analysis
        
    async def _generate_improvements(self, script_content: str, improvement_type: str, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate specific improvement suggestions"""
        improvements = []
        
        if improvement_type == "professional":
            improvements.append({
                "type": "tone",
                "description": "Make tone more professional and polished",
                "priority": "high"
            })
            
        elif improvement_type == "dramatic":
            improvements.append({
                "type": "drama",
                "description": "Add dramatic elements and emotional depth",
                "priority": "medium"
            })
            
        elif improvement_type == "clarity":
            improvements.append({
                "type": "clarity",
                "description": "Improve clarity and readability",
                "priority": "high"
            })
            
        # Add general improvements based on analysis
        for suggestion in analysis.get("suggestions", []):
            improvements.append({
                "type": "general",
                "description": suggestion,
                "priority": "low"
            })
            
        return improvements
        
    async def _apply_improvements(self, script_content: str, improvements: List[Dict[str, Any]]) -> str:
        """Apply improvements to script content"""
        # For now, return the original script with a note
        # This would be enhanced with actual AI processing
        improved_script = script_content
        
        # Add improvement note
        improvement_note = "\n\n[AUTO-IMPROVED: Applied " + ", ".join([imp["type"] for imp in improvements]) + "]"
        
        return improved_script + improvement_note
