import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { InputField } from '@/components/InputField';
import { CategorizedBlastProductPicker } from '@/components/CategorizedBlastProductPicker';
import { useBlastStorageContext } from '@/hooks/BlastStorageProvider';

export default function BlastProductTab() {
    const { productData, saveProductData } = useBlastStorageContext();

    const handleProductSelect = (productName: string, productInfo?: any) => {
        if (productInfo) {
            saveProductData({
                ...productData,
                productName,
                cpAboveFreezing: productInfo.cpAboveFreezing,
                cpBelowFreezing: productInfo.cpBelowFreezing,
                latentHeat: productInfo.latentHeatOfFusion,
            });
        }
    };

    const handleValueChange = (field: string, value: string) => {
        const numericValue = parseFloat(value) || 0;
        saveProductData({
            ...productData,
            [field]: numericValue,
        });
    };

    const handleUnitChange = (field: string, unit: string) => {
        saveProductData({
            ...productData,
            [field]: unit,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
                contentContainerStyle={{ paddingBottom: 32 }}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Enzo Cool Calc</Text>
                        <Text style={styles.subtitle}>Blast Freezer Product Load & Freezing Process</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Product Information</Text>

                        <CategorizedBlastProductPicker
                            selected={productData.productName || 'Custom'}
                            onSelect={handleProductSelect}
                        />

                        <InputField
                            label="Product Entering Temperature"
                            value={productData.productEnteringTemp.toString()}
                            onChangeText={(value) => handleValueChange('productEnteringTemp', value)}
                            keyboardType="numbers-and-punctuation"
                            placeholder="-5"
                            unitOptions={['°C', '°F']}
                            selectedUnit={productData.tempUnit === 'F' ? '°F' : '°C'}
                            onUnitChange={(unit) => handleUnitChange('tempUnit', unit === '°F' ? 'F' : 'C')}
                            allowNegative={true}
                        />

                        <InputField
                            label="Product Final Temperature"
                            value={productData.productFinalTemp.toString()}
                            onChangeText={(value) => handleValueChange('productFinalTemp', value)}
                            keyboardType="numbers-and-punctuation"
                            placeholder="-30"
                            unitOptions={['°C', '°F']}
                            selectedUnit={productData.tempUnit === 'F' ? '°F' : '°C'}
                            onUnitChange={(unit) => handleUnitChange('tempUnit', unit === '°F' ? 'F' : 'C')}
                            allowNegative={true}
                        />

                        <InputField
                            label="Pull Down Hours"
                            value={productData.pullDownHours.toString()}
                            onChangeText={(value) => handleValueChange('pullDownHours', value)}
                            keyboardType="decimal-pad"
                            placeholder="8"
                            unit="hrs"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Product Weight & Processing</Text>

                        <InputField
                            label="Capacity Required"
                            value={productData.capacityRequired?.toString() || '0'}
                            onChangeText={(value) => handleValueChange('capacityRequired', value)}
                            keyboardType="decimal-pad"
                            placeholder="2000"
                            unitOptions={['kg', 'lbs']}
                            selectedUnit={productData.massUnit === 'lbs' ? 'lbs' : 'kg'}
                            onUnitChange={(unit) => handleUnitChange('massUnit', unit)}
                        />

                        <InputField
                            label="Batch Hours"
                            value={productData.batchHours?.toString() || '0'}
                            onChangeText={(value) => handleValueChange('batchHours', value)}
                            keyboardType="decimal-pad"
                            placeholder="8"
                            unit="hrs"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Product Thermal Properties</Text>

                        <InputField
                            label="Cp Above Freezing"
                            value={productData.cpAboveFreezing.toString()}
                            onChangeText={(value) => handleValueChange('cpAboveFreezing', value)}
                            keyboardType="decimal-pad"
                            placeholder="3.49"
                            unit="kJ/kg·K"
                        />

                        <InputField
                            label="Cp Below Freezing"
                            value={productData.cpBelowFreezing.toString()}
                            onChangeText={(value) => handleValueChange('cpBelowFreezing', value)}
                            keyboardType="decimal-pad"
                            placeholder="2.14"
                            unit="kJ/kg·K"
                        />

                        <InputField
                            label="Latent Heat"
                            value={productData.latentHeat.toString()}
                            onChangeText={(value) => handleValueChange('latentHeat', value)}
                            keyboardType="decimal-pad"
                            placeholder="233"
                            unit="kJ/kg"
                        />

                        <InputField
                            label="Freezing Point"
                            value={productData.freezingPoint.toString()}
                            onChangeText={(value) => handleValueChange('freezingPoint', value)}
                            keyboardType="numbers-and-punctuation"
                            placeholder="-1.7"
                            unitOptions={['°C', '°F']}
                            selectedUnit={productData.tempUnit === 'F' ? '°F' : '°C'}
                            onUnitChange={(unit) => handleUnitChange('tempUnit', unit === '°F' ? 'F' : 'C')}
                            allowNegative={true}
                        />
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Powered by Enzo</Text>
                    </View>
                </View>
            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
        paddingVertical: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: 8,
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 22,
    },
    section: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: 16,
        letterSpacing: -0.3,
        textAlign: 'left',
    },
    sectionSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        marginBottom: 12,
    },
    footer: {
        marginTop: 32,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic',
    },
});
