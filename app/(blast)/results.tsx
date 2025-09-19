import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBlastStorageContext } from '@/hooks/BlastStorageProvider';
import { useAuth } from '@/hooks/AuthProvider';
import { generateAndSharePDF, PDFData } from '@/utils/pdfGenerator';
import { saveCalculationToFirestore, getCalculationTypeFromTitle } from '@/utils/calculationStorage';

export default function BlastResultsTab() {
    const { calculateResults, roomData, productData, miscData } = useBlastStorageContext();
    const { userProfile, getUserDisplayName, user } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [networkStatus, setNetworkStatus] = useState('');
    const results = calculateResults();

    const handleSharePDF = async () => {
        setIsGenerating(true);
        setNetworkStatus('Preparing data...');
        
        try {
            const loadKw = results.totalLoadKw || 0;
            const loadBtuHr = loadKw * 3412; // kW -> BTU/hr

            const pdfData: PDFData = {
                title: 'Blast Freezer Heat Load Summary',
                subtitle: 'Key calculation results for blast freezer refrigeration system',
                userName: getUserDisplayName(), // Use helper function with fallback
                projectName: roomData.projectName,
                finalResults: [
                    { label: 'Total Load (with 20% Safety)', value: (loadKw * 1.2).toFixed(1), unit: 'kW' },
                    { label: 'Base Load (without safety)', value: loadKw.toFixed(1), unit: 'kW' },
                    { label: 'Load', value: loadBtuHr.toFixed(0), unit: 'BTU/hr' },
                ],
                inputs: [
                    {
                        title: 'Ambient Conditions',
                        items: [
                            { label: 'Ambient Temperature', value: roomData.ambientTemp?.toString() || '35', unit: `°${roomData.tempUnit || 'C'}` },
                            { label: 'Ambient RH', value: '60', unit: '%' },
                        ]
                    },
                    {
                        title: 'Room Definition',
                        items: [
                            { label: 'Room Length', value: roomData.length.toString(), unit: roomData.lengthUnit },
                            { label: 'Room Width', value: roomData.width.toString(), unit: roomData.lengthUnit },
                            { label: 'Room Height', value: roomData.height.toString(), unit: roomData.lengthUnit },
                            { label: 'Insulation Thickness', value: roomData.wallInsulationThickness.toString(), unit: 'mm' },
                            { label: 'Room Internal Volume', value: (roomData.length * roomData.width * roomData.height).toFixed(2), unit: 'm³' },
                            { label: 'Cold Room Position', value: 'Inside', unit: '' },
                            { label: 'Room Temperature', value: roomData.roomTemp?.toString() || '-35', unit: `°${roomData.tempUnit || 'C'}` },
                            { label: 'Insulation', value: roomData.insulationType, unit: '40 kg/m³' },
                        ]
                    },
                    {
                        title: 'Product Definition',
                        items: [
                            { label: 'Product', value: 'Product', unit: '' },
                            { label: 'Product Quantity', value: productData.capacityRequired?.toString() || '2000', unit: productData.massUnit || 'kg' },
                            { label: 'Daily Product Loading', value: productData.capacityRequired?.toString() || '2000', unit: productData.massUnit || 'kg' },
                            { label: 'Product Incoming Temp', value: productData.productEnteringTemp?.toString() || '-5', unit: `°${productData.tempUnit || 'C'}` },
                            { label: 'Product Final Temp', value: productData.productFinalTemp?.toString() || '-30', unit: `°${productData.tempUnit || 'C'}` },
                            { label: 'Specific Heat Above Freezing', value: productData.cpAboveFreezing.toString(), unit: 'kJ/kg °C' },
                            { label: 'Specific Heat Below Freezing', value: productData.cpBelowFreezing.toString(), unit: 'kJ/kg °C' },
                            { label: 'Freezing Temp', value: '0', unit: `°${productData.tempUnit || 'C'}` },
                            { label: 'Latent Heat of Freezing', value: productData.latentHeat.toString(), unit: 'kJ/kg' },
                            { label: 'Respiration Heat', value: '0.00', unit: 'W/kg * 24 h' },
                        ]
                    },
                    {
                        title: 'Internal Factors',
                        items: [
                            { label: 'No. of Workers', value: miscData.occupancyCount.toString(), unit: '' },
                            { label: 'Rated Power of motors', value: miscData.fanMotorRating.toString(), unit: 'W' },
                            { label: 'Lightings', value: miscData.lightLoad?.toString() || '100', unit: 'W' },
                            { label: 'Heater Coils', value: '0', unit: 'W' },
                            { label: 'Working Time', value: '5', unit: 'h' },
                            { label: 'Operating Time', value: productData.batchHours?.toString() || '8', unit: 'h' },
                        ]
                    }
                ],
                sections: [
                    {
                        title: 'Transmission Loads',
                        items: [
                            { label: 'Wall Load', value: ((results.wallLoad || 0) / 1000).toFixed(1), unit: 'kW' },
                            { label: 'Ceiling Load', value: ((results.ceilingLoad || 0) / 1000).toFixed(1), unit: 'kW' },
                            { label: 'Floor Load', value: ((results.floorLoad || 0) / 1000).toFixed(1), unit: 'kW' },
                            { label: 'Total Transmission Load', value: ((results.totalTransmissionLoad || 0) / 1000).toFixed(1), unit: 'kW' },
                        ]
                    },
                    {
                        title: 'Product Loads',
                        items: [
                            { label: 'Before Freezing Load', value: ((results.beforeFreezingLoad || 0) / 1000).toFixed(1), unit: 'kW' },
                            { label: 'Latent Heat Load', value: ((results.latentHeatLoad || 0) / 1000).toFixed(1), unit: 'kW' },
                            { label: 'After Freezing Load', value: ((results.afterFreezingLoad || 0) / 1000).toFixed(1), unit: 'kW' },
                            { label: 'Total Product Load', value: ((results.totalProductLoad || 0) / 1000).toFixed(1), unit: 'kW' },
                        ]
                    },
                    {
                        title: 'Other Loads',
                        items: [
                            { label: 'Air Change Load', value: ((results.airChangeLoad || 0) / 1000).toFixed(1), unit: 'kW' },
                            { label: 'Equipment Load', value: ((results.equipmentLoad || 0) / 1000).toFixed(1), unit: 'kW' },
                            { label: 'Occupancy Load', value: ((results.occupancyLoad || 0) / 1000).toFixed(1), unit: 'kW' },
                            { label: 'Light Load', value: ((results.lightLoad || 0) / 1000).toFixed(1), unit: 'kW' },
                            { label: 'Total Miscellaneous Load', value: ((results.totalMiscLoad || 0) / 1000).toFixed(1), unit: 'kW' },
                        ]
                    },
                    {
                        title: 'Heat Distribution',
                        items: [
                            { label: 'Sensible Heat', value: ((results.sensibleHeatKJ24Hr || 0) / 1000).toFixed(1), unit: 'kW' },
                            { label: 'Latent Heat', value: ((results.latentHeatKJ24Hr || 0) / 1000).toFixed(1), unit: 'kW' },
                            { label: 'Sensible Heat Ratio', value: (results.shr || 0).toFixed(3), unit: '' },
                            { label: 'Air Qty Required', value: (results.airQtyRequiredCfm || 0).toFixed(0), unit: 'CFM' },
                        ]
                    }
                ]
            };

            // Network call to save data to Firestore (with timeout)
            if (user?.uid) {
                setNetworkStatus('Saving calculation data...');
                
                try {
                    console.log('[BlastFreezer] 📡 Attempting to save calculation data to Firestore');
                    
                    // Use 8 second timeout for better offline handling
                    const saveResult = await saveCalculationToFirestore(
                        user.uid, 
                        'blast_freezer', 
                        pdfData,
                        roomData,
                        productData,
                        8000 // 8 second timeout
                    );
                    
                    if (saveResult.success) {
                        console.log('[BlastFreezer] ✅ Calculation data saved successfully');
                        setNetworkStatus('Data saved - ready to share!');
                    } else {
                        console.error('[BlastFreezer] ❌ Failed to save calculation data:', saveResult.error);
                        
                        // Check if it's a timeout/network error (offline)
                        const isOfflineError = saveResult.error?.toLowerCase().includes('timeout') || 
                                              saveResult.error?.toLowerCase().includes('network') ||
                                              saveResult.error?.toLowerCase().includes('connection');
                        
                        if (isOfflineError) {
                            // For offline errors, just show simple message and continue
                            console.log('[BlastFreezer] 📱 Offline mode - continuing with PDF only');
                            setNetworkStatus('Offline mode - ready to share PDF!');
                        } else {
                            // For other errors, show detailed info during testing
                            Alert.alert(
                                'Save Failed',
                                `Failed to save calculation data:\n\n${saveResult.error}\n\nDetailed info:\n${saveResult.details || 'No additional details'}`,
                                [{ text: 'Continue with PDF', style: 'default' }]
                            );
                            setNetworkStatus('Save failed - ready to share PDF!');
                        }
                    }
                } catch (error: any) {
                    console.error('[BlastFreezer] ❌ Unexpected error saving calculation data:', error);
                    
                    // Check if it's likely an offline/network error
                    const errorMessage = error?.message || '';
                    const isOfflineError = errorMessage.toLowerCase().includes('timeout') || 
                                          errorMessage.toLowerCase().includes('network') ||
                                          errorMessage.toLowerCase().includes('connection');
                    
                    if (isOfflineError) {
                        console.log('[BlastFreezer] 📱 Network timeout - continuing with PDF only');
                        setNetworkStatus('Offline mode - ready to share PDF!');
                    } else {
                        Alert.alert(
                            'Network Error',
                            `Unexpected error occurred:\n\n${errorMessage}\n\nStack:\n${error?.stack || 'No stack trace'}`,
                            [{ text: 'Continue with PDF', style: 'default' }]
                        );
                        setNetworkStatus('Network error - ready to share PDF!');
                    }
                }
            } else {
                console.log('[BlastFreezer] ⚠️ No user UID available, skipping Firestore save');
                setNetworkStatus('Not logged in - ready to share PDF!');
            }

            // Always proceed with PDF generation regardless of save status
            setNetworkStatus('Generating PDF...');
            await generateAndSharePDF(pdfData);
            
        } catch (error: any) {
            console.error('[BlastFreezer] ❌ PDF generation error:', error);
            Alert.alert('PDF Error', `Failed to generate PDF: ${error?.message || 'Unknown error'}`);
        } finally {
            setIsGenerating(false);
            setNetworkStatus('');
        }
    };

    const ResultCard = ({ title, value, unit, isHighlighted = false }: {
        title: string;
        value: number | undefined;
        unit: string;
        isHighlighted?: boolean;
    }) => (
        <View style={[styles.resultCard, isHighlighted && styles.highlightedCard]}>
            <Text style={[styles.resultLabel, isHighlighted && styles.highlightedLabel]}>{title}</Text>
            <Text style={[styles.resultValue, isHighlighted && styles.highlightedValue]}>
                {(value || 0).toFixed(1)} <Text style={styles.resultUnit}>{unit}</Text>
            </Text>
        </View>
    );

    const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Enzo Cool Calc</Text>
                        <Text style={styles.subtitle}>Blast Freezer Heat Load Results</Text>

                        {/* PDF Export Button */}
                        <TouchableOpacity 
                            style={[styles.pdfButton, isGenerating && styles.pdfButtonDisabled]} 
                            onPress={handleSharePDF}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <ActivityIndicator size="small" color="#ffffff" />
                                    <Text style={styles.pdfButtonText}>Generating PDF...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="document-text-outline" size={20} color="#ffffff" />
                                    <Text style={styles.pdfButtonText}>Share as PDF</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Network Status Indicator */}
                        {networkStatus && (
                            <View style={styles.networkStatusContainer}>
                                <Text style={styles.networkStatusText}>{networkStatus}</Text>
                            </View>
                        )}
                    </View>

                    {/* Main Results - Highlighted */}
                    <SectionCard title="Main Results">
                        <ResultCard
                            title="Total Load (with 20% Safety)"
                            value={results.totalLoadKw * 1.2}
                            unit="kW"
                            isHighlighted={true}
                        />
                        <ResultCard
                            title="Base Load (without safety)"
                            value={results.totalLoadKw}
                            unit="kW"
                            isHighlighted={true}
                        />
                        <ResultCard
                            title="Load in BTU/hr"
                            value={(results.totalLoadKw || 0) * 3412}
                            unit="BTU/hr"
                            isHighlighted={true}
                        />
                    </SectionCard>

                    {/* Transmission Loads */}
                    <SectionCard title="Transmission Loads">
                        <ResultCard title="Wall Load" value={results.wallLoad / 1000} unit="kW" />
                        <ResultCard title="Ceiling Load" value={results.ceilingLoad / 1000} unit="kW" />
                        <ResultCard title="Floor Load" value={results.floorLoad / 1000} unit="kW" />
                        <ResultCard
                            title="Total Transmission Load"
                            value={results.totalTransmissionLoad / 1000}
                            unit="kW"
                        />
                    </SectionCard>

                    {/* Product Loads */}
                    <SectionCard title="Product Loads">
                        <ResultCard
                            title="Before Freezing Load"
                            value={results.beforeFreezingLoad / 1000}
                            unit="kW"
                        />
                        <ResultCard
                            title="Latent Heat Load"
                            value={results.latentHeatLoad / 1000}
                            unit="kW"
                        />
                        <ResultCard
                            title="After Freezing Load"
                            value={results.afterFreezingLoad / 1000}
                            unit="kW"
                        />
                        <ResultCard
                            title="Total Product Load"
                            value={results.totalProductLoad / 1000}
                            unit="kW"
                        />
                    </SectionCard>

                    {/* Air Change Load */}
                    <SectionCard title="Air Change Load">
                        <ResultCard
                            title="Air Change Load"
                            value={results.airChangeLoad / 1000}
                            unit="kW"
                        />
                    </SectionCard>

                    {/* Miscellaneous Loads */}
                    <SectionCard title="Miscellaneous Loads">
                        <ResultCard title="Equipment Load" value={results.equipmentLoad / 1000} unit="kW" />
                        <ResultCard title="Occupancy Load" value={results.occupancyLoad / 1000} unit="kW" />
                        <ResultCard title="Light Load" value={results.lightLoad / 1000} unit="kW" />
                        <ResultCard title="Peripheral Heater Load" value={results.peripheralHeaterLoad / 1000} unit="kW" />
                        <ResultCard title="Door Heater Load" value={results.doorHeaterLoad / 1000} unit="kW" />
                        <ResultCard title="Tray Heater Load" value={results.trayHeaterLoad / 1000} unit="kW" />
                        <ResultCard title="Drain Heater Load" value={results.drainHeaterLoad / 1000} unit="kW" />
                        <ResultCard
                            title="Total Miscellaneous Load"
                            value={results.totalMiscLoad / 1000}
                            unit="kW"
                        />
                    </SectionCard>

                    {/* Heat Distribution */}
                    <SectionCard title="Heat Distribution">
                        <ResultCard title="Sensible Heat" value={results.sensibleHeatKJ24Hr / 1000} unit="kW" />
                        <ResultCard title="Latent Heat" value={results.latentHeatKJ24Hr / 1000} unit="kW" />
                        <ResultCard title="SHR (Sensible Heat Ratio)" value={results.shr} unit="" />
                        <ResultCard title="Air Quantity Required" value={results.airQtyRequiredCfm} unit="CFM" />
                    </SectionCard>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Powered by Enzo</Text>
                        <Text style={styles.footerSubtext}>
                            Professional blast freezer heat load calculations following exact Excel formulas
                        </Text>
                    </View>
                </View>
            </ScrollView>
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
        padding: 12,
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
        paddingVertical: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1e40af',
        marginBottom: 4,
        letterSpacing: -0.2,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '400',
    },
    pdfButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563eb',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        shadowColor: '#2563eb',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    pdfButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    sectionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e40af',
        marginBottom: 10,
        letterSpacing: -0.1,
        textAlign: 'left',
    },
    resultCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        minHeight: 40,
    },
    highlightedCard: {
        backgroundColor: '#eff6ff',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginVertical: 3,
        borderBottomWidth: 0,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    resultLabel: {
        fontSize: 13,
        color: '#374151',
        flex: 1,
        fontWeight: '400',
    },
    highlightedLabel: {
        fontWeight: '600',
        color: '#1e40af',
        fontSize: 14,
    },
    resultValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563eb',
    },
    highlightedValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1d4ed8',
    },
    resultUnit: {
        fontSize: 12,
        fontWeight: '400',
        color: '#64748b',
    },
    footer: {
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#1e40af',
        fontWeight: '600',
        marginBottom: 3,
    },
    footerSubtext: {
        fontSize: 11,
        color: '#64748b',
        textAlign: 'center',
        fontStyle: 'italic',
        fontWeight: '400',
    },
    pdfButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    networkStatusContainer: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f1f5f9',
        borderRadius: 6,
        alignSelf: 'center',
    },
    networkStatusText: {
        fontSize: 12,
        color: '#475569',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});