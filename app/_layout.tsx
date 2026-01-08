import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { StorageProvider } from '@/hooks/StorageProvider';
import { FreezerStorageProvider } from '@/hooks/FreezerStorageProvider';
import { BlastStorageProvider } from '@/hooks/BlastStorageProvider';
import { AuthProvider, useAuth } from '@/hooks/AuthProvider';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';

// Loading screen shown while checking auth state
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Image
        source={require('@/assets/images/output_450x255.jpg')}
        style={styles.loadingLogo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
    </View>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, isGuestMode } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inFreezerGroup = segments[0] === '(freezer)';
    const inBlastGroup = segments[0] === '(blast)';
    const inAppSection = inTabsGroup || inFreezerGroup || inBlastGroup;

    console.log('[AuthGate] Auth state:', { user: !!user, isGuestMode, segments });

    if (!user && !isGuestMode && !inAuthGroup) {
      // User is not signed in, not in guest mode, and not on auth screen -> go to sign-up
      console.log('[AuthGate] No user and not guest, redirecting to sign-up');
      router.replace('/sign-up');
    } else if (user && !inAppSection) {
      // User is signed in but not in app section -> go directly to cold room
      console.log('[AuthGate] User logged in, redirecting to cold room');
      router.replace('/(tabs)');
    } else if (isGuestMode && !inAppSection && !inAuthGroup) {
      // Guest user not in app section -> go to cold room
      console.log('[AuthGate] Guest mode, redirecting to cold room');
      router.replace('/(tabs)');
    } else {
      // Already in correct section, stop showing loading
      setIsNavigating(false);
    }
  }, [user, loading, segments, isGuestMode]);

  // Show loading screen while checking auth state OR while navigating
  if (loading || isNavigating) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingLogo: {
    width: 200,
    height: 113,
    marginBottom: 20,
  },
  spinner: {
    marginTop: 20,
  },
});

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <StorageProvider>
        <FreezerStorageProvider>
          <BlastStorageProvider>
            <AuthGate>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(freezer)" options={{ headerShown: false }} />
                <Stack.Screen name="(blast)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </AuthGate>
          </BlastStorageProvider>
        </FreezerStorageProvider>
      </StorageProvider>
    </AuthProvider>
  );
}
