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
import { ProductPicker } from '@/components/ProductPicker';
import { PRODUCT_PRESET_MAP } from '@/data/products';
import { useStorageContext } from '@/hooks/StorageProvider';

export default function ProductTab() {
  const { productData, saveProductData } = useStorageContext();

  const updateProductData = (field: string, value: string | number) => {
    const newData = { ...productData, [field]: value };
    console.log('📦 Updating product data:', field, '=', value);
    saveProductData(newData);
    setTimeout(() => {
      console.log('✅ Product data saved');
    }, 0);
  };

  const handleNumericChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    updateProductData(field, numValue);
  };

  const handleSelectProduct = (name: string) => {
    const preset = PRODUCT_PRESET_MAP[name];
    if (!preset) return;
    const next = {
      ...productData,
      productName: name,
      // Auto-fill all preset values including new fields
      cpAboveFreezing: preset.cpAboveFreezing,
      cpBelowFreezing: preset.cpBelowFreezing,
      freezingPoint: preset.freezingPoint,
      watts: preset.respirationWattsPerTonne,
      // If user changes afterwards, they can still edit fields
      overridePreset: false,
    };
    console.log('🍏 Selected product preset:', name, preset);
    saveProductData(next);
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
        <View style={styles.header}>
          <Text style={styles.title}>Enzo Cool Calc</Text>
          <Text style={styles.subtitle}>Product Load & Cooling Process</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>

          <ProductPicker selected={productData.productName || 'Custom'} onSelect={handleSelectProduct} />

          <InputField
            label="Product Entering Temperature"
            value={productData.enteringTemp?.toString() || '30'}
            onChangeText={(value) => handleNumericChange('enteringTemp', value)}
            keyboardType="numbers-and-punctuation"
            unitOptions={['°C', '°F']}
            selectedUnit={productData.tempUnit === 'F' ? '°F' : '°C'}
            onUnitChange={(unit) => updateProductData('tempUnit', unit === '°F' ? 'F' : 'C')}
            allowNegative={true}
          />

          <InputField
            label="Product Final Temperature"
            value={productData.finalTemp?.toString() || '4'}
            onChangeText={(value) => handleNumericChange('finalTemp', value)}
            keyboardType="numbers-and-punctuation"
            unitOptions={['°C', '°F']}
            selectedUnit={productData.tempUnit === 'F' ? '°F' : '°C'}
            onUnitChange={(unit) => updateProductData('tempUnit', unit === '°F' ? 'F' : 'C')}
            allowNegative={true}
          />

          <InputField
            label="Pull Down Hours"
            value={productData.pullDownHours.toString()}
            onChangeText={(value) => handleNumericChange('pullDownHours', value)}
            unit="hrs"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Weight & Processing</Text>

          <InputField
            label="Weight"
            value={productData.massBeforeFreezing.toString()}
            onChangeText={(value) => handleNumericChange('massBeforeFreezing', value)}
            unitOptions={['kg', 'lbs']}
            selectedUnit={productData.massUnit}
            onUnitChange={(unit) => updateProductData('massUnit', unit as 'kg' | 'lbs')}
          />

          <InputField
            label="Weight for Respiration"
            value={productData.respirationMass.toString()}
            onChangeText={(value) => handleNumericChange('respirationMass', value)}
            unitOptions={['kg', 'lbs']}
            selectedUnit={productData.massUnit}
            onUnitChange={(unit) => updateProductData('massUnit', unit as 'kg' | 'lbs')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Thermal Properties</Text>

          <InputField
            label="Cp Above Freezing"
            value={productData.cpAboveFreezing.toString()}
            onChangeText={(value) => handleNumericChange('cpAboveFreezing', value)}
            unit="kJ/kg·K"
          />

          {productData.cpBelowFreezing !== undefined && (
            <InputField
              label="Cp Below Freezing"
              value={productData.cpBelowFreezing.toString()}
              onChangeText={(value) => handleNumericChange('cpBelowFreezing', value)}
              unit="kJ/kg·K"
            />
          )}

          {productData.freezingPoint !== undefined && (
            <InputField
              label="Freezing Point"
              value={productData.freezingPoint.toString()}
              onChangeText={(value) => handleNumericChange('freezingPoint', value)}
              keyboardType="numbers-and-punctuation"
              unitOptions={['°C', '°F']}
              selectedUnit={productData.tempUnit === 'F' ? '°F' : '°C'}
              onUnitChange={(unit) => updateProductData('tempUnit', unit === '°F' ? 'F' : 'C')}
              allowNegative={true}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Process Parameters</Text>

          <InputField
            label="Watts per Tonne"
            value={productData.watts.toString()}
            onChangeText={(value) => handleNumericChange('watts', value)}
            unit="W/T"
          />
        </View>

        {/* Info section removed for cleaner UI */}
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
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 16,
    textAlign: 'left',
  },
  calculationCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  calculationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  calculationFormula: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  calculationNote: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});