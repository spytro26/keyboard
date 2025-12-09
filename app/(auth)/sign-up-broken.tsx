import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions } from 'react-native';
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaVerifierModalHandle, createPhoneAuthRecaptchaVerifier } from '@/components/FirebaseRecaptcha';
import { PhoneAuthProvider, signInWithCredential, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '@/firebase';
import { router } from 'expo-router';

export default function SignUpScreen() {
    const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModalHandle>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
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

    const sendCode = async () => {
        setLoading(true);
        try {
            console.log('=== SIGNUP PROCESS STARTED ===');
            console.log(`[SignUp] Raw phone input: "${phone}"`);
            console.log(`[SignUp] Phone length: ${phone.length}`);
            console.log(`[SignUp] Name: "${name}"`);
            console.log(`[SignUp] Email: "${email}"`);
            console.log(`[SignUp] Address: "${address}"`);

            // 1. Validate inputs first
            if (phone.length !== 10) {
                console.error('[SignUp] VALIDATION FAILED: Phone number is not 10 digits');
                Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
                setLoading(false);
                return;
            }
            if (!name || !email || !address) {
                console.error('[SignUp] VALIDATION FAILED: Missing required fields');
                console.log(`[SignUp] Missing fields - Name: ${!name}, Email: ${!email}, Address: ${!address}`);
                Alert.alert('Missing Information', 'Please fill all required fields before sending OTP.');
                setLoading(false);
                return;
            }

            console.log('[SignUp] ✅ All validations passed');
            console.log('[SignUp] 🔍 CRITICAL: Now checking if phone number already exists...');

            // 2. Check if the user already exists - MULTIPLE APPROACHES
            const fullPhoneNumber = `+91${phone}`;
            const phoneWithoutPrefix = phone;
            const phoneVariants = [fullPhoneNumber, phoneWithoutPrefix, `91${phone}`, `0${phone}`];
            
            console.log(`[SignUp] 🔍 Formatted phone number for Firebase query: "${fullPhoneNumber}"`);
            console.log('[SignUp] 🔍 Starting Firebase query to check if phone exists...');
            console.log('[SignUp] 🔍 Will check these phone variants:', phoneVariants);
            
            // First, let's see all users in the database for debugging
            console.log('[SignUp] 🔍 DEBUG: Fetching ALL users to see what exists...');
            const allUsersRef = collection(db, 'users');
            const allUsersSnapshot = await getDocs(allUsersRef);
            console.log(`[SignUp] 🔍 DEBUG: Total users in database: ${allUsersSnapshot.size}`);
            
            let phoneNumberExists = false;
            let existingUserData = null;
            
            if (!allUsersSnapshot.empty) {
                console.log('[SignUp] 🔍 DEBUG: Existing users:');
                allUsersSnapshot.forEach((doc) => {
                    const userData = doc.data();
                    console.log(`[SignUp] 🔍 DEBUG: User ID: ${doc.id}, Phone: "${userData.phone}"`);
                    
                    // Check if any variant matches
                    if (phoneVariants.includes(userData.phone)) {
                        console.log(`[SignUp] 🔍 DEBUG: MATCH FOUND! Stored: "${userData.phone}" matches input variant`);
                        phoneNumberExists = true;
                        existingUserData = userData;
                    }
                });
            } else {
                console.log('[SignUp] 🔍 DEBUG: No users found in database');
            }
            
            // Also run the original query as backup
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('phone', '==', fullPhoneNumber));
            console.log('[SignUp] 🔍 Firebase query created, executing...');
            console.log(`[SignUp] 🔍 Searching for exact match: "${fullPhoneNumber}"`);
            
            const querySnapshot = await getDocs(q);
            console.log(`[SignUp] 📊 Firebase query completed`);
            console.log(`[SignUp] 📊 Query result - isEmpty: ${querySnapshot.empty}`);
            console.log(`[SignUp] 📊 Query result - size: ${querySnapshot.size}`);
            
            // Also run multiple queries for different formats as backup
            console.log('[SignUp] 🔍 Running additional queries for all phone variants...');
            for (const phoneVariant of phoneVariants) {
                console.log(`[SignUp] 🔍 Querying for phone variant: "${phoneVariant}"`);
                const variantQuery = query(usersRef, where('phone', '==', phoneVariant));
                const variantSnapshot = await getDocs(variantQuery);
                
                if (!variantSnapshot.empty) {
                    console.log(`[SignUp] 🔍 FOUND MATCH with variant "${phoneVariant}"!`);
                    phoneNumberExists = true;
                    variantSnapshot.forEach((doc) => {
                        console.log(`[SignUp] � Variant match - Document ID: ${doc.id}`);
                        console.log(`[SignUp] � Variant match - Document data:`, doc.data());
                        existingUserData = doc.data();
                    });
                    break; // Found a match, no need to continue
                } else {
                    console.log(`[SignUp] 🔍 No match found for variant: "${phoneVariant}"`);
                }
            }

            // Final check - if phone number exists in any format
            if (phoneNumberExists) {
                console.log('=== PHONE NUMBER ALREADY EXISTS - ABORTING SIGNUP ===');
                console.error('[SignUp] ❌ CRITICAL: Phone number already used in some format');
                console.error('[SignUp] ❌ CRITICAL: Input phone:', phoneVariants);
                console.error('[SignUp] ❌ CRITICAL: Existing user data:', existingUserData);
                console.error('[SignUp] ❌ CRITICAL: Will NOT send OTP');
                console.error('[SignUp] ❌ CRITICAL: Will NOT navigate to OTP page');
                console.error('[SignUp] ❌ CRITICAL: Showing error to user and returning');
                
                // Show error alert
                Alert.alert(
                    'Phone Number Already Registered', 
                    `This phone number is already registered with another account. Please use a different number or sign in with this number.`
                );
                
                // Set loading to false and return immediately
                setLoading(false);
                console.error('[SignUp] ❌ CRITICAL: Exiting function - SHOULD NOT PROCEED TO OTP');
                return;
            }

            // 3. Only if the user does NOT exist in Firestore, try to send OTP
            // This will ALSO check Firebase Authentication for existing users
            console.log('=== PHONE NUMBER IS NEW IN FIRESTORE - TRYING FIREBASE AUTH ===');
            console.log('[SignUp] ✅ Phone number not found in Firestore - checking Firebase Auth');
            console.log('[SignUp] ✅ No existing user found with any phone variant:', phoneVariants);
            console.log('[SignUp] 📞 Creating PhoneAuthProvider...');
            
            const provider = new PhoneAuthProvider(auth);
            console.log('[SignUp] 📞 Attempting to verify phone number...');
            console.log('[SignUp] 📞 This will also check if phone exists in Firebase Auth...');
            
            try {
                const verifier = createPhoneAuthRecaptchaVerifier(recaptchaVerifier);
                const id = await provider.verifyPhoneNumber(fullPhoneNumber, verifier);
                console.log(`[SignUp] ✅ OTP sent successfully, verification ID: ${id}`);
                
                setVerificationId(id); // This will trigger the UI to show the OTP field
                console.log('[SignUp] ✅ UI updated - showing OTP input field');
                
                Alert.alert('OTP Sent', 'A verification code has been sent to your phone number.');
                console.log('=== SIGNUP PROCESS - OTP SENT SUCCESSFULLY ===');
                
            } catch (otpError: any) {
                console.error('=== FIREBASE AUTH ERROR - CHECKING IF PHONE EXISTS ===');
                console.error('[SignUp] 🔍 OTP Error code:', otpError.code);
                console.error('[SignUp] 🔍 OTP Error message:', otpError.message);
                console.error('[SignUp] 🔍 Full OTP error:', JSON.stringify(otpError, null, 2));
                
                // Check if error indicates phone number already exists in Firebase Auth
                if (otpError.code === 'auth/too-many-requests' || 
                    otpError.code === 'auth/phone-number-already-exists' ||
                    otpError.code === 'auth/account-exists-with-different-credential' ||
                    otpError.message?.toLowerCase().includes('already') ||
                    otpError.message?.toLowerCase().includes('exists')) {
                    
                    console.error('=== PHONE NUMBER EXISTS IN FIREBASE AUTH - ABORTING ===');
                    console.error('[SignUp] ❌ CRITICAL: Phone number exists in Firebase Auth!');
                    console.error('[SignUp] ❌ CRITICAL: Error indicates existing user');
                    console.error('[SignUp] ❌ CRITICAL: Will NOT proceed with signup');
                    
                    Alert.alert(
                        'Phone Number Already Registered', 
                        `This phone number is already registered. Please use a different number or sign in with this number.`
                    );
                    
                    setLoading(false);
                    return;
                } else {
                    // Other errors - treat as genuine OTP sending errors
                    throw otpError; // Re-throw to be caught by outer catch block
                }
            }

        } catch (e: any) {
            console.error('=== SIGNUP PROCESS - ERROR OCCURRED ===');
            console.error('[SignUp] 💥 Send OTP Error - Full error object:', e);
            console.error('[SignUp] 💥 Error code:', e.code);
            console.error('[SignUp] 💥 Error message:', e.message);
            console.error('[SignUp] 💥 Error stringified:', JSON.stringify(e, null, 2));
            Alert.alert('Error Sending OTP', `Failed to send OTP. Please try again. (Code: ${e.code})`);
        } finally {
            console.log('[SignUp] 🏁 Setting loading to false');
            setLoading(false);
        }
    };

    const confirmAndSave = async () => {
        setLoading(true);
        try {
            if (!verificationId) {
                Alert.alert('Verification Error', 'Could not verify phone number. Please try sending the OTP again.');
                return;
            }
            if (code.length !== 6) {
                Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP.');
                return;
            }

            console.log('[SignUp] OTP verification started.');
            const credential = PhoneAuthProvider.credential(verificationId, code);
            const userCredential = await signInWithCredential(auth, credential);
            const user = userCredential.user;
            console.log(`[SignUp] Phone number verified and user created with UID: ${user.uid}`);

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name,
                email,
                phone: `+91${phone}`,
                address,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            console.log('[SignUp] User profile saved to Firestore. Registration complete.');
            Alert.alert('Account Created', 'Your account has been created successfully!');
            router.replace('/');

        } catch (e: any) {
            console.error('[SignUp] Confirmation Error:', JSON.stringify(e, null, 2));
            let title = 'Account Creation Failed';
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
                    message = `An error occurred during sign-up. (Code: ${e.code})`;
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
                    {/* Logo and App Name Section */}
                    <View style={styles.logoContainer}>
                        <Image 
                            source={require('@/assets/images/logo.png')} 
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.appName}>CoolCalc</Text>
                    </View>
                    
                    <Text style={styles.title}>Create account</Text>
                    {!verificationId ? (
                        <>
                            <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} returnKeyType="next" />
                            <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} returnKeyType="next" />
                            <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} returnKeyType="next" />
                            <TextInput 
                                style={styles.input} 
                                placeholder="Phone number (10 digits)" 
                                keyboardType="number-pad" 
                                value={phone} 
                                onChangeText={handlePhoneChange}
                                maxLength={10}
                                returnKeyType="done"
                            />
                            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={sendCode} disabled={loading}>
                                <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.link} onPress={() => router.replace('/sign-in' as any)}>
                                <Text style={styles.linkText}>Already have an account? Sign in</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.subtitle}>Enter the OTP sent to +91{phone}</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Enter 6-digit OTP" 
                                keyboardType="number-pad" 
                                value={code} 
                                onChangeText={handleOTPChange}
                                maxLength={6}
                                returnKeyType="done"
                            />
                            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={confirmAndSave} disabled={loading}>
                                <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify & Create Account'}</Text>
                            </TouchableOpacity>
                        </>
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
