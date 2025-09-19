import { useState, useEffect } from 'react';
import { RoomData, ProductData, MiscellaneousData } from '@/types/calculation';
import { useGlobalUpdate, triggerGlobalUpdate } from './useGlobalUpdate';

export const STORAGE_KEYS = {
  ROOM_DATA: 'enzo_room_data',
  PRODUCT_DATA: 'enzo_product_data',
  MISC_DATA: 'enzo_misc_data',
};

// Default values exactly matching Excel spreadsheet
const defaultRoomData: RoomData = {
  length: 3.048, // Excel shows 3.048m (10 ft)
  width: 4.5,    // Excel shows 4.5m
  height: 3.0,   // Excel shows 3.0m
  lengthUnit: 'm',
  wallUFactor: 0.295,    // Excel value
  ceilingUFactor: 0.295, // Excel value
  floorUFactor: 0.295,   // Excel value
  wallHours: 24,         // Excel shows 24 hrs
  ceilingHours: 24,      // Excel shows 24 hrs  
  floorHours: 24,        // Excel shows 24 hrs
};

const defaultProductData: ProductData = {
  massBeforeFreezing: 4000, // Excel shows 4000 kg
  massUnit: 'kg',
  cpAboveFreezing: 4.1,     // Excel shows 4.1 kJ/kg·K
  pullDownHours: 24,        // Excel shows 24 hrs
  respirationMass: 4000,    // Excel shows 4000 kg (same as mass)
  watts: 50,                // Excel shows 50 W/Tonne
};

const defaultMiscData: MiscellaneousData = {
  // Air Change (Excel row 21)
  airChangeRate: 3.4,      // Excel shows 3.4 
  enthalpyDiff: 0.10,      // Excel shows 0.10
  hoursOfLoad: 20,         // Excel shows 20 hrs
  
  // Equipment (Excel row 25)
  equipmentPower: 250,     // Excel shows 250 W (converted from 0.25 kW)
  equipmentUsageHours: 20, // Excel shows 20 hrs usage
  
  // Occupancy (Excel row 27)
  occupancyCount: 1.0,     // Excel shows 1.0 people
  occupancyHeatEquiv: 275, // Excel shows 275 W per person
  occupancyUsageHours: 20, // Excel shows 20 hrs usage
  
  // Lighting (Excel row 29)
  lightPower: 70,          // Excel shows 70 W (converted from 0.07 kW)
  lightUsageHours: 20,     // Excel shows 20 hrs usage
  
  // Heaters (Excel rows 31-35)
  peripheralHeaters: 0,    // Excel shows 0
  doorHeaters: 145,        // Excel shows 145 W (converted from 0.145 kW)
  trayHeaters: 0,          // Excel shows 0
  
  // Temperature parameters (Excel values)
  ambientTemp: 45,         // Excel shows 45°C
  roomTemp: 2,             // Excel shows 2°C
  productIncoming: 30,     // Excel shows 30°C
  productOutgoing: 4,      // Excel shows 4°C
  tempUnit: 'C',
  
  // Additional Excel parameters
  dailyLoading: 4000,      // Excel shows 4000 kg/Day
  insulationType: 'PUF',   // Excel shows PUF
  insulationThickness: 100, // Excel shows 100mm
  cpAboveFreezingMisc: 4.1,
  pullDownTime: 24,
  airFlowPerFan: 4163,     // Excel shows 4163 CFM
  doorClearOpening: 2000,  // Excel shows 2000mm
  storageCapacity: 8,      // Excel shows 8 kg/m³
  maximumStorage: 6338,    // Excel shows 6338 kgs
};

export const useStorage = () => {
  const [roomData, setRoomData] = useState<RoomData>(defaultRoomData);
  const [productData, setProductData] = useState<ProductData>(defaultProductData);
  const [miscData, setMiscData] = useState<MiscellaneousData>(defaultMiscData);
  const { updateCount } = useGlobalUpdate();

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const roomJson = localStorage.getItem(STORAGE_KEYS.ROOM_DATA);
        const productJson = localStorage.getItem(STORAGE_KEYS.PRODUCT_DATA);
        const miscJson = localStorage.getItem(STORAGE_KEYS.MISC_DATA);

        if (roomJson) setRoomData({ ...defaultRoomData, ...JSON.parse(roomJson) });
        if (productJson) setProductData({ ...defaultProductData, ...JSON.parse(productJson) });
        if (miscJson) setMiscData({ ...defaultMiscData, ...JSON.parse(miscJson) });
      } catch (error) {
        console.log('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Keep this hook instance in sync when any other screen saves data
  useEffect(() => {
    // Skip on first render if desired, but it's safe to always re-read
    try {
      const roomJson = localStorage.getItem(STORAGE_KEYS.ROOM_DATA);
      const productJson = localStorage.getItem(STORAGE_KEYS.PRODUCT_DATA);
      const miscJson = localStorage.getItem(STORAGE_KEYS.MISC_DATA);

      if (roomJson) {
        const parsed = JSON.parse(roomJson);
        setRoomData(prev => ({ ...prev, ...parsed }));
      }
      if (productJson) {
        const parsed = JSON.parse(productJson);
        setProductData(prev => ({ ...prev, ...parsed }));
      }
      if (miscJson) {
        const parsed = JSON.parse(miscJson);
        setMiscData(prev => ({ ...prev, ...parsed }));
      }
      console.log('🛰️ useStorage synced from localStorage on global update:', updateCount);
    } catch (error) {
      console.log('Error syncing data after global update:', error);
    }
  }, [updateCount]);

  // Simple save functions
  const saveRoomData = (data: RoomData) => {
    console.log('💾 Saving room data:', data);
    setRoomData({ ...data });
    localStorage.setItem(STORAGE_KEYS.ROOM_DATA, JSON.stringify(data));
    triggerGlobalUpdate(); // Force global update
  };

  const saveProductData = (data: ProductData) => {
    console.log('💾 Saving product data:', data);
    setProductData({ ...data });
    localStorage.setItem(STORAGE_KEYS.PRODUCT_DATA, JSON.stringify(data));
    triggerGlobalUpdate(); // Force global update
  };

  const saveMiscData = (data: MiscellaneousData) => {
    console.log('💾 Saving misc data:', data);
    setMiscData({ ...data });
    localStorage.setItem(STORAGE_KEYS.MISC_DATA, JSON.stringify(data));
    triggerGlobalUpdate(); // Force global update
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setRoomData({ ...defaultRoomData });
    setProductData({ ...defaultProductData });
    setMiscData({ ...defaultMiscData });
    localStorage.removeItem(STORAGE_KEYS.ROOM_DATA);
    localStorage.removeItem(STORAGE_KEYS.PRODUCT_DATA);
    localStorage.removeItem(STORAGE_KEYS.MISC_DATA);
    triggerGlobalUpdate(); // Force global update
  };

  return {
    roomData,
    productData,
    miscData,
    saveRoomData,
    saveProductData,
    saveMiscData,
    resetToDefaults,
  };
};