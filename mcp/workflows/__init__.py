
"""
Workflow system for autonomous agent
"""

from .base import Workflow, WorkflowRegistry
from .script_improvement import ScriptImprovementWorkflow
from .batch_processing import BatchProcessingWorkflow

# Create global workflow registry
workflow_registry = WorkflowRegistry()

# Register built-in workflows
workflow_registry.register(ScriptImprovementWorkflow())
workflow_registry.register(BatchProcessingWorkflow())

__all__ = ['Workflow', 'WorkflowRegistry', 'workflow_registry', 'ScriptImprovementWorkflow', 'BatchProcessingWorkflow']
