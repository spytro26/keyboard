import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface InsulationType {
  key: string;
  name: string;
  description: string;
  thermalConductivity: number; // W/m·K
}

export const INSULATION_TYPES: InsulationType[] = [
  {
    key: 'PUF',
    name: 'PUF (Polyurethane Foam)',
    description: 'Most common for cold storage - Excellent thermal performance',
    thermalConductivity: 0.022
  },
  {
    key: 'EPS',
    name: 'EPS (Expanded Polystyrene)',
    description: 'Cost-effective - Good thermal insulation',
    thermalConductivity: 0.036
  },
  {
    key: 'PIR',
    name: 'PIR (Polyisocyanurate)',
    description: 'High performance - Fire resistant',
    thermalConductivity: 0.022
  }
];

interface InsulationTypePickerProps {
  selected: string;
  onSelect: (type: string) => void;
}

export const InsulationTypePicker: React.FC<InsulationTypePickerProps> = ({
  selected,
  onSelect,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedType = INSULATION_TYPES.find(type => type.key === selected) || INSULATION_TYPES[0];

  const handleSelect = (type: InsulationType) => {
    onSelect(type.key);
    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: InsulationType }) => (
    <TouchableOpacity
      style={[
        styles.option,
        item.key === selected && styles.selectedOption
      ]}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.optionContent}>
        <Text style={[
          styles.optionText,
          item.key === selected && styles.selectedOptionText
        ]}>
          {item.name}
        </Text>
        <Text style={[
          styles.optionDescription,
          item.key === selected && styles.selectedOptionDescription
        ]}>
          {item.description}
        </Text>
      </View>
      {item.key === selected && (
        <Ionicons name="checkmark" size={20} color="#2563eb" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <Text style={styles.selectorText}>{selectedType.name}</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#6b7280" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Insulation Type</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={INSULATION_TYPES}
              renderItem={renderItem}
              keyExtractor={(item) => item.key}
              style={styles.optionsList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectorContent: {
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  selectorSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  selectedOption: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  selectedOptionText: {
    color: '#1e40af',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  selectedOptionDescription: {
    color: '#2563eb',
  },
});
