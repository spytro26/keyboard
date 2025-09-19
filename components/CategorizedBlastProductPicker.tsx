import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';

// Categorized products for blast freezer
const categorizedProducts = {
    'Fruits': [
        { name: 'Apple (Frozen)', cpAboveFreezing: 3.6, cpBelowFreezing: 1.9, latentHeatOfFusion: 275, freezingPoint: -0.8 },
        { name: 'Banana (Frozen)', cpAboveFreezing: 3.6, cpBelowFreezing: 1.9, latentHeatOfFusion: 270, freezingPoint: -0.7 },
        { name: 'Strawberries (Frozen)', cpAboveFreezing: 3.8, cpBelowFreezing: 2.0, latentHeatOfFusion: 285, freezingPoint: -0.6 },
        { name: 'Pineapple (Frozen)', cpAboveFreezing: 3.8, cpBelowFreezing: 2.1, latentHeatOfFusion: 280, freezingPoint: -1.2 },
        { name: 'Grapes (Frozen)', cpAboveFreezing: 3.4, cpBelowFreezing: 1.8, latentHeatOfFusion: 265, freezingPoint: -2.1 },
    ],
    'Vegetables': [
        { name: 'Beans (Frozen)', cpAboveFreezing: 3.2, cpBelowFreezing: 1.7, latentHeatOfFusion: 250, freezingPoint: -0.6 },
        { name: 'Carrots (Frozen)', cpAboveFreezing: 3.6, cpBelowFreezing: 1.9, latentHeatOfFusion: 270, freezingPoint: -0.5 },
        { name: 'Peas (Frozen)', cpAboveFreezing: 3.4, cpBelowFreezing: 1.8, latentHeatOfFusion: 260, freezingPoint: -0.6 },
        { name: 'Potato (Frozen)', cpAboveFreezing: 3.5, cpBelowFreezing: 1.8, latentHeatOfFusion: 270, freezingPoint: -0.4 },
        { name: 'Corn (Frozen)', cpAboveFreezing: 3.3, cpBelowFreezing: 1.7, latentHeatOfFusion: 255, freezingPoint: -0.5 },
    ],
    'Meat & Poultry': [
        { name: 'Chicken', cpAboveFreezing: 3.74, cpBelowFreezing: 1.96, latentHeatOfFusion: 233, freezingPoint: -0.8 },
        { name: 'Beef', cpAboveFreezing: 3.74, cpBelowFreezing: 1.96, latentHeatOfFusion: 233, freezingPoint: -0.8 },
        { name: 'Pork', cpAboveFreezing: 3.6, cpBelowFreezing: 1.9, latentHeatOfFusion: 240, freezingPoint: -0.6 },
        { name: 'Pig Fat', cpAboveFreezing: 2.8, cpBelowFreezing: 1.5, latentHeatOfFusion: 180, freezingPoint: -1.2 },
        { name: 'Turkey', cpAboveFreezing: 3.4, cpBelowFreezing: 1.8, latentHeatOfFusion: 215, freezingPoint: -0.7 },
    ],
    'Fish & Seafood': [
        { name: 'Fish', cpAboveFreezing: 3.68, cpBelowFreezing: 1.89, latentHeatOfFusion: 245, freezingPoint: -1.2 },
        { name: 'Sea Fish Fat', cpAboveFreezing: 3.4, cpBelowFreezing: 1.7, latentHeatOfFusion: 220, freezingPoint: -1.5 },
        { name: 'Sea Fish Lean', cpAboveFreezing: 3.8, cpBelowFreezing: 1.9, latentHeatOfFusion: 260, freezingPoint: -1.0 },
        { name: 'Shell Fish', cpAboveFreezing: 3.9, cpBelowFreezing: 2.0, latentHeatOfFusion: 280, freezingPoint: -0.8 },
        { name: 'Salmon', cpAboveFreezing: 3.5, cpBelowFreezing: 1.8, latentHeatOfFusion: 235, freezingPoint: -1.1 },
    ],
    'Dairy Products': [
        { name: 'Butter', cpAboveFreezing: 2.4, cpBelowFreezing: 1.3, latentHeatOfFusion: 120, freezingPoint: -3.2 },
        { name: 'Cheese Fat', cpAboveFreezing: 2.8, cpBelowFreezing: 1.5, latentHeatOfFusion: 160, freezingPoint: -2.8 },
        { name: 'Cheese Lean', cpAboveFreezing: 3.2, cpBelowFreezing: 1.7, latentHeatOfFusion: 200, freezingPoint: -1.8 },
        { name: 'Ice Cream', cpAboveFreezing: 3.14, cpBelowFreezing: 1.72, latentHeatOfFusion: 196, freezingPoint: -2.8 },
        { name: 'Milk', cpAboveFreezing: 3.9, cpBelowFreezing: 2.0, latentHeatOfFusion: 270, freezingPoint: -0.5 },
    ],
};

type ProductData = {
    name: string;
    cpAboveFreezing: number;
    cpBelowFreezing: number;
    latentHeatOfFusion: number;
    freezingPoint: number;
};

type Props = {
    selected?: string;
    onSelect: (name: string, productData?: ProductData) => void;
};

export const CategorizedBlastProductPicker: React.FC<Props> = ({ selected = 'Custom', onSelect }) => {
    const [open, setOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = Object.keys(categorizedProducts);

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
    };

    const handleProductSelect = (name: string, productData: ProductData) => {
        setOpen(false);
        setSelectedCategory(null);
        onSelect(name, productData);
    };

    const handleBackToCategories = () => {
        setSelectedCategory(null);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedCategory(null);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Product</Text>

            <TouchableOpacity style={styles.selector} onPress={() => setOpen(true)}>
                <Text style={styles.selectorText}>{selected}</Text>
                <Text style={styles.selectorIcon}>▼</Text>
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
                <Pressable style={styles.overlay} onPress={handleClose}>
                    <Pressable style={styles.modalCard}>
                        {!selectedCategory ? (
                            <>
                                <Text style={styles.modalTitle}>Select Product Category</Text>
                                <ScrollView style={styles.modalList}>
                                    {/* Custom option first */}
                                    <TouchableOpacity
                                        key="Custom"
                                        style={[styles.option, selected === 'Custom' && styles.optionSelected]}
                                        onPress={() => handleProductSelect('Custom', {
                                            name: 'Custom',
                                            cpAboveFreezing: 3.74,
                                            cpBelowFreezing: 1.96,
                                            latentHeatOfFusion: 233,
                                            freezingPoint: -0.8
                                        })}
                                    >
                                        <Text style={[styles.optionText, selected === 'Custom' && styles.optionTextSelected]}>
                                            Custom
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Category options */}
                                    {categories.map(category => (
                                        <TouchableOpacity
                                            key={category}
                                            style={styles.categoryOption}
                                            onPress={() => handleCategorySelect(category)}
                                        >
                                            <Text style={styles.categoryText}>{category}</Text>
                                            <Text style={styles.categoryIcon}>→</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        ) : (
                            <>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity onPress={handleBackToCategories} style={styles.backButton}>
                                        <Text style={styles.backButtonText}>← Back</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.modalTitle}>{selectedCategory}</Text>
                                </View>
                                <ScrollView style={styles.modalList}>
                                    {categorizedProducts[selectedCategory as keyof typeof categorizedProducts].map(product => (
                                        <TouchableOpacity
                                            key={product.name}
                                            style={[styles.option, selected === product.name && styles.optionSelected]}
                                            onPress={() => handleProductSelect(product.name, product)}
                                        >
                                            <Text style={[styles.optionText, selected === product.name && styles.optionTextSelected]}>
                                                {product.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 12, zIndex: 10 },
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
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    backButton: {
        marginRight: 12,
        padding: 8,
    },
    backButtonText: {
        color: '#1d4ed8',
        fontSize: 16,
        fontWeight: '600',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        flex: 1,
    },
    modalList: { maxHeight: 380 },
    categoryOption: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#f8fafc',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    categoryText: {
        color: '#1e40af',
        fontSize: 16,
        fontWeight: '600',
    },
    categoryIcon: {
        color: '#1e40af',
        fontSize: 16,
        fontWeight: 'bold',
    },
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
