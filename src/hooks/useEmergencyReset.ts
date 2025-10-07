import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Emergency reset hook for when speech recognition gets stuck in a bad state
 * This completely nukes and recreates everything
 */
export const useEmergencyReset = () => {
  const { toast } = useToast();

  const emergencyReset = useCallback(() => {
    console.log('🚨 EMERGENCY RESET INITIATED');
    
    try {
      // Stop all media streams
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(() => {});

      // Clear all localStorage related to transcripts
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.includes('transcript') || 
        key.includes('coaching') || 
        key.includes('session')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Force page reload after 500ms to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 500);

      toast({
        title: "Emergency Reset",
        description: "Resetting speech recognition... Page will reload.",
        duration: 2000,
      });

      console.log('✅ Emergency reset complete - reloading page');
    } catch (error) {
      console.error('❌ Emergency reset failed:', error);
      toast({
        title: "Reset Failed",
        description: "Please refresh the page manually",
        variant: "destructive",
      });
    }
  }, [toast]);

  return { emergencyReset };
};
