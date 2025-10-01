/**
 * Environment Detection Utility
 * Detects runtime environment and provides environment-specific configurations
 */

export interface EnvironmentInfo {
  isProduction: boolean;
  isPreview: boolean;
  isDevelopment: boolean;
  hasHTTPS: boolean;
  domain: string;
}

export const detectEnvironment = (): EnvironmentInfo => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  const isPreview = hostname.includes('lovable.app') || hostname.includes('preview');
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
  const isProduction = !isPreview && !isDevelopment;
  const hasHTTPS = protocol === 'https:';
  
  return {
    isProduction,
    isPreview,
    isDevelopment,
    hasHTTPS,
    domain: hostname
  };
};

export const getOptimalWhisperModel = (): string => {
  const env = detectEnvironment();
  
  // Use smaller, faster models for preview/development
  if (env.isPreview || env.isDevelopment) {
    return 'onnx-community/whisper-tiny.en';
  }
  
  // Can use larger models in production
  return 'onnx-community/whisper-base.en';
};

export const shouldUseLocalAI = (): boolean => {
  const env = detectEnvironment();
  
  // Local AI might not work reliably in preview due to large model downloads
  // Prefer cloud AI in preview environments
  return env.isProduction || env.isDevelopment;
};

export const checkNetworkConditions = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    return false;
  }
  
  try {
    // Quick network test - reduced timeout for faster failures
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    
    const response = await fetch('https://cdn.jsdelivr.net/npm/@huggingface/transformers/package.json', {
      signal: controller.signal,
      mode: 'cors'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Network conditions check failed:', error);
    return false;
  }
};

export const validateAudioPermissions = async (): Promise<{
  granted: boolean;
  error?: string;
}> => {
  try {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        granted: false,
        error: 'Audio recording not supported in this browser'
      };
    }
    
    // Check permission state if available
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permission.state === 'denied') {
          return {
            granted: false,
            error: 'Microphone access denied. Please enable in browser settings.'
          };
        }
      } catch (e) {
        // Permission query might not be supported for microphone
        console.log('Permission query not supported');
      }
    }
    
    return { granted: true };
  } catch (error) {
    return {
      granted: false,
      error: error instanceof Error ? error.message : 'Permission check failed'
    };
  }
};
