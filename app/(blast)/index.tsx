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
import { InsulationTypePicker } from '@/components/InsulationTypePicker';
import { useBlastStorageContext } from '@/hooks/BlastStorageProvider';

export default function BlastRoomDetailsTab() {
    const { roomData, saveRoomData } = useBlastStorageContext();

    const handleValueChange = (field: string, value: string) => {
        const numericValue = parseFloat(value) || 0;
        saveRoomData({
            ...roomData,
            [field]: numericValue,
        });
    };

    const handleStringChange = (field: string, value: string) => {
        saveRoomData({
            ...roomData,
            [field]: value,
        });
    };

    const handleUnitChange = (field: string, unit: string) => {
        saveRoomData({
            ...roomData,
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
                        <Text style={styles.subtitle}>Blast Freezer Room Details & Transmission Load</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Project Information</Text>

                        <InputField
                            label="Project Name"
                            value={roomData.projectName ?? ''}
                            onChangeText={(value) => handleStringChange('projectName', value)}
                            placeholder="Blaster Project"
                            keyboardType="default"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Room Dimensions</Text>

                        <InputField
                            label="Length"
                            value={roomData.length.toString()}
                            onChangeText={(value) => handleValueChange('length', value)}
                            keyboardType="decimal-pad"
                            placeholder="5"
                            unitOptions={['m', 'ft']}
                            selectedUnit={roomData.lengthUnit === 'ft' ? 'ft' : 'm'}
                            onUnitChange={(unit) => handleUnitChange('lengthUnit', unit === 'ft' ? 'ft' : 'm')}
                        />

                        <InputField
                            label="Width"
                            value={roomData.width.toString()}
                            onChangeText={(value) => handleValueChange('width', value)}
                            keyboardType="decimal-pad"
                            placeholder="5"
                            unitOptions={['m', 'ft']}
                            selectedUnit={roomData.lengthUnit === 'ft' ? 'ft' : 'm'}
                            onUnitChange={(unit) => handleUnitChange('lengthUnit', unit === 'ft' ? 'ft' : 'm')}
                        />

                        <InputField
                            label="Height"
                            value={roomData.height.toString()}
                            onChangeText={(value) => handleValueChange('height', value)}
                            keyboardType="decimal-pad"
                            placeholder="3.5"
                            unitOptions={['m', 'ft']}
                            selectedUnit={roomData.lengthUnit === 'ft' ? 'ft' : 'm'}
                            onUnitChange={(unit) => handleUnitChange('lengthUnit', unit === 'ft' ? 'ft' : 'm')}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Temperature Parameters</Text>

                        <InputField
                            label="Ambient Temperature"
                            value={roomData.ambientTemp.toString()}
                            onChangeText={(value) => handleValueChange('ambientTemp', value)}
                            keyboardType="numbers-and-punctuation"
                            placeholder="43"
                            unitOptions={['°C', '°F']}
                            selectedUnit={roomData.tempUnit === 'F' ? '°F' : '°C'}
                            onUnitChange={(unit) => handleUnitChange('tempUnit', unit === '°F' ? 'F' : 'C')}
                            allowNegative={true}
                        />

                        <InputField
                            label="Room Temperature"
                            value={roomData.roomTemp.toString()}
                            onChangeText={(value) => handleValueChange('roomTemp', value)}
                            keyboardType="numbers-and-punctuation"
                            placeholder="-35"
                            unitOptions={['°C', '°F']}
                            selectedUnit={roomData.tempUnit === 'F' ? '°F' : '°C'}
                            onUnitChange={(unit) => handleUnitChange('tempUnit', unit === '°F' ? 'F' : 'C')}
                            allowNegative={true}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Insulation Parameters</Text>

                        <Text style={styles.subsectionTitle}>Insulation Type</Text>
                        <InsulationTypePicker
                            selected={roomData.insulationType}
                            onSelect={(type) => handleStringChange('insulationType', type)}
                        />

                        <Text style={styles.subsectionTitle}>Insulation Thickness (mm)</Text>
                        <InputField
                            label="Wall Insulation Thickness"
                            value={roomData.wallInsulationThickness.toString()}
                            onChangeText={(value) => handleValueChange('wallInsulationThickness', value)}
                            keyboardType="decimal-pad"
                            placeholder="150"
                            unit="mm"
                        />

                        <InputField
                            label="Ceiling Insulation Thickness"
                            value={roomData.ceilingInsulationThickness.toString()}
                            onChangeText={(value) => handleValueChange('ceilingInsulationThickness', value)}
                            keyboardType="decimal-pad"
                            placeholder="150"
                            unit="mm"
                        />

                        <InputField
                            label="Floor Insulation Thickness"
                            value={roomData.floorInsulationThickness.toString()}
                            onChangeText={(value) => handleValueChange('floorInsulationThickness', value)}
                            keyboardType="decimal-pad"
                            placeholder="150"
                            unit="mm"
                        />

                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Transmission Load Parameters</Text>

                        <Text style={styles.subsectionTitle}>Hours of Operation</Text>
                        <InputField
                            label="Wall Hours"
                            value={roomData.wallHours.toString()}
                            onChangeText={(value) => handleValueChange('wallHours', value)}
                            keyboardType="decimal-pad"
                            placeholder="8"
                            unit="hrs"
                        />

                        <InputField
                            label="Ceiling Hours"
                            value={roomData.ceilingHours.toString()}
                            onChangeText={(value) => handleValueChange('ceilingHours', value)}
                            keyboardType="decimal-pad"
                            placeholder="8"
                            unit="hrs"
                        />

                        <InputField
                            label="Floor Hours"
                            value={roomData.floorHours.toString()}
                            onChangeText={(value) => handleValueChange('floorHours', value)}
                            keyboardType="decimal-pad"
                            placeholder="8"
                            unit="hrs"
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
        textAlign: 'left',
    },
    subsectionTitle: {
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
