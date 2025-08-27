class DemoService {
  private readonly DEMO_KEY = 'sensei:demoState';

  getDemoState(): { hasSeenOnboarding: boolean; completedSteps: string[] } {
    try {
      const stored = localStorage.getItem(this.DEMO_KEY);
      return stored ? JSON.parse(stored) : { hasSeenOnboarding: false, completedSteps: [] };
    } catch {
      return { hasSeenOnboarding: false, completedSteps: [] };
    }
  }

  setHasSeenOnboarding(seen: boolean): void {
    const state = this.getDemoState();
    state.hasSeenOnboarding = seen;
    this.saveDemoState(state);
  }

  addCompletedStep(step: string): void {
    const state = this.getDemoState();
    if (!state.completedSteps.includes(step)) {
      state.completedSteps.push(step);
      this.saveDemoState(state);
    }
  }

  private saveDemoState(state: { hasSeenOnboarding: boolean; completedSteps: string[] }): void {
    try {
      localStorage.setItem(this.DEMO_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save demo state:', error);
    }
  }

  // Demo data helpers
  createSampleDataset(): void {
    // This would create a sample dataset with demo content
    console.log('Creating sample dataset for demo');
  }

  createSampleAgent(): void {
    // This would create a sample agent for demo
    console.log('Creating sample agent for demo');
  }
}

export const demoService = new DemoService();