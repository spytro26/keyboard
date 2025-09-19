import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions, Modal, FlatList } from 'react-native';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '@/firebase';
import { router } from 'expo-router';

export default function SignUpScreen() {
    const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [phone, setPhone] = useState('');
    const [userType, setUserType] = useState('');
    const [verificationId, setVerificationId] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [showUserTypeDropdown, setShowUserTypeDropdown] = useState(false);

    const userTypeOptions = [
        { label: 'End User', value: 'end_user' },
        { label: 'System Integrator', value: 'system_integrator' },
        { label: 'OEM', value: 'oem' },
        { label: 'Other', value: 'other' }
    ];

    const UserTypeDropdown = () => (
        <View style={styles.dropdownContainer}>
            <TouchableOpacity 
                style={styles.dropdownButton} 
                onPress={() => setShowUserTypeDropdown(true)}
            >
                <Text style={[styles.dropdownText, !userType && styles.placeholderText]}>
                    {userType ? userTypeOptions.find(option => option.value === userType)?.label : 'Select user type'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            <Modal
                visible={showUserTypeDropdown}
                transparent
                animationType="fade"
                onRequestClose={() => setShowUserTypeDropdown(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowUserTypeDropdown(false)}
                >
                    <View style={styles.modalContent}>
                        <FlatList
                            data={userTypeOptions}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.dropdownOption}
                                    onPress={() => {
                                        setUserType(item.value);
                                        setShowUserTypeDropdown(false);
                                    }}
                                >
                                    <Text style={styles.dropdownOptionText}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );

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
            console.log(`[SignUp] City: "${city}"`);
            console.log(`[SignUp] User Type: "${userType}"`);

            // 1. Validate inputs first
            if (phone.length !== 10) {
                console.error('[SignUp] VALIDATION FAILED: Phone number is not 10 digits');
                Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
                setLoading(false);
                return;
            }
            if (!name || !email || !city || !userType) {
                console.error('[SignUp] VALIDATION FAILED: Missing required fields');
                console.log(`[SignUp] Missing fields - Name: ${!name}, Email: ${!email}, City: ${!city}, User Type: ${!userType}`);
                Alert.alert('Missing Information', 'Please fill all required fields before sending OTP.');
                setLoading(false);
                return;
            }

            console.log('[SignUp] ✅ All validations passed');
            
            // 2. COMPREHENSIVE DEBUGGING AND PHONE CHECK
            const fullPhoneNumber = `+91${phone}`;
            console.log('=== COMPREHENSIVE DEBUGGING START ===');
            console.log(`[SignUp] 📱 Raw input: "${phone}"`);
            console.log(`[SignUp] 📱 Formatted with country code: "${fullPhoneNumber}"`);
            console.log(`[SignUp] 🔍 Will check Firestore for existing users`);
            console.log(`[SignUp] 🔍 Firebase project: ${firebaseConfig.projectId}`);
            console.log(`[SignUp] 🔍 Database collection: "users"`);
            console.log(`[SignUp] 🔍 Query field: "phone"`);
            console.log(`[SignUp] 🔍 Query value: "${fullPhoneNumber}"`);
            
            // IMPORTANT EXPLANATION FOR DEBUGGING
            console.log('=== WHY WE CHECK FIRESTORE, NOT FIREBASE AUTH ===');
            console.log('[SignUp] ❗ Firebase Auth verifyPhoneNumber() does NOT check existing users');
            console.log('[SignUp] ❗ It will send OTP to ANY phone number, even if already registered');
            console.log('[SignUp] ❗ We must manually check Firestore users collection');
            console.log('[SignUp] ❗ All users who complete signup should be stored in Firestore');
            
            try {
                console.log('[SignUp] 🔍 Step 1: Creating Firestore collection reference...');
                const usersRef = collection(db, 'users');
                console.log('[SignUp] ✅ Collection reference created');
                
                console.log('[SignUp] 🔍 Step 2: Creating query...');
                const phoneQuery = query(usersRef, where('phone', '==', fullPhoneNumber));
                console.log(`[SignUp] ✅ Query created: WHERE phone == "${fullPhoneNumber}"`);
                
                console.log('[SignUp] 🔍 Step 3: Executing Firestore query...');
                console.log('[SignUp] 🌐 This will make network requests to Firestore');
                const querySnapshot = await getDocs(phoneQuery);
                
                console.log('=== FIRESTORE QUERY RESULTS ===');
                console.log(`[SignUp] 📊 Query executed successfully`);
                console.log(`[SignUp] 📊 Documents found: ${querySnapshot.size}`);
                console.log(`[SignUp] 📊 Is empty: ${querySnapshot.empty}`);
                console.log(`[SignUp] 📊 Metadata: ${JSON.stringify(querySnapshot.metadata)}`);
                
                if (!querySnapshot.empty) {
                    // PHONE NUMBER ALREADY EXISTS
                    console.log('=== 🚨 PHONE NUMBER ALREADY REGISTERED 🚨 ===');
                    console.error(`[SignUp] ❌ Found ${querySnapshot.size} existing user(s) with phone: ${fullPhoneNumber}`);
                    
                    querySnapshot.forEach((doc, index) => {
                        const userData = doc.data();
                        console.error(`[SignUp] ❌ Existing User #${index + 1}:`);
                        console.error(`[SignUp] ❌   Document ID: ${doc.id}`);
                        console.error(`[SignUp] ❌   Name: ${userData.name || 'N/A'}`);
                        console.error(`[SignUp] ❌   Phone: ${userData.phone || 'N/A'}`);
                        console.error(`[SignUp] ❌   Email: ${userData.email || 'N/A'}`);
                        console.error(`[SignUp] ❌   Created: ${userData.createdAt || 'N/A'}`);
                    });
                    
                    console.error('[SignUp] ❌ RESULT: BLOCKING SIGNUP ATTEMPT');
                    console.error('[SignUp] ❌ RESULT: Will NOT send OTP');
                    console.error('[SignUp] ❌ RESULT: Will NOT navigate to OTP page');
                    
                    Alert.alert(
                        'Phone Number Already Registered', 
                        `The phone number ${fullPhoneNumber} is already associated with an existing account. Please use a different number or sign in instead.`
                    );
                    
                    setLoading(false);
                    return; // STOP - Phone number is taken
                }
                
                // PHONE NUMBER IS AVAILABLE
                console.log('=== ✅ PHONE NUMBER IS AVAILABLE ✅ ===');
                console.log(`[SignUp] ✅ No existing users found with phone: ${fullPhoneNumber}`);
                console.log(`[SignUp] ✅ Phone number is available for new registration`);
                console.log(`[SignUp] ✅ Proceeding to send OTP...`);
                
            } catch (firestoreError: any) {
                console.error('=== 💥 FIRESTORE ERROR 💥 ===');
                console.error('[SignUp] 💥 Failed to query Firestore');
                console.error('[SignUp] 💥 Error code:', firestoreError.code);
                console.error('[SignUp] 💥 Error message:', firestoreError.message);
                console.error('[SignUp] 💥 Full error:', JSON.stringify(firestoreError, null, 2));
                
                if (firestoreError.code === 'permission-denied') {
                    console.error('[SignUp] 💥 PERMISSION DENIED - Check Firestore security rules');
                    console.error('[SignUp] 💥 Firestore rules might be blocking reads');
                    console.error('[SignUp] 💥 Default rules only allow authenticated users');
                    Alert.alert('Database Access Denied', 'Please contact support. Database configuration issue.');
                } else if (firestoreError.code === 'unavailable') {
                    console.error('[SignUp] 💥 FIRESTORE UNAVAILABLE - Network or service issue');
                    Alert.alert('Connection Error', 'Please check your internet connection and try again.');
                } else {
                    Alert.alert('Database Error', 'Failed to check existing users. Please try again.');
                }
                
                setLoading(false);
                return;
            }

            // 3. SEND OTP (Phone number confirmed available)
            console.log('=== SENDING OTP TO NEW PHONE NUMBER ===');
            console.log('[SignUp] 📞 Phone number verified as available');
            console.log('[SignUp] 📞 Creating PhoneAuthProvider...');
            
            const provider = new PhoneAuthProvider(auth);
            console.log('[SignUp] 📞 Attempting to send OTP...');
            console.log('[SignUp] 🌐 This will make network requests to Firebase Auth');
            
            try {
                const id = await provider.verifyPhoneNumber(fullPhoneNumber, recaptchaVerifier.current!);
                
                console.log('=== ✅ OTP SENT SUCCESSFULLY ✅ ===');
                console.log(`[SignUp] ✅ OTP sent to: ${fullPhoneNumber}`);
                console.log(`[SignUp] ✅ Verification ID: ${id}`);
                console.log(`[SignUp] ✅ User will now see OTP input field`);
                
                setVerificationId(id); // This shows the OTP input UI
                Alert.alert('OTP Sent', 'A verification code has been sent to your phone number.');
                
            } catch (otpError: any) {
                console.error('=== 💥 OTP SENDING ERROR 💥 ===');
                console.error('[SignUp] 💥 Failed to send OTP');
                console.error('[SignUp] 💥 Error code:', otpError.code);
                console.error('[SignUp] 💥 Error message:', otpError.message);
                console.error('[SignUp] 💥 Full error:', JSON.stringify(otpError, null, 2));
                
                Alert.alert('OTP Error', `Failed to send OTP. Please try again. (${otpError.code})`);
            }

        } catch (e: any) {
            console.error('=== 💥 GENERAL ERROR 💥 ===');
            console.error('[SignUp] 💥 Unexpected error in sendCode function');
            console.error('[SignUp] 💥 Error:', e);
            Alert.alert('Unexpected Error', 'Something went wrong. Please try again.');
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

            // Save user data to Firestore (this creates the record we check against)
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name,
                email,
                city,
                phone: `+91${phone}`,
                userType,
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
                            <TextInput 
                                style={styles.input} 
                                placeholder="Full name" 
                                placeholderTextColor="#6b7280" 
                                value={name} 
                                onChangeText={setName} 
                                returnKeyType="next" 
                                autoCapitalize="words"
                            />
                            <TextInput 
                                style={styles.input} 
                                placeholder="Email" 
                                placeholderTextColor="#6b7280" 
                                autoCapitalize="none" 
                                keyboardType="email-address" 
                                value={email} 
                                onChangeText={setEmail} 
                                returnKeyType="next" 
                            />
                            <TextInput 
                                style={styles.input} 
                                placeholder="City" 
                                placeholderTextColor="#6b7280" 
                                value={city} 
                                onChangeText={setCity} 
                                returnKeyType="next" 
                                autoCapitalize="words"
                            />
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
                            <UserTypeDropdown />
                            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={sendCode} disabled={loading}>
                                <Text style={styles.buttonText}>{loading ? 'Checking...' : 'Send OTP'}</Text>
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
                                placeholderTextColor="#6b7280"
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
    // Dropdown styles
    dropdownContainer: {
        marginBottom: 12,
    },
    dropdownButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 16,
        color: '#111827',
    },
    placeholderText: {
        color: '#6b7280',
    },
    dropdownArrow: {
        fontSize: 12,
        color: '#6b7280',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: width * 0.8,
        maxHeight: 300,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dropdownOption: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownOptionText: {
        fontSize: 16,
        color: '#111827',
        textAlign: 'center',
    },
});