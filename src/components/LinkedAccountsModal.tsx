import { View, Modal, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, spacing, typography } from '../constants/theme';
import { useState, useEffect } from 'react';

interface LinkedAccountsModalProps {
  visible: boolean;
  onClose: () => void;
  linkToken: string | null;
  onSuccess: (publicToken: string) => void;
  generateLinkToken: () => Promise<void>;
  exchangePublicToken: (publicToken: string) => Promise<void>;
}

export const LinkedAccountsModal = ({ 
  visible, 
  onClose, 
  linkToken, 
  onSuccess,
  generateLinkToken,
  exchangePublicToken 
}: LinkedAccountsModalProps) => {
  const [error, setError] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (visible && !linkToken) {
      console.log('Modal visible, generating link token');
      setIsLoading(true);
      generateLinkToken()
        .catch((error) => {
          console.error('Failed to generate link token:', error);
          setError('Unable to connect to bank services. Please try again later.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [visible, linkToken, generateLinkToken]);

  const handleOpenPlaid = () => {
    if (!linkToken) {
      console.log('No link token available');
      setError('Unable to connect to bank services');
      return;
    }
    console.log('Opening Plaid with link token:', linkToken);
    setError(null); // Clear any previous errors
    setIsLoading(true);
    setShowWebView(true);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', data);
      
      if (data.type === 'SUCCESS') {
        onSuccess(data.publicToken);
        setShowWebView(false);
        onClose();
      } else if (data.type === 'EXIT') {
        setError('Connection cancelled or failed');
        setShowWebView(false);
      } else if (data.type === 'ERROR') {
        console.error('WebView error:', data.error, data.details);
        setError('Failed to initialize bank connection');
        setShowWebView(false);
      }
    } catch (err) {
      console.error('Error handling WebView message:', err);
      setError('Failed to process bank connection');
      setShowWebView(false);
    }
  };

  const handlePlaidEvent = (url: string) => {
    try {
      console.log('Raw Plaid URL:', url);
      
      // Handle plaidlink://connected directly
      if (url.startsWith('plaidlink://connected')) {
        const params = new URLSearchParams(url.split('?')[1]);
        const publicToken = params.get('public_token');
        
        if (publicToken) {
          console.log('Successfully retrieved public token:', publicToken);
          exchangePublicToken(publicToken)
            .then(() => {
              onSuccess(publicToken);
              setShowWebView(false);
              onClose();
            })
            .catch((error) => {
              console.error('Failed to exchange public token:', error);
              setError('Failed to link bank account. Please try again.');
              setShowWebView(false);
            });
          return false;
        }
      }

      // Handle other plaidlink:// events
      if (url.startsWith('plaidlink://event')) {
        const params = new URLSearchParams(url.split('?')[1]);
        const eventName = params.get('event_name');
        const metadata = params.get('metadata_json');

        console.log('Plaid event:', eventName);
        if (metadata) {
          console.log('Event metadata:', metadata);
          const metadataObj = JSON.parse(decodeURIComponent(metadata));
          
          switch (eventName) {
            case 'EXIT':
              if (metadataObj.error_code === 'INVALID_CREDENTIALS') {
                setError('Invalid credentials. Please try again.');
              } else if (metadataObj.error_code) {
                setError(`Connection failed: ${metadataObj.error_message || 'Unknown error'}`);
              } else {
                setError('Connection cancelled or failed');
              }
              setShowWebView(false);
              break;
            case 'HANDOFF':
              console.log('Handoff received, waiting for connection completion');
              break;
            case 'ERROR':
              console.error('Plaid error:', metadataObj);
              setError('Failed to connect to bank');
              setShowWebView(false);
              break;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error handling Plaid event:', error);
      setError('Failed to process bank connection');
      setShowWebView(false);
      return false;
    }
  };

  // Basic Plaid Link configuration
  const plaidURL = `https://cdn.plaid.com/link/v2/stable/link.html?isWebview=true&token=${linkToken}`;

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
    >
      {showWebView ? (
        <View style={styles.webViewContainer}>
          <WebView
            source={{ uri: plaidURL }}
            onMessage={handleWebViewMessage}
            style={styles.webView}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            onLoadStart={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.log('WebView load starting:', nativeEvent.url);
              setIsLoading(true);
            }}
            onLoadEnd={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.log('WebView load ended:', nativeEvent.url);
              setIsLoading(false);
            }}
            onShouldStartLoadWithRequest={(request) => {
              console.log('Load request:', request.url);
              // Intercept Plaid events but allow other URLs to load
              if (request.url.startsWith('plaidlink://')) {
                handlePlaidEvent(request.url);
                return false; // Don't try to load plaidlink:// URLs
              }
              return true; // Load all other URLs
            }}
            onNavigationStateChange={(navState) => {
              console.log('WebView navigation state:', navState);
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              setError('Failed to load bank connection interface');
              setIsLoading(false);
              setShowWebView(false);
            }}
          />
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Loading bank interface...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Link Your Bank Account</Text>
            {error && <Text style={styles.error}>{error}</Text>}
            <TouchableOpacity 
              style={[styles.button, !linkToken && styles.buttonDisabled]}
              onPress={() => {
                console.log('Button pressed. Link token:', linkToken);
                handleOpenPlaid();
              }}
              disabled={!linkToken}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Loading...' : 'Connect a bank account'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.lg,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  webView: {
    flex: 1,
  },
  content: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: spacing.lg,
    width: '100%',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  error: {
    color: colors.error,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.textLight,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.textDark,
    marginTop: spacing.md,
  },
}); 