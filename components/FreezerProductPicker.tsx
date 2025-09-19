import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';
import { freezerProducts } from '@/data/freezerProducts';

type Props = {
    selected?: string;
    onSelect: (name: string) => void;
};

export const FreezerProductPicker: React.FC<Props> = ({ selected = 'Custom', onSelect }) => {
    const [open, setOpen] = useState(false);
    const [showCategories, setShowCategories] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    
    console.log('FreezerProductPicker rendered with selected:', selected);
    
    // Reset modal state when selected product changes
    useEffect(() => {
        setOpen(false);
        setShowCategories(true);
        setSelectedCategory('');
    }, [selected]);
    
    const categories = useMemo(() => {
        const cats = [...new Set(freezerProducts.map(p => p.category))];
        return cats.sort();
    }, []);

    const productsByCategory = useMemo(() => {
        const grouped: { [key: string]: typeof freezerProducts } = {};
        freezerProducts.forEach(product => {
            if (!grouped[product.category]) {
                grouped[product.category] = [];
            }
            grouped[product.category].push(product);
        });
        return grouped;
    }, []);

    const handleCategorySelect = (category: string) => {
        console.log('Category selected:', category);
        setSelectedCategory(category);
        setShowCategories(false);
    };

    const handleProductSelect = (name: string) => {
        console.log('Product selected in picker:', name);
        onSelect(name);
        setOpen(false);
        setShowCategories(true);
        setSelectedCategory('');
    };

    const handleBackToCategories = () => {
        setShowCategories(true);
        setSelectedCategory('');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Product</Text>

            <TouchableOpacity style={styles.selector} onPress={() => {
                console.log('Opening product picker');
                setOpen(true);
                setShowCategories(true);
                setSelectedCategory('');
            }}>
                <Text style={styles.selectorText}>{selected}</Text>
                <Text style={styles.selectorIcon}>▼</Text>
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={styles.overlay} onPress={() => {
                    setOpen(false);
                    setShowCategories(true);
                    setSelectedCategory('');
                }}>
                    <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity 
                                style={styles.backButton} 
                                onPress={showCategories ? () => {
                                    setOpen(false);
                                    setShowCategories(true);
                                    setSelectedCategory('');
                                } : handleBackToCategories}
                            >
                                <Text style={styles.backButtonText}>
                                    {showCategories ? '✕' : '←'}
                                </Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>
                                {showCategories ? 'Select Category' : `Products - ${selectedCategory}`}
                            </Text>
                        </View>
                        <ScrollView style={styles.modalList}>
                            {showCategories ? (
                                categories.map(category => (
                                    <TouchableOpacity
                                        key={category}
                                        style={styles.option}
                                        onPress={() => handleCategorySelect(category)}
                                    >
                                        <Text style={styles.optionText}>{category}</Text>
                                        <Text style={styles.optionArrow}>→</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                productsByCategory[selectedCategory]?.map(product => (
                                    <TouchableOpacity
                                        key={product.name}
                                        style={[styles.option, product.name === selected && styles.optionSelected]}
                                        onPress={() => handleProductSelect(product.name)}
                                    >
                                        <Text style={[styles.optionText, product.name === selected && styles.optionTextSelected]}>
                                            {product.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 12, zIndex: 100 /* keep above other content */ },
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
        zIndex: 1000,
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
        zIndex: 1001,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        marginBottom: 8,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    backButtonText: {
        fontSize: 18,
        color: '#2563eb',
        fontWeight: '600',
    },
    modalTitle: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: '#0f172a', 
        flex: 1,
        textAlign: 'center',
    },
    modalList: { maxHeight: 380 },
    option: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionSelected: { backgroundColor: '#eff6ff' },
    optionText: { color: '#334155', fontSize: 16, flex: 1 },
    optionTextSelected: { color: '#1d4ed8', fontWeight: '600' },
    optionArrow: { color: '#64748b', fontSize: 16, marginLeft: 8 },
});
