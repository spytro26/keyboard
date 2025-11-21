import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { 
    saveUserProfileToStorage, 
    getUserProfileFromStorage, 
    clearUserProfileFromStorage, 
    isCachedProfileValid,
    type StoredUserProfile 
} from '@/utils/userStorage';

type UserProfile = {
    uid: string;
    name: string;
    email: string;
    city: string;
    company: string;
    phone: string;
    userType: string;
    createdAt: any;
    updatedAt: any;
};

type AuthContextValue = {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    // Helper function to get display name with fallback
    getUserDisplayName: () => string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper function to get display name with fallback
    const getUserDisplayName = (): string => {
        if (userProfile?.name) {
            return userProfile.name;
        }
        return 'User'; // Default fallback name
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            
            if (u) {
                console.log('[AuthProvider] User authenticated, fetching profile...');
                
                // First, try to load from local storage for immediate display
                const cachedProfile = await getUserProfileFromStorage();
                if (cachedProfile && isCachedProfileValid(cachedProfile)) {
                    console.log('[AuthProvider] Using valid cached profile');
                    setUserProfile({
                        uid: cachedProfile.uid,
                        name: cachedProfile.name,
                        email: cachedProfile.email,
                        city: cachedProfile.city,
                        company: cachedProfile.company,
                        phone: cachedProfile.phone,
                        userType: cachedProfile.userType,
                        createdAt: null, // Not stored in cache
                        updatedAt: null  // Not stored in cache
                    });
                }
                
                // Then, try to fetch fresh data from Firestore
                try {
                    console.log('[AuthProvider] Fetching fresh user profile from Firestore for UID:', u.uid);
                    const userDocRef = doc(db, 'users', u.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists()) {
                        const rawData = userDoc.data();
                        const profileData: UserProfile = {
                            uid: rawData.uid ?? u.uid,
                            name: rawData.name ?? '',
                            email: rawData.email ?? '',
                            city: rawData.city ?? '',
                            company: rawData.company ?? '',
                            phone: rawData.phone ?? (u.phoneNumber || ''),
                            userType: rawData.userType ?? 'end_user',
                            createdAt: rawData.createdAt ?? null,
                            updatedAt: rawData.updatedAt ?? null,
                        };
                        console.log('[AuthProvider] Fresh user profile loaded from Firestore:', {
                            name: profileData.name,
                            email: profileData.email,
                            city: profileData.city,
                            company: profileData.company,
                            userType: profileData.userType
                        });
                        
                        setUserProfile(profileData);
                        
                        // Save to local storage for offline use
                        await saveUserProfileToStorage({
                            uid: profileData.uid,
                            name: profileData.name,
                            email: profileData.email,
                            city: profileData.city,
                            company: profileData.company,
                            phone: profileData.phone,
                            userType: profileData.userType,
                            cachedAt: Date.now()
                        });
                    } else {
                        console.warn('[AuthProvider] User document not found in Firestore for UID:', u.uid);
                        // Keep cached profile if available, otherwise set to null
                        if (!cachedProfile) {
                            setUserProfile(null);
                        }
                    }
                } catch (error) {
                    console.error('[AuthProvider] Failed to fetch user profile from Firestore:', error);
                    console.log('[AuthProvider] Using cached profile or falling back to defaults');
                    
                    // If we don't have cached data and Firestore fails, use a minimal profile
                    if (!cachedProfile) {
                        console.warn('[AuthProvider] No cached profile available, creating minimal profile');
                        setUserProfile({
                            uid: u.uid,
                            name: 'User', // Default name for offline users
                            email: u.email || '',
                            city: '',
                            company: '',
                            phone: u.phoneNumber || '',
                            userType: 'end_user',
                            createdAt: null,
                            updatedAt: null
                        });
                    }
                }
            } else {
                console.log('[AuthProvider] User signed out, clearing profile');
                setUserProfile(null);
                await clearUserProfileFromStorage();
            }
            
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const signOut = async () => {
        await clearUserProfileFromStorage();
        await fbSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signOut, getUserDisplayName }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
