import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface UnitPickerProps {
  label?: string;
  selectedUnit: string;
  units: string[];
  onUnitChange: (unit: string) => void;
}

export const UnitPicker: React.FC<UnitPickerProps> = ({
  label,
  selectedUnit,
  units,
  onUnitChange,
}) => {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.buttonContainer}>
        {units.map((unit) => (
          <TouchableOpacity
            key={unit}
            style={[
              styles.button,
              selectedUnit === unit && styles.selectedButton,
            ]}
            onPress={() => onUnitChange(unit)}
          >
            <Text
              style={[
                styles.buttonText,
                selectedUnit === unit && styles.selectedButtonText,
              ]}
            >
              {unit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#2563eb',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  selectedButtonText: {
    color: '#ffffff',
  },
});