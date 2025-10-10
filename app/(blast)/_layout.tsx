import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavArrows } from '@/components/BottomNavArrows';

export default function BlastTabsLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const tabRoutes = ['/', '/product', '/miscellaneous', '/results'] as const;
  const tabTitles = ['Room Details', 'Product', 'Miscellaneous', 'Results'];

  const getTabIndex = (pathname: string) => {
    if (pathname.includes('/index')) return 0;
    if (pathname.includes('/product')) return 1;
    if (pathname.includes('/miscellaneous')) return 2;
    if (pathname.includes('/results')) return 3;
    return 0;
  };

  const getCurrentTabIndex = () => getTabIndex(pathname);
  const isResultsPage = pathname.includes('/results');

  const navigateToTab = (direction: 'left' | 'right') => {
    const currentIndex = getCurrentTabIndex();
    let newIndex;
    if (direction === 'left') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : tabRoutes.length - 1;
    } else {
      newIndex = currentIndex < tabRoutes.length - 1 ? currentIndex + 1 : 0;
    }

    router.push(`(blast)${tabRoutes[newIndex]}` as any);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e40af" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blast Freezer Calculator</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.tabsWrapper}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#1e40af',
            tabBarInactiveTintColor: '#6b7280',
            tabBarStyle: {
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              height: 60,
              paddingBottom: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Room Details',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="cube-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="product"
            options={{
              title: 'Product',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="leaf-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="miscellaneous"
            options={{
              title: 'Miscellaneous',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="settings-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="results"
            options={{
              title: 'Results',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="calculator-outline" size={size} color={color} />
              ),
            }}
          />
        </Tabs>

        {!isResultsPage && (
          <BottomNavArrows
            onLeftPress={() => navigateToTab('left')}
            onRightPress={() => navigateToTab('right')}
            isFixed={true}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrapper: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: 8,
    letterSpacing: -0.5,
    minWidth: 0,
  },
  spacer: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
