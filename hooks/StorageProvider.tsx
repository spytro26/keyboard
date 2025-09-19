import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { RoomData, ProductData, MiscellaneousData } from '@/types/calculation';
import { triggerGlobalUpdate } from '@/hooks/useGlobalUpdate';

export const STORAGE_KEYS = {
    ROOM_DATA: 'enzo_room_data',
    PRODUCT_DATA: 'enzo_product_data',
    MISC_DATA: 'enzo_misc_data',
};

// Default values exactly matching Excel spreadsheet
const defaultRoomData: RoomData = {
    // Project identification
    projectName: 'Coldroom Project', // Default project name for cold room
    
    length: 3.048, // Excel D3: 3.048m
    width: 4.5,    // Excel E3: 4.5m
    height: 3.0,   // Excel G3: 3.0m
    lengthUnit: 'm',

    // Insulation parameters (from Excel)
    insulationType: 'PUF',              // Excel D50: PUF
    wallInsulationThickness: 100,       // Excel D51: 100mm
    ceilingInsulationThickness: 100,    // Excel E51: 100mm  
    floorInsulationThickness: 100,      // Excel F51: 100mm

    wallUFactor: 0.295,    // Excel C8: 0.295
    ceilingUFactor: 0.295, // Excel C9: 0.295
    floorUFactor: 0.295,   // Excel C10: 0.295
    wallHours: 24,         // Excel F8: 24 hrs
    ceilingHours: 24,      // Excel F9: 24 hrs  
    floorHours: 24,        // Excel F10: 24 hrs
};

const defaultProductData: ProductData = {
    massBeforeFreezing: 4000, // Excel shows 4000 kg
    massUnit: 'kg',

    // Product temperatures - NEW DEFAULT VALUES
    enteringTemp: 30,         // Default entering temperature
    finalTemp: 4,             // Default final temperature  
    tempUnit: 'C',            // Default temperature unit

    cpAboveFreezing: 4.1,     // Excel shows 4.1 kJ/kg·K
    pullDownHours: 24,        // Excel shows 24 hrs
    respirationMass: 4000,    // Excel shows 4000 kg (same as mass)
    watts: 50,                // Excel shows 50 W/Tonne
    productName: 'Custom',
    overridePreset: false,
};

const defaultMiscData: MiscellaneousData = {
    // Air Change (Excel row 21)
    airChangeRate: 3.4,        // Excel C21: 3.4 L/S
    enthalpyDiff: 0.10,        // Excel D21: 0.10 kJ/L
    hoursOfLoad: 20,           // Excel F21: 20 hrs

    // Equipment (Excel row 25)
    fanMotorRating: 0.25,      // Excel C25: 0.25 kW
    fanQuantity: 1,            // Excel D25: 1 fan
    equipmentUsageHours: 20,   // Excel F25: 20 hrs

    // Occupancy (Excel row 27)
    occupancyCount: 1.0,       // Excel C27: 1.0 people
    occupancyHeatEquiv: 0.275, // Excel D27: 0.275 kW per person
    occupancyUsageHours: 20,   // Excel F27: 20 hrs

    // Lighting (Excel row 29)
    lightPower: 70,            // Excel C29: user input in Watts
    lightUsageHours: 20,       // Excel F29: 20 hrs

    // Door Heaters (Excel row 33)
    doorHeaterCapacity: 0.145, // Excel C33: calculated from door perimeter
    doorHeaterQuantity: 1,     // Excel D33: 1 door heater
    doorHeaterUsageHours: 20,  // Excel F33: 20 hrs

    // Temperature parameters (Excel)
    ambientTemp: 45,           // Excel D55: 45°C
    roomTemp: 2,               // Excel D56: 2°C
    productIncoming: 30,       // Excel D57: 30°C
    productOutgoing: 4,        // Excel D58: 4°C
    tempUnit: 'C',

    // Additional Excel parameters (only used ones)
    doorClearOpeningWidth: 900, // Excel D62: 900 mm - used for door heater calculation
    doorClearOpeningHeight: 2000, // Excel E62: 2000 mm - used for door heater calculation
    doorDimensionUnit: 'mm', // Default unit for door dimensions
    capacityIncludingSafety: 10, // Excel D43: 10% - used for safety factor calculation
    
    // REMOVED UNUSED PARAMETERS:
    // dailyLoading - only used in freezer calculations
    // cpAboveFreezing - duplicate of productData.cpAboveFreezing
    // pullDownTime - duplicate of productData.pullDownHours
    // storageCapacity - only used to calculate maximumStorage which is not used
    // maximumStorage - calculated but not used in heat load calculations
};

type StorageContextValue = {
    roomData: RoomData;
    productData: ProductData;
    miscData: MiscellaneousData;
    saveRoomData: (d: RoomData) => void;
    saveProductData: (d: ProductData) => void;
    saveMiscData: (d: MiscellaneousData) => void;
    resetToDefaults: () => void;
};

const StorageContext = createContext<StorageContextValue | undefined>(undefined);

export const StorageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [roomData, setRoomData] = useState<RoomData>(defaultRoomData);
    const [productData, setProductData] = useState<ProductData>(defaultProductData);
    const [miscData, setMiscData] = useState<MiscellaneousData>(defaultMiscData);

    // Load from storage once - simplified for React Native compatibility
    useEffect(() => {
        // For now, just use defaults - storage can be added later if needed
        console.log('Cold room calculator initialized with default values');
    }, []);

    const saveRoomData = (data: RoomData) => {
        setRoomData({ ...data });
        triggerGlobalUpdate();
    };

    const saveProductData = (data: ProductData) => {
        setProductData({ ...data });
        triggerGlobalUpdate();
    };

    const saveMiscData = (data: MiscellaneousData) => {
        setMiscData({ ...data });
        triggerGlobalUpdate();
    };

    const resetToDefaults = () => {
        setRoomData({ ...defaultRoomData });
        setProductData({ ...defaultProductData });
        setMiscData({ ...defaultMiscData });
        triggerGlobalUpdate();
    };

    const value = useMemo<StorageContextValue>(() => ({
        roomData,
        productData,
        miscData,
        saveRoomData,
        saveProductData,
        saveMiscData,
        resetToDefaults,
    }), [roomData, productData, miscData]);

    return (
        <StorageContext.Provider value={value}>
            {children}
        </StorageContext.Provider>
    );
};

export const useStorageContext = () => {
    const ctx = useContext(StorageContext);
    if (!ctx) throw new Error('useStorageContext must be used within StorageProvider');
    return ctx;
};
