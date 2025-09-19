import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'numbers-and-punctuation';
  unit?: string;
  unitOptions?: string[];
  selectedUnit?: string;
  onUnitChange?: (unit: string) => void;
  editable?: boolean;
  allowNegative?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'decimal-pad',
  unit,
  unitOptions,
  selectedUnit,
  onUnitChange,
  editable = true,
  allowNegative = false,
}) => {
  // Local buffer so the user can type transitional states (e.g., '.') without being reset by parent
  const [isFocused, setIsFocused] = useState(false);
  const [localText, setLocalText] = useState<string>(value ?? '');

  // Keep local text in sync when not focused and parent value changes
  useEffect(() => {
    if (!isFocused) {
      setLocalText(value ?? '');
    }
  }, [value, isFocused]);

  // Regex allowing decimals with optional negative sign
  const partialDecimalRegex = useMemo(() => 
    allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/,
    [allowNegative]);
  const fullDecimalRegex = useMemo(() => 
    allowNegative ? /^-?\d+(?:\.\d+)?$/ : /^\d+(?:\.\d+)?$/,
    [allowNegative]);

  const handleTextChange = (text: string) => {
    if (keyboardType === 'decimal-pad' || keyboardType === 'numeric') {
      // Allow transitional states: '', '.', '12.', '12.3', '-', '-12', '-12.3'
      if (text === '' || text === '.' || text === '-' || partialDecimalRegex.test(text)) {
        setLocalText(text);
        // Only propagate to parent when it's a complete number like '12', '12.3', '-12', '-12.3'
        if (fullDecimalRegex.test(text)) {
          onChangeText(text);
        }
        return;
      }
      // Ignore any other characters
      return;
    }
    // Non-numeric inputs
    setLocalText(text);
    onChangeText(text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, (unit || unitOptions) && styles.inputWithUnit]}
          value={isFocused ? localText : value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          keyboardType={keyboardType}
          onFocus={() => {
            setIsFocused(true);
            setLocalText(value ?? '');
          }}
          onBlur={() => {
            setIsFocused(false);
            // On blur, if the text is a valid number propagate, else fallback to 0 or keep as-is if empty
            if (fullDecimalRegex.test(localText)) {
              onChangeText(localText);
            } else if (localText === '' || localText === '.' || localText === '-') {
              onChangeText('0');
            }
          }}
          placeholderTextColor="#64748b"
          editable={editable}
          autoCorrect={false}
          spellCheck={false}
        />
        {unitOptions && selectedUnit && onUnitChange ? (
          <View style={styles.unitPickerContainer}>
            {unitOptions.map((unitOption) => (
              <TouchableOpacity
                key={unitOption}
                style={[
                  styles.unitButton,
                  selectedUnit === unitOption && styles.selectedUnitButton,
                  unitOption === unitOptions[0] && styles.firstUnitButton,
                  unitOption === unitOptions[unitOptions.length - 1] && styles.lastUnitButton,
                ]}
                onPress={() => onUnitChange(unitOption)}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    selectedUnit === unitOption && styles.selectedUnitButtonText,
                  ]}
                >
                  {unitOption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : unit ? (
          <Text style={styles.unit}>{unit}</Text>
        ) : null}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    height: 44,
    textAlignVertical: 'center',
  },
  inputWithUnit: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  unit: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    height: 44,
    textAlignVertical: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitPickerContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstUnitButton: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  lastUnitButton: {
    borderRightWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  selectedUnitButton: {
    backgroundColor: '#2563eb',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  selectedUnitButtonText: {
    color: '#ffffff',
  },
});