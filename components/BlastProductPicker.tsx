import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';
import { freezerProducts } from '@/data/freezerProducts';

type Props = {
    selected?: string;
    onSelect: (name: string) => void;
};

export const BlastProductPicker: React.FC<Props> = ({ selected = 'Custom', onSelect }) => {
    const [open, setOpen] = useState(false);
    const items = useMemo(() => freezerProducts.map(p => p.name), []);

    const handleSelect = (name: string) => {
        setOpen(false);
        onSelect(name);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Product</Text>

            <TouchableOpacity style={styles.selector} onPress={() => setOpen(true)}>
                <Text style={styles.selectorText}>{selected}</Text>
                <Text style={styles.selectorIcon}>▼</Text>
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
                    <Pressable style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Select Product</Text>
                        <ScrollView style={styles.modalList}>
                            {items.map(name => (
                                <TouchableOpacity
                                    key={name}
                                    style={[styles.option, name === selected && styles.optionSelected]}
                                    onPress={() => handleSelect(name)}
                                >
                                    <Text style={[styles.optionText, name === selected && styles.optionTextSelected]}>
                                        {name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 12, zIndex: 10 /* keep above other content */ },
    title: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 6 },
    selector: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectorText: { fontSize: 16, color: '#334155' },
    selectorIcon: { marginLeft: 12, color: '#64748b' },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 6,
    },
    modalTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', padding: 8 },
    modalList: { maxHeight: 380 },
    option: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#ffffff',
    },
    optionSelected: { backgroundColor: '#eff6ff' },
    optionText: { color: '#334155', fontSize: 16 },
    optionTextSelected: { color: '#1d4ed8', fontWeight: '600' },
});
