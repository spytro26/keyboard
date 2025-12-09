import React, { forwardRef, useImperativeHandle, useState, useRef, useCallback } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '@/firebase';

interface FirebaseRecaptchaVerifierModalProps {
  firebaseConfig: {
    apiKey: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
  attemptInvisibleVerification?: boolean;
  onVerify?: (token: string) => void;
  onError?: (error: Error) => void;
  onLoad?: () => void;
}

export interface FirebaseRecaptchaVerifierModalHandle {
  requestOTP: (phoneNumber: string) => Promise<string>;
  confirmOTP: (verificationId: string, code: string) => Promise<any>;
}

export const FirebaseRecaptchaVerifierModal = forwardRef<
  FirebaseRecaptchaVerifierModalHandle,
  FirebaseRecaptchaVerifierModalProps
>((props, ref) => {
  const { firebaseConfig, onVerify, onError, onLoad } = props;
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('Initializing...');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const webViewRef = useRef<WebView>(null);
  
  const resolveRef = useRef<((value: any) => void) | null>(null);
  const rejectRef = useRef<((error: Error) => void) | null>(null);
  const phoneNumberRef = useRef<string>('');

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      console.log('[reCAPTCHA] Raw message:', event.nativeEvent.data);
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'status') {
        console.log('[reCAPTCHA] Status:', data.message);
        setStatusText(data.message);
      } else if (data.type === 'ready') {
        console.log('[reCAPTCHA] ✅ Ready');
        setLoading(false);
        setStatusText('Please complete the verification');
        onLoad?.();
      } else if (data.type === 'verificationSent') {
        console.log('[reCAPTCHA] ✅ OTP sent! Verification ID:', data.verificationId);
        setVisible(false);
        setLoading(true);
        setErrorText(null);
        onVerify?.(data.verificationId);
        resolveRef.current?.(data.verificationId);
        resolveRef.current = null;
        rejectRef.current = null;
      } else if (data.type === 'error') {
        console.error('[reCAPTCHA] ❌ Error:', data.message, 'Code:', data.code);
        setStatusText('Error occurred');
        setErrorText(`${data.message}\n\nError Code: ${data.code || 'unknown'}`);
        setLoading(false);
        const error = new Error(data.message || 'Operation failed');
        (error as any).code = data.code;
        onError?.(error);
      } else if (data.type === 'debug') {
        console.log('[reCAPTCHA Debug]:', data.message);
      }
    } catch (e) {
      console.log('[reCAPTCHA] Non-JSON message:', event.nativeEvent.data);
    }
  }, [onVerify, onError, onLoad]);

  // Request OTP - opens WebView with reCAPTCHA, returns verification ID
  const requestOTP = useCallback((phoneNumber: string): Promise<string> => {
    console.log('[reCAPTCHA] requestOTP called for:', phoneNumber);
    return new Promise((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;
      phoneNumberRef.current = phoneNumber;
      setLoading(true);
      setErrorText(null);
      setStatusText('Initializing...');
      setWebViewKey(prev => prev + 1);
      setVisible(true);
    });
  }, []);

  // Confirm OTP - uses React Native Firebase to verify (NOT WebView)
  const confirmOTP = useCallback(async (verificationId: string, code: string): Promise<any> => {
    console.log('[reCAPTCHA] confirmOTP called - verifying in React Native');
    
    try {
      // Create credential using the verification ID from WebView and the OTP code
      const credential = PhoneAuthProvider.credential(verificationId, code);
      
      // Sign in using the MAIN APP's Firebase auth instance
      const userCredential = await signInWithCredential(auth, credential);
      
      console.log('[reCAPTCHA] ✅ Sign-in successful! UID:', userCredential.user.uid);
      
      return {
        uid: userCredential.user.uid,
        phoneNumber: userCredential.user.phoneNumber,
      };
    } catch (error: any) {
      console.error('[reCAPTCHA] ❌ Confirm OTP error:', error.code, error.message);
      throw error;
    }
  }, []);

  useImperativeHandle(ref, () => ({
    requestOTP,
    confirmOTP,
  }), [requestOTP, confirmOTP]);

  const handleCloseModal = useCallback(() => {
    console.log('[reCAPTCHA] Modal closed by user');
    setVisible(false);
    setLoading(true);
    setErrorText(null);
    rejectRef.current?.(new Error('Verification cancelled by user'));
    resolveRef.current = null;
    rejectRef.current = null;
  }, []);

  const escapedPhone = phoneNumberRef.current.replace(/'/g, "\\'");
  const authDomain = firebaseConfig.authDomain || `${firebaseConfig.projectId}.firebaseapp.com`;

  // WebView HTML - ONLY handles reCAPTCHA and sending OTP, NOT sign-in
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Phone Verification</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #status {
      color: #1e293b;
      padding: 15px;
      text-align: center;
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 15px;
    }
    #error {
      color: #dc2626;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      font-size: 14px;
      margin: 15px 0;
      display: none;
      max-width: 100%;
      word-wrap: break-word;
    }
    #recaptcha-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 78px;
      margin: 10px 0;
    }
    #retry-button {
      background-color: #2563eb;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      margin-top: 15px;
      display: none;
    }
  </style>
</head>
<body>
  <div id="status">Loading...</div>
  <div id="error"></div>
  <div id="recaptcha-container"></div>
  <button id="retry-button" onclick="location.reload()">Try Again</button>
  
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
  <script>
    var phoneNumber = '${escapedPhone}';
    
    function sendMessage(data) {
      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
      } catch(e) {
        console.log('Send message error:', e);
      }
    }
    
    function updateStatus(msg) {
      var el = document.getElementById('status');
      if (el) el.innerText = msg;
      sendMessage({ type: 'status', message: msg });
    }
    
    function showError(msg, code) {
      var errorEl = document.getElementById('error');
      var retryBtn = document.getElementById('retry-button');
      if (errorEl) {
        errorEl.innerText = msg + (code ? '\\nError Code: ' + code : '');
        errorEl.style.display = 'block';
      }
      if (retryBtn) retryBtn.style.display = 'block';
      updateStatus('Verification failed');
      sendMessage({ type: 'error', message: msg, code: code || 'unknown' });
    }
    
    var firebaseConfig = ${JSON.stringify(firebaseConfig)};
    var recaptchaVerifier = null;
    
    function init() {
      try {
        updateStatus('Initializing...');
        sendMessage({ type: 'debug', message: 'Starting init' });
        
        // Initialize Firebase
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        
        // Set persistence to NONE to avoid storage issues in WebView
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE)
          .then(function() {
            sendMessage({ type: 'debug', message: 'Persistence set to NONE' });
            setupRecaptcha();
          })
          .catch(function(error) {
            sendMessage({ type: 'debug', message: 'Persistence error (continuing): ' + error.message });
            // Continue anyway
            setupRecaptcha();
          });
        
      } catch (error) {
        showError('Initialization failed: ' + (error.message || String(error)), error.code);
      }
    }
    
    function setupRecaptcha() {
      updateStatus('Setting up verification...');
      sendMessage({ type: 'debug', message: 'Setting up reCAPTCHA' });
      
      try {
        var container = document.getElementById('recaptcha-container');
        if (container) container.innerHTML = '';
        
        recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          size: 'normal',
          callback: function(response) {
            sendMessage({ type: 'debug', message: 'reCAPTCHA solved' });
            updateStatus('Sending verification code...');
            sendOTP();
          },
          'expired-callback': function() {
            showError('Verification expired. Please try again.', 'recaptcha-expired');
          }
        });
        
        recaptchaVerifier.render()
          .then(function(widgetId) {
            sendMessage({ type: 'debug', message: 'reCAPTCHA rendered' });
            updateStatus('Please verify you are human');
            sendMessage({ type: 'ready' });
          })
          .catch(function(error) {
            sendMessage({ type: 'debug', message: 'Render error: ' + error.message });
            showError('Could not load verification: ' + error.message, error.code);
          });
          
      } catch (error) {
        showError('Setup failed: ' + error.message, error.code);
      }
    }
    
    function sendOTP() {
      sendMessage({ type: 'debug', message: 'Sending OTP to: ' + phoneNumber });
      
      // Use signInWithPhoneNumber to send the OTP
      // This returns a confirmationResult with verificationId
      firebase.auth().signInWithPhoneNumber(phoneNumber, recaptchaVerifier)
        .then(function(confirmationResult) {
          sendMessage({ type: 'debug', message: 'OTP sent! VerificationId: ' + confirmationResult.verificationId });
          updateStatus('Code sent!');
          
          // IMPORTANT: We only send back the verificationId
          // The actual sign-in will happen in React Native using this ID
          sendMessage({ 
            type: 'verificationSent', 
            verificationId: confirmationResult.verificationId 
          });
        })
        .catch(function(error) {
          sendMessage({ type: 'debug', message: 'OTP error: ' + error.code + ' - ' + error.message });
          
          var errorMsg = 'Failed to send code';
          if (error.code === 'auth/invalid-phone-number') {
            errorMsg = 'Invalid phone number format.';
          } else if (error.code === 'auth/too-many-requests') {
            errorMsg = 'Too many attempts. Please wait and try again.';
          } else if (error.code === 'auth/quota-exceeded') {
            errorMsg = 'SMS quota exceeded. Try again later.';
          } else if (error.code === 'auth/operation-not-allowed') {
            errorMsg = 'Phone auth is not enabled. Contact support.';
          } else {
            errorMsg = error.message || 'Unknown error';
          }
          
          showError(errorMsg, error.code);
        });
    }
    
    // Start after a small delay
    setTimeout(init, 100);
  </script>
</body>
</html>
  `;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCloseModal}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Phone Verification</Text>
          
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>{statusText}</Text>
            </View>
          )}
          
          {errorText && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Error</Text>
              <Text style={styles.errorText}>{errorText}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => {
                  setErrorText(null);
                  setLoading(true);
                  setWebViewKey(prev => prev + 1);
                }}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <WebView
            ref={webViewRef}
            key={webViewKey}
            source={{ 
              html,
              baseUrl: `https://${authDomain}`
            }}
            style={[styles.webview, (loading || errorText) && styles.webviewHidden]}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            mixedContentMode="always"
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            cacheEnabled={false}
            incognito={false}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            allowFileAccessFromFileURLs={true}
            onError={(e) => {
              console.error('[reCAPTCHA] WebView error:', e.nativeEvent);
              setErrorText(`WebView error: ${e.nativeEvent.description || 'Unknown'}`);
              setLoading(false);
            }}
          />
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '92%',
    maxWidth: 400,
    height: 450,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  webviewHidden: {
    opacity: 0,
    height: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    zIndex: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    zIndex: 6,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FirebaseRecaptchaVerifierModal;
