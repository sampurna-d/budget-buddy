import Constants from 'expo-constants';

// Get environment variables from Expo's extra field
const extra = Constants.expoConfig?.extra || {};

interface EnvConfig {
  KLUSTER_API_KEY: string;
  AI_BASE_URL: string;
}

if (!extra.KLUSTER_API_KEY) {
  throw new Error('KLUSTER_API_KEY is required but not set in app.config.js');
}

export const env: EnvConfig = {
  KLUSTER_API_KEY: extra.KLUSTER_API_KEY,
  AI_BASE_URL: extra.AI_BASE_URL
}; 