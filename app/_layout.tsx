import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { StorageProvider } from '@/hooks/StorageProvider';
import { FreezerStorageProvider } from '@/hooks/FreezerStorageProvider';
import { BlastStorageProvider } from '@/hooks/BlastStorageProvider';
import { AuthProvider, useAuth } from '@/hooks/AuthProvider';
import React, { useEffect } from 'react';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthRoutes = pathname === '/sign-in' || pathname === '/sign-up';
    if (!user && !inAuthRoutes) {
      router.replace({ pathname: '/sign-in' } as any);
    } else if (user && inAuthRoutes) {
      router.replace('/');
    }
  }, [user, loading, pathname]);

  return <>{children}</>;
}

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
