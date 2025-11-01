import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavArrowsProps {
  onLeftPress: () => void;
  onRightPress: () => void;
  isFixed?: boolean; // true for first 3 pages, false for results
  scrollY?: number; // optional scroll position to show/hide
  contentHeight?: number; // optional content height
  containerHeight?: number; // optional container height
}

export const BottomNavArrows: React.FC<BottomNavArrowsProps> = ({
  onLeftPress,
  onRightPress,
  isFixed = true,
  scrollY = 0,
  contentHeight = 0,
  containerHeight = 0,
}) => {
  const insets = useSafeAreaInsets();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // For fixed pages (first 3), always show arrows
    if (isFixed) {
      setIsVisible(true);
      return;
    }

    // For results page, show only when near bottom
    if (contentHeight > 0 && containerHeight > 0) {
      const scrollThreshold = contentHeight - containerHeight - 100; // 100px before bottom
      setIsVisible(scrollY >= scrollThreshold);
    } else {
      setIsVisible(true); // Default to visible if no scroll data
    }
  }, [isFixed, scrollY, contentHeight, containerHeight]);

  if (!isVisible && !isFixed) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'position' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.bottomNav,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <TouchableOpacity
          style={styles.bottomNavButton}
          onPress={onLeftPress}
          accessibilityLabel="Previous section"
        >
          <Ionicons name="chevron-back" size={28} color="#2563eb" />
        </TouchableOpacity>
        
        <View style={styles.centerTextContainer}>
          <Text style={styles.footerText}>Powered by Enzo</Text>
        </View>
        
        <TouchableOpacity
          style={styles.bottomNavButton}
          onPress={onRightPress}
          accessibilityLabel="Next section"
        >
          <Ionicons name="chevron-forward" size={28} color="#2563eb" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 16,
    marginTop: 24,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  bottomNavButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  centerTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
