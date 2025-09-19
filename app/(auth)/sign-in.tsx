import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions } from 'react-native';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '@/firebase';
import { router } from 'expo-router';

export default function SignInScreen() {
    const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
    const [mode, setMode] = useState<'login' | 'otp'>('login');
    const [phone, setPhone] = useState('');
    const [verificationId, setVerificationId] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    // Handle phone number input - only numbers, max 10 digits
    const handlePhoneChange = (text: string) => {
        const numericText = text.replace(/[^0-9]/g, '');
        if (numericText.length <= 10) {
            setPhone(numericText);
        }
    };

    // Handle OTP input - only numbers, max 6 digits
    const handleOTPChange = (text: string) => {
        const numericText = text.replace(/[^0-9]/g, '');
        if (numericText.length <= 6) {
            setCode(numericText);
        }
    };

    // Send OTP if user exists
    const sendOTPForLogin = async () => {
        setLoading(true);
        try {
            if (phone.length !== 10) {
                Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
                setLoading(false);
                return;
            }

            const fullPhoneNumber = `+91${phone}`;
            console.log(`[SignIn] Checking for existing user with phone: ${fullPhoneNumber}`);

            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('phone', '==', fullPhoneNumber));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.error('[SignIn] Error: No user found with this phone number.');
                Alert.alert('Account Not Found', 'No account is associated with this phone number. Please sign up first.');
                setLoading(false);
                return;
            }

            console.log('[SignIn] User found. Sending OTP...');
            const provider = new PhoneAuthProvider(auth);
            const id = await provider.verifyPhoneNumber(fullPhoneNumber, recaptchaVerifier.current!);
            setVerificationId(id);
            setMode('otp');
            Alert.alert('OTP Sent', 'A verification code has been sent to your phone number.');

        } catch (e: any) {
            console.error('[SignIn] Send OTP Error:', JSON.stringify(e, null, 2));
            Alert.alert('Error Sending OTP', `Failed to send OTP. Please try again. (Code: ${e.code})`);
        } finally {
            setLoading(false);
        }
    };

    // Confirm OTP and sign in
    const confirmOTPForLogin = async () => {
        setLoading(true);
        try {
            if (!verificationId) {
                Alert.alert('Verification Error', 'Could not verify phone number. Please try sending the OTP again.');
                setLoading(false);
                return;
            }
            if (code.length !== 6) {
                Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP.');
                setLoading(false);
                return;
            }

            console.log('[SignIn] Verifying OTP...');
            const credential = PhoneAuthProvider.credential(verificationId, code);
            await signInWithCredential(auth, credential);
            
            console.log('[SignIn] Sign-in successful. Navigating to home.');
            router.replace('/');

        } catch (e: any) {
            console.error('[SignIn] OTP Verification Failed:', JSON.stringify(e, null, 2));
            let title = 'Sign-In Failed';
            let message = 'An unexpected error occurred. Please try again.';

            switch (e.code) {
                case 'auth/invalid-verification-code':
                    title = 'Invalid OTP';
                    message = 'The OTP you entered is incorrect. Please try again.';
                    break;
                case 'auth/code-expired':
                    title = 'OTP Expired';
                    message = 'The OTP has expired. Please request a new one.';
                    break;
                default:
                    message = `An error occurred during sign-in. (Code: ${e.code})`;
            }
            Alert.alert(title, message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <SafeAreaView style={styles.container}>
            <FirebaseRecaptchaVerifierModal
                ref={recaptchaVerifier}
                firebaseConfig={firebaseConfig as any}
                attemptInvisibleVerification
            />
            <KeyboardAvoidingView 
                behavior={Platform.select({ ios: 'padding', android: 'height' })} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
            >
                <ScrollView 
                    contentContainerStyle={styles.content} 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={styles.logoContainer}>
                        <Image 
                            source={require('@/assets/images/logo.png')} 
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.appName}>CoolCalc</Text>
                    </View>
                    
                    <Text style={styles.title}>
                        {mode === 'login' ? 'Welcome back' : 'Verify Phone'}
                    </Text>

                    {mode === 'login' ? (
                        <>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Phone number (10 digits)" 
                                placeholderTextColor="#6b7280"
                                keyboardType="number-pad" 
                                value={phone} 
                                onChangeText={handlePhoneChange}
                                maxLength={10}
                                returnKeyType="done"
                            />
                            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={sendOTPForLogin} disabled={loading}>
                                <Text style={styles.buttonText}>{loading ? 'Sending OTP...' : 'Send OTP'}</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.subtitle}>Enter the OTP sent to +91{phone}</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Enter 6-digit OTP" 
                                placeholderTextColor="#6b7280"
                                keyboardType="number-pad" 
                                value={code} 
                                onChangeText={handleOTPChange}
                                maxLength={6}
                                returnKeyType="done"
                            />
                            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={confirmOTPForLogin} disabled={loading}>
                                <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify & Sign In'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.link} onPress={() => setMode('login')}>
                                <Text style={styles.linkText}>← Back to phone number</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {mode === 'login' && (
                        <TouchableOpacity style={styles.link} onPress={() => router.replace('/sign-up' as any)}>
                            <Text style={styles.linkText}>New here? Create account</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { 
        padding: 16, 
        flexGrow: 1, 
        justifyContent: 'center',
        minHeight: '100%',
        paddingBottom: 50,
    },
    logoContainer: { 
        alignItems: 'center', 
        marginBottom: 24,
        paddingVertical: 20,
    },
    logo: { 
        width: Math.min(width * 0.15, 80), 
        height: Math.min(width * 0.15, 80), 
        marginBottom: 8,
    },
    appName: { 
        fontSize: Math.min(width * 0.06, 24), 
        fontWeight: '900', 
        color: '#000000', 
    },
    title: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center', color: '#111827' },
    subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 10 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 12 },
    button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 10, alignItems: 'center' },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontWeight: '700' },
    link: { marginTop: 12, alignItems: 'center' },
    linkText: { color: '#2563eb', fontWeight: '600' },
});
