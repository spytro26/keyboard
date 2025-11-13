import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function HomePage() {
    // Automatically redirect to cold room on app open
    useEffect(() => {
        console.log('[HomePage] Redirecting to cold room...');
        // Small delay to ensure Root Layout is mounted
        const timer = setTimeout(() => {
            router.replace('/(tabs)' as any);
        }, 100);
        
        return () => clearTimeout(timer);
    }, []);

    const handleColdRoomPress = () => {
        router.push('/(tabs)');
    };

    const handleBlasterPress = () => {
        router.push('/(blast)');
    };

    const handleFreezerPress = () => {
        router.push('/(freezer)');
    };

    const CalculatorButton = ({
        title,
        onPress,
        icon,
        color,
    }: {
        title: string;
        onPress: () => void;
        icon: keyof typeof Ionicons.glyphMap;
        color: string;
    }) => (
        <TouchableOpacity
            style={[styles.button, { borderColor: color }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
                <Ionicons name={icon} size={width < 400 ? 24 : 28} color="#ffffff" />
            </View>
            <Text style={[styles.buttonText, { color }]}>{title}</Text>
            <Ionicons name="chevron-forward" size={width < 400 ? 18 : 20} color={color} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            <View style={styles.content}>
                {/* Logo and App Title */}
                <View style={styles.titleContainer}>
                    <Image
                        source={require('@/assets/images/output_450x255.jpg')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appTitle}>CoolCalc</Text>
                    <Text style={styles.subtitle}>Heat Load Calculator</Text>
                </View>

                {/* Calculator Buttons */}
                <View style={styles.buttonsContainer}>
                    <CalculatorButton
                        title="Cold Room Calculator"
                        onPress={handleColdRoomPress}
                        icon="cube-outline"
                        color="#059669"
                    />

                    <CalculatorButton
                        title="Blast Freezer Calculator"
                        onPress={handleBlasterPress}
                        icon="flash-outline"
                        color="#dc2626"
                    />

                    <CalculatorButton
                        title="Freezer Room Calculator"
                        onPress={handleFreezerPress}
                        icon="snow-outline"
                        color="#2563eb"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    content: {
        flex: 1,
        paddingHorizontal: width < 400 ? 16 : 24,
        justifyContent: 'center',
        paddingTop: height * 0.05,
        paddingBottom: height * 0.05,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: height * 0.072,
        paddingHorizontal: width < 400 ? 16 : 26,
    },
    logo: {
        width: width < 400 ? width * 0.64 : width * 0.56,
        height: Math.min((width < 400 ? width * 0.64 : width * 0.56) * (255 / 450), 150),
        marginBottom: width < 400 ? 24 : 28,
        maxWidth: 264,
        maxHeight: 150,
        borderRadius: 18,
        overflow: 'hidden',
    },
    appTitle: {
        fontSize: width < 400 ? 35 : width > 500 ? 48 : 43,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: width < 400 ? 1 : 1.4,
        textAlign: 'center',
        marginBottom: 9,
        textShadowColor: 'rgba(15, 23, 42, 0.08)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        lineHeight: width < 400 ? 40 : 50,
    },
    subtitle: {
        fontSize: width < 400 ? 15 : width > 500 ? 18 : 17,
        fontWeight: '500',
        color: '#475569',
        letterSpacing: 0.65,
        textAlign: 'center',
        opacity: 0.87,
        lineHeight: width < 400 ? 20 : 24,
        paddingHorizontal: width < 400 ? 10 : 6,
    },
    buttonsContainer: {
        gap: width < 400 ? 16 : 20,
        paddingHorizontal: width < 400 ? 4 : 0,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: width < 400 ? 14 : 16,
        borderWidth: 2,
        paddingVertical: width < 400 ? 16 : 20,
        paddingHorizontal: width < 400 ? 18 : 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: width < 400 ? 2 : 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: width < 400 ? 8 : 12,
        elevation: width < 400 ? 4 : 8,
        minHeight: width < 400 ? 70 : 80,
    },
    iconContainer: {
        width: width < 400 ? 48 : 56,
        height: width < 400 ? 48 : 56,
        borderRadius: width < 400 ? 12 : 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: width < 400 ? 14 : 16,
    },
    buttonText: {
        flex: 1,
        fontSize: width < 400 ? 16 : 18,
        fontWeight: '600',
        letterSpacing: 0.2,
        lineHeight: width < 400 ? 20 : 22,
    },
});
