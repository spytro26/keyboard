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
import { FreezerProductPicker } from '@/components/FreezerProductPicker';
import { useFreezerStorageContext } from '@/hooks/FreezerStorageProvider';
import { freezerProducts } from '@/data/freezerProducts';

export default function FreezerProductTab() {
  const { productData, saveProductData, miscData, saveMiscData } = useFreezerStorageContext();

  const updateProductData = (field: string, value: string | number) => {
    const newData = { ...productData, [field]: value };
    console.log('📦 Updating freezer product data:', field, '=', value);
    saveProductData(newData);
    setTimeout(() => {
      console.log('✅ Freezer product data saved');
    }, 0);
  };

  const updateMiscData = (field: string, value: string | number) => {
    const newData = { ...miscData, [field]: value };
    console.log('🌡️ Updating freezer misc data:', field, '=', value);
    saveMiscData(newData);
    setTimeout(() => {
      console.log('✅ Freezer misc data saved');
    }, 0);
  };

  const handleValueChange = (field: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    if (field === 'productIncoming' || field === 'productOutgoing' || field === 'dailyLoading') {
      updateMiscData(field, numericValue);
    } else {
      updateProductData(field, numericValue);
    }
  };

  const handleUnitChange = (field: string, unit: string) => {
    updateProductData(field, unit);
  };

  const handleProductSelect = (productName: string) => {
    console.log('handleProductSelect called with:', productName);
    const selectedProduct = freezerProducts.find(p => p.name === productName);
    console.log('Found product:', selectedProduct);
    if (selectedProduct) {
      // Update all product data in a single call to avoid state race conditions
      const newProductData = {
        ...productData,
        productName: productName,
        cpAboveFreezing: selectedProduct.cpAboveFreezing,
        cpBelowFreezing: selectedProduct.cpBelowFreezing,
        latentHeatOfFusion: selectedProduct.latentHeatOfFusion,
        freezingPoint: selectedProduct.freezingPoint,
        watts: selectedProduct.respirationWatts,
        overridePreset: false,
      };
      console.log('📦 Updating freezer product data with new product:', productName);
      saveProductData(newProductData);
      setTimeout(() => {
        console.log('✅ Freezer product data saved');
      }, 0);
      console.log('Product data updated');
    } else {
      console.log('Product not found in freezerProducts');
    }
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
          <Text style={styles.subtitle}>Product Load & Freezing Process</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>

          <FreezerProductPicker
            key={productData.productName || 'Custom'}
            selected={productData.productName || 'Custom'}
            onSelect={handleProductSelect}
          />

          <InputField
            label="Product Entering Temperature"
            value={miscData.productIncoming.toString()}
            onChangeText={(value) => handleValueChange('productIncoming', value)}
            keyboardType="numbers-and-punctuation"
            unitOptions={['C', 'F']}
            selectedUnit={miscData.tempUnit}
            onUnitChange={(unit) => updateMiscData('tempUnit', unit as 'C' | 'F')}
            allowNegative={true}
          />

          <InputField
            label="Product Final Temperature"
            value={miscData.productOutgoing.toString()}
            onChangeText={(value) => handleValueChange('productOutgoing', value)}
            keyboardType="numbers-and-punctuation"
            unitOptions={['C', 'F']}
            selectedUnit={miscData.tempUnit}
            onUnitChange={(unit) => updateMiscData('tempUnit', unit as 'C' | 'F')}
            allowNegative={true}
          />

          <InputField
            label="Pull Down Hours"
            value={productData.pullDownHours.toString()}
            onChangeText={(value) => handleValueChange('pullDownHours', value)}
            unit="hrs"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Weight & Processing</Text>

          <InputField
            label="Daily Loading"
            value={miscData.dailyLoading?.toString() || ''}
            onChangeText={(value) => handleValueChange('dailyLoading', value)}
            unitOptions={['kg', 'lbs']}
            selectedUnit={productData.massUnit}
            onUnitChange={(unit) => handleUnitChange('massUnit', unit)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Thermal Properties</Text>

          <InputField
            label="Cp Above Freezing"
            value={productData.cpAboveFreezing.toString()}
            onChangeText={(value) => handleValueChange('cpAboveFreezing', value)}
            unit="kJ/kg·K"
            editable={true}
          />

          <InputField
            label="Cp Below Freezing"
            value={productData.cpBelowFreezing.toString()}
            onChangeText={(value) => handleValueChange('cpBelowFreezing', value)}
            unit="kJ/kg·K"
            editable={true}
          />

          <InputField
            label="Latent Heat"
            value={productData.latentHeatOfFusion.toString()}
            onChangeText={(value) => handleValueChange('latentHeatOfFusion', value)}
            unit="kJ/kg"
            editable={true}
          />

          <InputField
            label="Freezing Point"
            value={productData.freezingPoint.toString()}
            onChangeText={(value) => handleValueChange('freezingPoint', value)}
            keyboardType="numbers-and-punctuation"
            unit="°C"
            editable={true}
            allowNegative={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Process Parameters</Text>

          <InputField
            label="Respiration Heat"
            value={productData.watts.toString()}
            onChangeText={(value) => handleValueChange('watts', value)}
            unit="W/tonne"
            editable={true}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by Enzo</Text>
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
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
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
