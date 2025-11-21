import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = 'enzo_user_profile';

export interface StoredUserProfile {
  uid: string;
  name: string;
  email: string;
  city: string;
  company: string;
  phone: string;
  userType: string;
  cachedAt: number; // Timestamp when cached
}

/**
 * Save user profile to local storage
 */
export const saveUserProfileToStorage = async (
  profile: StoredUserProfile
): Promise<void> => {
  try {
    const profileWithTimestamp = {
      ...profile,
      cachedAt: Date.now(),
    };

    await AsyncStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(profileWithTimestamp)
    );
    console.log('[UserStorage] User profile saved to local storage:', {
      name: profile.name,
      email: profile.email,
      company: profile.company,
      uid: profile.uid,
    });
  } catch (error) {
    console.error(
      '[UserStorage] Failed to save user profile to storage:',
      error
    );
  }
};

/**
 * Get user profile from local storage
 */
export const getUserProfileFromStorage =
  async (): Promise<StoredUserProfile | null> => {
    try {
      const storedProfile = await AsyncStorage.getItem(USER_STORAGE_KEY);

      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        const profile: StoredUserProfile = {
          uid: parsedProfile.uid,
          name: parsedProfile.name,
          email: parsedProfile.email,
          city: parsedProfile.city,
          company: parsedProfile.company ?? '',
          phone: parsedProfile.phone,
          userType: parsedProfile.userType,
          cachedAt: parsedProfile.cachedAt,
        };
        console.log('[UserStorage] User profile loaded from local storage:', {
          name: profile.name,
          email: profile.email,
          company: profile.company,
          cachedAge:
            Math.round((Date.now() - profile.cachedAt) / (1000 * 60)) +
            ' minutes ago',
        });
        return profile;
      }

      console.log('[UserStorage] No user profile found in local storage');
      return null;
    } catch (error) {
      console.error(
        '[UserStorage] Failed to get user profile from storage:',
        error
      );
      return null;
    }
  };

/**
 * Clear user profile from local storage (for logout)
 */
export const clearUserProfileFromStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    console.log('[UserStorage] User profile cleared from local storage');
  } catch (error) {
    console.error(
      '[UserStorage] Failed to clear user profile from storage:',
      error
    );
  }
};

/**
 * Check if cached profile is still valid (within 7 days)
 */
export const isCachedProfileValid = (profile: StoredUserProfile): boolean => {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const age = Date.now() - profile.cachedAt;
  return age < maxAge;
};
