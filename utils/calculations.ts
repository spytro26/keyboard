import { RoomData, ProductData, MiscellaneousData, CalculationResults, FreezerProductData, FreezerMiscellaneousData, FreezerCalculationResults } from '@/types/calculation';
import { BlastRoomData, BlastProductData, BlastMiscellaneousData, BlastCalculationResults } from '@/hooks/BlastStorageProvider';

// Unit conversion utilities
export const convertTemperature = (value: number, fromUnit: 'C' | 'F', toUnit: 'C' | 'F'): number => {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'C' && toUnit === 'F') return (value * 9/5) + 32;
  if (fromUnit === 'F' && toUnit === 'C') return (value - 32) * 5/9;
  return value;
};

export const convertMass = (value: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs'): number => {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'kg' && toUnit === 'lbs') return value * 2.20462;
  if (fromUnit === 'lbs' && toUnit === 'kg') return value / 2.20462;
  return value;
};

export const convertArea = (value: number, fromUnit: 'm²' | 'ft²', toUnit: 'm²' | 'ft²'): number => {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'm²' && toUnit === 'ft²') return value * 10.7639;
  if (fromUnit === 'ft²' && toUnit === 'm²') return value / 10.7639;
  return value;
};

export const convertVolume = (value: number, fromUnit: 'm³' | 'ft³', toUnit: 'm³' | 'ft³'): number => {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'm³' && toUnit === 'ft³') return value * 35.3147;
  if (fromUnit === 'ft³' && toUnit === 'm³') return value / 35.3147;
  return value;
};

// Length conversion function (for existing cold room and freezer calculations)
export const convertLength = (value: number, from: 'm' | 'ft', to: 'm' | 'ft'): number => {
  if (from === to) return value;
  if (from === 'ft' && to === 'm') return value * 0.3048;
  if (from === 'm' && to === 'ft') return value / 0.3048;
  return value;
};

// Temperature conversion alias (for compatibility with existing code)
export const convertTemp = (value: number, from: 'C' | 'F', to: 'C' | 'F'): number => {
  return convertTemperature(value, from, to);
};

// U-factor calculation based on insulation thickness (Excel methodology)
// U = 1 / R_total, where R_total includes insulation, air films, and structural layers
const calculateUFactor = (insulationThickness: number, insulationType: string = 'PUF'): number => {
  // Standard thermal conductivity values (W/m·K)
  const thermalConductivity: { [key: string]: number } = {
    'PUF': 0.022,      // Polyurethane foam - Excel standard
    'EPS': 0.036,      // Expanded polystyrene
    'XPS': 0.029,      // Extruded polystyrene
    'PIR': 0.022,      // Polyisocyanurate
    'Fiberglass': 0.040
  };
  
  const k = thermalConductivity[insulationType] || thermalConductivity['PUF'];
  
  // Thermal resistances (m²·K/W)
  const R_inside_air = 0.13;     // Internal air film
  const R_outside_air = 0.04;    // External air film  
  const R_structure = 0.15;      // Structural elements (concrete/steel)
  
  // Insulation resistance: R = thickness(m) / k
  const R_insulation = (insulationThickness / 1000) / k; // Convert mm to m
  
  // Total thermal resistance
  const R_total = R_inside_air + R_insulation + R_structure + R_outside_air;
  
  // U-factor = 1 / R_total
  return 1 / R_total;
};

// Storage capacity validation (Excel methodology)
const validateStorageCapacity = (
  storageCapacity: number, // kg/m³
  maximumStorage: number,  // kg
  roomVolume: number       // m³
): { isValid: boolean; maxCapacity: number; utilizationPercent: number } => {
  const maxCapacity = storageCapacity * roomVolume; // Maximum theoretical capacity
  const utilizationPercent = (maximumStorage / maxCapacity) * 100;
  const isValid = maximumStorage <= maxCapacity;
  
  return {
    isValid,
    maxCapacity,
    utilizationPercent
  };
};

// Air circulation calculation based on storage capacity (Excel methodology)
const calculateAirFlowRequirement = (
  totalLoad: number,        // Total cooling load in W
  tempDiff: number,         // Temperature difference in K
  storageCapacity: number   // kg/m³
): number => {
  // Excel formula: CFM = Load / (1.08 × ΔT × density_factor)
  // Higher storage capacity requires more air circulation
  const densityFactor = Math.max(1.0, storageCapacity / 100); // Adjustment factor
  const tempDiffF = tempDiff * 9/5; // Convert K to °F difference
  return totalLoad / (1.08 * tempDiffF * densityFactor);
};

export const calculateHeatLoad = (
  roomData: RoomData,
  productData: ProductData,
  miscData: MiscellaneousData
): CalculationResults => {
  
  // Convert all units to metric for calculation (matching Excel)
  const length = convertLength(roomData.length, roomData.lengthUnit, 'm');
  const width = convertLength(roomData.width, roomData.lengthUnit, 'm');
  const height = convertLength(roomData.height, roomData.lengthUnit, 'm');
  
  const productMass = convertMass(productData.massBeforeFreezing, productData.massUnit, 'kg');
  const respirationMassKg = convertMass(productData.respirationMass, productData.massUnit, 'kg');
  
  // Convert temperatures to Celsius for calculation
  const ambientTempC = convertTemp(miscData.ambientTemp, miscData.tempUnit, 'C');
  const roomTempC = convertTemp(miscData.roomTemp, miscData.tempUnit, 'C');
  const productIncomingC = convertTemp(productData.enteringTemp, productData.tempUnit, 'C');
  const productOutgoingC = convertTemp(productData.finalTemp, productData.tempUnit, 'C');
  
  // Calculate temperature differences (Excel exact logic)
  const wallTempDiff = ambientTempC - roomTempC; 
  const ceilingTempDiff = ambientTempC - roomTempC; 
  const floorTempDiff = 28 - roomTempC; // Excel uses 28°C for floor, not ambient temp
  const productTempDiff = productIncomingC - productOutgoingC; 
  
  // Calculate areas (Excel exact formulas)
  // Excel: Walls = ((E3+F3)*2*G3) = ((B+H)*2*L)
  const totalWallArea = ((width + height) * 2) * length;
  // Excel: Ceiling = F3*E3 = L*B
  const ceilingArea = length * width;
  // Excel: Floor = E3*F3 = B*L
  const floorArea = width * length;
  
  // Calculate internal volume (Excel formula: =G4-SUM(D8:D10)*(D51/1000)-((D53/1000)*D9))
  // Simplified for now - will implement full formula later
  const internalVolume = length * width * height;
  
  // Calculate U-factors based on insulation thickness (Excel methodology)
  const wallUFactor = calculateUFactor(roomData.wallInsulationThickness, roomData.insulationType);
  const ceilingUFactor = calculateUFactor(roomData.ceilingInsulationThickness, roomData.insulationType);
  const floorUFactor = calculateUFactor(roomData.floorInsulationThickness, roomData.insulationType);
  
  // TRANSMISSION LOADS (kJ/24Hr) - EXACT Excel formulas
  // Excel: =((E8*D8*C8)/1000)*3600*F8
  const wallLoad = ((wallTempDiff * totalWallArea * wallUFactor) / 1000) * 3600 * roomData.wallHours;
  const ceilingLoad = ((ceilingTempDiff * ceilingArea * ceilingUFactor) / 1000) * 3600 * roomData.ceilingHours;
  const floorLoad = ((floorTempDiff * floorArea * floorUFactor) / 1000) * 3600 * roomData.floorHours;
  const totalTransmissionLoad = wallLoad + ceilingLoad + floorLoad;
  
  // PRODUCT LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =(C14*D14*E14)*(24/F14) = (Mass * Cp * TempDiff) * (24/PullDownHrs)
  const productLoad = (productMass * productData.cpAboveFreezing * productTempDiff) * (24 / productData.pullDownHours);
  
  // RESPIRATION LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =(C17*D17*3.6*24/1000) = (Mass * Watts/Tonne * 3.6 * 24) / 1000
  const respirationLoad = (respirationMassKg * productData.watts * 3.6 * 24) / 1000;
  
  // AIR CHANGE LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =C21*D21*3600*F21 = Air change rate * Enthalpy diff * 3600 * Hours
  const airChangeLoad = miscData.airChangeRate * miscData.enthalpyDiff * 3600 * miscData.hoursOfLoad;
  
  // EQUIPMENT LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =(C25*D25*3600*F25) = Fan Rating * Quantity * 3600 * Hours
  const equipmentLoad = miscData.fanMotorRating * miscData.fanQuantity * 3600 * miscData.equipmentUsageHours;
  
  // OCCUPANCY LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =(C27*D27*F27)*3600 = People * Heat per person * Hours * 3600
  const occupancyLoad = (miscData.occupancyCount * miscData.occupancyHeatEquiv * miscData.occupancyUsageHours) * 3600;
  
  // LIGHT LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =(C29*3600*F29) = Light power * 3600 * Hours
  // C29 should be user input in Watts, convert to kW
  const lightPower = miscData.lightPower / 1000; // Convert W to kW
  const lightLoad = lightPower * 3600 * miscData.lightUsageHours;
  
  // DOOR HEATERS LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =C33*D33*3600*F33 where C33 = (((D62+E62)*2)/1000)*0.025
  // Door perimeter = 2 * (width + height) - this is the correct formula
  let doorWidth = miscData.doorClearOpeningWidth || 900; // default value
  let doorHeight = miscData.doorClearOpeningHeight || 2000; // default value
  
  // Convert to mm if units are in meters
  if (miscData.doorDimensionUnit === 'm') {
    doorWidth = doorWidth * 1000; // Convert m to mm
    doorHeight = doorHeight * 1000; // Convert m to mm
  }
  
  const doorPerimeter = ((doorWidth + doorHeight) * 2) / 1000; // Convert mm to m
  const doorHeaterCapacity = doorPerimeter * 0.025; // Excel formula: 0.025 kW per meter of door perimeter
  const doorHeaterLoad = doorHeaterCapacity * miscData.doorHeaterQuantity * 3600 * miscData.doorHeaterUsageHours;
  
  const totalMiscLoad = equipmentLoad + occupancyLoad + lightLoad + doorHeaterLoad;
  
  // TOTAL LOAD CALCULATIONS - EXACT Excel formulas
  const totalLoadKJ = wallLoad + ceilingLoad + floorLoad + productLoad + respirationLoad + airChangeLoad + equipmentLoad + occupancyLoad + lightLoad + doorHeaterLoad;
  
  // Convert to kW (Excel: G41 = G40/(24*3600))
  const totalLoadKw = totalLoadKJ / (24 * 3600);
  
  // Refrigeration capacity in TR (Excel: G42 = G41/3.517)
  const refrigerationCapacityTR = totalLoadKw / 3.517;
  
  // Capacity including safety (Excel: G43 = G42*(100+D43)/100) - Fixed at 20%
  const capacityIncludingSafety = refrigerationCapacityTR * 1.20; // 20% safety factor
  
  // Individual TR calculations (Excel: =G8/(3600*3.517*24))
  const trConversionFactor = 3600 * 3.517 * 24;
  const wallLoadTR = wallLoad / trConversionFactor;
  const ceilingLoadTR = ceilingLoad / trConversionFactor;
  const floorLoadTR = floorLoad / trConversionFactor;
  const productLoadTR = productLoad / trConversionFactor;
  const respirationLoadTR = respirationLoad / trConversionFactor;
  const airChangeLoadTR = airChangeLoad / trConversionFactor;
  const equipmentLoadTR = equipmentLoad / trConversionFactor;
  const occupancyLoadTR = occupancyLoad / trConversionFactor;
  const lightLoadTR = lightLoad / trConversionFactor;
  const doorHeaterLoadTR = doorHeaterLoad / trConversionFactor;
  const totalLoadTR = wallLoadTR + ceilingLoadTR + floorLoadTR + productLoadTR + respirationLoadTR + airChangeLoadTR + equipmentLoadTR + occupancyLoadTR + lightLoadTR + doorHeaterLoadTR;
  
  // Sensible and Latent Heat (Excel: G44, G45, G46)
  // For cold room, sensible heat includes most loads, latent heat is minimal
  const sensibleHeat = wallLoad + ceilingLoad + floorLoad + productLoad + equipmentLoad + occupancyLoad + lightLoad + doorHeaterLoad;
  const latentHeat = respirationLoad + airChangeLoad;
  const sensibleHeatRatio = sensibleHeat / totalLoadKJ;
  
  // Air Quantity Required (Excel: G47 = ((G42*12000)*G46)/(5*1.08))
  const airQtyRequired = ((refrigerationCapacityTR * 12000) * sensibleHeatRatio) / (5 * 1.08);
  
  // Maximum Storage (Excel: D64 = H4*35.28*D63) - NOT USED in heat load calculations
  // const maximumStorage = internalVolume * 35.28 * miscData.storageCapacity;
  
  return {
    // Transmission loads (kJ/24Hr)
    wallLoad,
    ceilingLoad,
    floorLoad,
    totalTransmissionLoad,
    
    // Product loads (kJ/24Hr)
    productLoad,
    
    // Respiration load (kJ/24Hr)
    respirationLoad,
    
    // Air change load (kJ/24Hr)
    airChangeLoad,
    
    // Miscellaneous loads (kJ/24Hr)
    equipmentLoad,
    occupancyLoad,
    lightLoad,
    doorHeaterLoad,
    totalMiscLoad,
    
    // Final results
    totalLoadKJ,
    totalLoadKw,
    refrigerationCapacityTR,
    capacityIncludingSafety,
    
    // Sensible and Latent Heat
    sensibleHeat,
    latentHeat,
    sensibleHeatRatio,
    
    // Air Quantity Required
    airQtyRequired,
    
    // Individual TR values
    wallLoadTR,
    ceilingLoadTR,
    floorLoadTR,
    productLoadTR,
    respirationLoadTR,
    airChangeLoadTR,
    equipmentLoadTR,
    occupancyLoadTR,
    lightLoadTR,
    doorHeaterLoadTR,
    totalLoadTR,
    
    // Temperature differences
    wallTempDiff,
    ceilingTempDiff,
    floorTempDiff,
    productTempDiff,
    
    // Additional Excel matching properties
    internalVolume
    // maximumStorage - removed as it's not used in heat load calculations
  };
};

// FREEZER CALCULATIONS - Based on Excel formulas EXACTLY
export const calculateFreezerHeatLoad = (
  roomData: RoomData,
  productData: FreezerProductData,
  miscData: FreezerMiscellaneousData
): FreezerCalculationResults => {
  
  // Convert all units to metric for calculation (matching Excel)
  const length = convertLength(roomData.length, roomData.lengthUnit, 'm');
  const width = convertLength(roomData.width, roomData.lengthUnit, 'm');  
  const height = convertLength(roomData.height, roomData.lengthUnit, 'm');
  
  // Convert product masses to kg for calculation
  const productMass = convertMass(productData.massBeforeFreezing, productData.massUnit, 'kg');
  const dailyLoadingKg = convertMass((miscData as any).dailyLoading || productData.massBeforeFreezing, productData.massUnit, 'kg');
  const respirationMassKg = convertMass(productData.respirationMass, productData.massUnit, 'kg');
  
  // Convert temperatures to Celsius for calculation
  const ambientTempC = convertTemp(miscData.ambientTemp, miscData.tempUnit, 'C');
  const roomTempC = convertTemp(miscData.roomTemp, miscData.tempUnit, 'C');
  const productIncomingC = convertTemp(miscData.productIncoming, miscData.tempUnit, 'C');
  const productOutgoingC = convertTemp(miscData.productOutgoing, miscData.tempUnit, 'C');
  const freezingPointC = productData.freezingPoint;
  
  // Calculate temperature differences (Excel exact logic)
  const wallTempDiff = ambientTempC - roomTempC; 
  const ceilingTempDiff = ambientTempC - roomTempC; 
  const floorTempDiff = 28 - roomTempC; // Excel uses 28°C for floor, not ambient temp
  
  // Calculate areas EXACTLY as Excel
  // Wall area calculation: 2*(L*H) + 2*(B*H)
  const wallArea1 = length * height * 2; // Two walls (length sides)
  const wallArea2 = width * height * 2;  // Two walls (width sides)
  const totalWallArea = wallArea1 + wallArea2; 
  const ceilingArea = length * width; 
  const floorArea = length * width;   
  const internalVolume = length * width * height; 
  
  // Calculate U-factors based on insulation thickness (Excel methodology)
  const wallUFactor = calculateUFactor(roomData.wallInsulationThickness, roomData.insulationType);
  const ceilingUFactor = calculateUFactor(roomData.ceilingInsulationThickness, roomData.insulationType);
  const floorUFactor = calculateUFactor(roomData.floorInsulationThickness, roomData.insulationType);   
  
  // TRANSMISSION LOADS (kJ/24Hr) - EXACT Excel formulas
  // Excel: =((E8*D8*C8)/1000)*3600*F8
  const wallLoad = ((wallTempDiff * totalWallArea * wallUFactor) / 1000) * 3600 * roomData.wallHours;
  const ceilingLoad = ((ceilingTempDiff * ceilingArea * ceilingUFactor) / 1000) * 3600 * roomData.ceilingHours;
  const floorLoad = ((floorTempDiff * floorArea * floorUFactor) / 1000) * 3600 * roomData.floorHours;
  const totalTransmissionLoad = wallLoad + ceilingLoad + floorLoad;
  
  // PRODUCT LOAD (kJ/24Hr) - Three phases for freezer (EXACT Excel formulas)
  // Excel logic: C14=IF(D60<D65,0,D51), C15=3000, C16=D51
  // Phase 1: Before freezing (incoming temp to freezing point)
  // Excel formula: =(C14*D14*E14)*(24/F14)
  const tempDiffBeforeFreezing = productIncomingC - freezingPointC; 
  const beforeFreezingMass = productIncomingC < freezingPointC ? 0 : dailyLoadingKg; // Excel: IF(D60<D65,0,D51)
  const beforeFreezingLoad = (beforeFreezingMass * productData.cpAboveFreezing * tempDiffBeforeFreezing) * (24 / productData.pullDownHours);
  
  // Phase 2: Latent heat (freezing) - Excel shows this in separate row
  // Excel formula: =(C15*D15)*(24/F15) where C15=3000 (fixed value)
  const latentHeatLoad = (dailyLoadingKg * productData.latentHeatOfFusion) * (24 / productData.pullDownHours);
  
  // Phase 3: After freezing (freezing point to final temp)
  // Excel formula: =(C16*D16*E16)*(24/F16) where C16=D51 (daily loading)
  const tempDiffAfterFreezing = productIncomingC < freezingPointC ? (productIncomingC - productOutgoingC) : (freezingPointC - productOutgoingC);
  const afterFreezingLoad = (dailyLoadingKg * productData.cpBelowFreezing * tempDiffAfterFreezing) * (24 / productData.pullDownHours);
  
  // Total product load - Excel exact calculation
  const totalProductLoad = beforeFreezingLoad + latentHeatLoad + afterFreezingLoad;
  const productLoad = totalProductLoad; // For compatibility with base interface
  
  // RESPIRATION LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =(C19*D19*3.6*24/1000) where C19=D51 (daily loading)
  const respirationLoad = (dailyLoadingKg * productData.watts * 3.6 * 24) / 1000;
  
  // AIR CHANGE LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =C23*D23*3600*F23
  const airChangeLoad = miscData.airChangeRate * miscData.enthalpyDiff * 3600 * miscData.hoursOfLoad;
  
  // MISCELLANEOUS LOADS (kJ/24Hr) - EXACT Excel calculations
  
  // Fan Motor Rating - Excel shows 0.37 KW with Quantity 3, Usage 16/24 hrs
  const fanMotorRating = miscData.fanMotorRating || 0.37; // kW per fan
  const fanQuantity = miscData.fanQuantity || 6; // Number of fans
  const fanUsageHours = miscData.fanUsageHours || 24; // Hours of usage
  const fanMotorLoad = (fanMotorRating * fanQuantity * 3600 * fanUsageHours);
  
  // No of people - Excel shows 4 with Heat Equiv 0.407 kW
  const numberOfPeople = miscData.numberOfPeople || 4;
  const peopleUsageFactor = miscData.peopleUsageFactor || 0.407; // kW heat equiv
  const peopleLoad = (numberOfPeople * peopleUsageFactor * 3600 * miscData.occupancyUsageHours);
  
  // Light load - Excel shows 0.14 kW with Usage 16 hrs  
  const lightPowerKw = miscData.lightPowerKw || 0.14;
  const lightUsageHrs = miscData.lightUsageHours || 16;
  const lightLoadExact = (lightPowerKw * 3600 * lightUsageHrs);
  

  // Heater capacity - Excel shows different heater types (continuous operation)
  // Peripheral heaters
  const peripheralHeaterPower = miscData.peripheralHeaterPower || 1.5; // kW per heater
  const peripheralHeaterQuantity = miscData.peripheralHeaterQuantity || 8; // Number of heaters
  const peripheralHeatersLoad = peripheralHeaterPower * peripheralHeaterQuantity * 3600 * 24; // 24 hrs continuous
  
  // Door heaters - Excel formula: =IF(D59>5.(((D68+E68)*2)/1000)*0.025.(((D68+E68)*2)/1000)*0.045)
  let doorWidth = miscData.doorClearOpeningWidth || 900; // default value
  let doorHeight = miscData.doorClearOpeningHeight || 1800; // default value
  
  // Convert to mm if units are in meters
  if (miscData.doorDimensionUnit === 'm') {
    doorWidth = doorWidth * 1000; // Convert m to mm
    doorHeight = doorHeight * 1000; // Convert m to mm
  }
  
  const doorPerimeter = (doorWidth + doorHeight) * 2; // mm
  const doorPerimeterM = doorPerimeter / 1000; // convert to meters
  
  // Excel logic: if room temp > 5°C, use 0.025, else use 0.045
  const doorHeaterFactor = roomTempC > 5 ? 0.025 : 0.045;
  const doorHeaterPower = doorPerimeterM * doorHeaterFactor; // kW per door
  const doorHeaterQuantity = miscData.doorHeaterQuantity || 1; // Number of doors
  const doorHeatersLoad = doorHeaterPower * doorHeaterQuantity * 3600 * 24; // 24 hrs continuous
  
  // Tray heaters - Excel shows 2 kW, 2 heaters, 2 hrs
  const trayHeaterPower = miscData.trayHeaterPower || 2; // kW per tray
  const trayHeaterQuantity = miscData.trayHeaterQuantity || 2; // Number of trays
  const trayHeatersLoad = trayHeaterPower * trayHeaterQuantity * 3600 * 2; // 2 hrs usage
  
  // Drain heaters
  const drainHeaterPower = miscData.drainHeaterPower || 0.04; // kW per drain
  const drainHeaterQuantity = miscData.drainHeaterQuantity || 1; // Number of drains
  const drainHeatersLoad = drainHeaterPower * drainHeaterQuantity * 3600 * 24; // 24 hrs continuous
  
  // Total heater load
  const heaterLoad = peripheralHeatersLoad + doorHeatersLoad + trayHeatersLoad + drainHeatersLoad;
  
  // Equipment load (using fan motor load calculated above)
  const equipmentLoad = fanMotorLoad;
  
  // Occupancy load (using people load calculated above)  
  const occupancyLoad = peopleLoad;
  
  // Light load (using exact calculation above)
  const lightLoad = lightLoadExact;
  
  // Steam humidifiers: Excel shows 0 for freezer
  const steamHumidifierLoad = 0;
  
  const totalMiscLoad = equipmentLoad + occupancyLoad + lightLoad + heaterLoad + steamHumidifierLoad;
  
  // TOTAL LOAD CALCULATIONS - EXACT Excel formulas
  const totalLoadKJ = totalTransmissionLoad + totalProductLoad + respirationLoad + airChangeLoad + totalMiscLoad;
  
  // Convert to kW (Excel: G41 = G40/(24*3600))
  const totalLoadKw = totalLoadKJ / (24 * 3600);
  
  // Refrigeration capacity in TR (Excel: G42 = G41/3.517)
  const refrigerationCapacityTR = totalLoadKw / 3.517;
  
  // Capacity including safety (Excel: G43 = G42*(100+D43)/100)
  const capacityIncludingSafety = 20; // 20% safety factor
  const capacityTR = refrigerationCapacityTR * (100 + capacityIncludingSafety) / 100;
  
  // Individual TR calculations (Excel: =G8/(3600*3.517*24))
  const trConversionFactor = 3600 * 3.517 * 24;
  const wallLoadTR = wallLoad / trConversionFactor;
  const ceilingLoadTR = ceilingLoad / trConversionFactor;
  const floorLoadTR = floorLoad / trConversionFactor;
  const productLoadTR = totalProductLoad / trConversionFactor;
  const respirationLoadTR = respirationLoad / trConversionFactor;
  const airChangeLoadTR = airChangeLoad / trConversionFactor;
  const equipmentLoadTR = equipmentLoad / trConversionFactor;
  const occupancyLoadTR = occupancyLoad / trConversionFactor;
  const lightLoadTR = lightLoad / trConversionFactor;
  const heaterLoadTR = heaterLoad / trConversionFactor;
  const totalLoadTR = wallLoadTR + ceilingLoadTR + floorLoadTR + productLoadTR + respirationLoadTR + airChangeLoadTR + equipmentLoadTR + occupancyLoadTR + lightLoadTR + heaterLoadTR;
  
  // Sensible and Latent Heat (Excel: G44, G45, G46)
  const sensibleHeat = totalTransmissionLoad + beforeFreezingLoad + afterFreezingLoad + equipmentLoad + occupancyLoad + lightLoad + heaterLoad;
  const latentHeat = respirationLoad + airChangeLoad;
  const sensibleHeatRatio = sensibleHeat / totalLoadKJ;
  
  // Air Quantity Required (Excel: G47 = ((G42*12000)*G46)/(5*1.08))
  const airQtyRequired = ((refrigerationCapacityTR * 12000) * sensibleHeatRatio) / (5 * 1.08);
  
  // Additional Excel matching calculations
  const loadInKJ = totalLoadKJ; 
  const loadInKw = totalLoadKw; 
  const loadInBtu = totalLoadKw * 3412; // Convert kW to BTU/hr
  
  // Daily loading calculations (Excel formulas)
  const dailyLoading = (miscData as any).dailyLoading || 3000; // Excel: 3000 kg/Day
  
  // Temperature differences for display
  const productTempDiff = productIncomingC - productOutgoingC; 
  
  return {
    wallLoad: wallLoad / 1000, // Convert to kW for display
    ceilingLoad: ceilingLoad / 1000,
    floorLoad: floorLoad / 1000,
    totalTransmissionLoad: totalTransmissionLoad / 1000,
    productLoad: productLoad / 1000,
    beforeFreezingLoad: beforeFreezingLoad / 1000,
    latentHeatLoad: latentHeatLoad / 1000,
    afterFreezingLoad: afterFreezingLoad / 1000,
    totalProductLoad: totalProductLoad / 1000,
    respirationLoad: respirationLoad / 1000,
    airChangeLoad: airChangeLoad / 1000,
    equipmentLoad: equipmentLoad / 1000,
    occupancyLoad: occupancyLoad / 1000,
    lightLoad: lightLoad / 1000,
    doorHeaterLoad: (doorHeatersLoad + trayHeatersLoad + drainHeatersLoad) / 1000, // Combined heater loads
    totalMiscLoad: totalMiscLoad / 1000,
    totalLoadKJ,
    totalLoadKw,
    refrigerationCapacityTR,
    capacityIncludingSafety: capacityTR,
    sensibleHeat: sensibleHeat / 1000,
    latentHeat: latentHeat / 1000,
    sensibleHeatRatio,
    airQtyRequired,
    
    // Individual TR values
    wallLoadTR,
    ceilingLoadTR,
    floorLoadTR,
    productLoadTR,
    respirationLoadTR,
    airChangeLoadTR,
    equipmentLoadTR,
    occupancyLoadTR,
    lightLoadTR,
    doorHeaterLoadTR: heaterLoadTR,
    totalLoadTR,
    
    // Temperature differences
    wallTempDiff,
    ceilingTempDiff,
    floorTempDiff,
    productTempDiff,
    
    // Additional properties
    internalVolume
  };
};

// BLAST FREEZER CALCULATIONS - EXACT Excel formulas
export const calculateBlastHeatLoad = (
  roomData: BlastRoomData,
  productData: BlastProductData,
  miscData: BlastMiscellaneousData
): BlastCalculationResults => {
  
  // Convert room dimensions to meters
  const length = convertLength(roomData.length, roomData.lengthUnit, 'm');
  const width = convertLength(roomData.width, roomData.lengthUnit, 'm');
  const height = convertLength(roomData.height, roomData.lengthUnit, 'm');
  
  // Convert temperatures to Celsius
  const ambientTempC = convertTemperature(roomData.ambientTemp, roomData.tempUnit, 'C');
  const roomTempC = convertTemperature(roomData.roomTemp, roomData.tempUnit, 'C');
  const productEnteringTempC = convertTemperature(productData.productEnteringTemp, productData.tempUnit, 'C');
  const productFinalTempC = convertTemperature(productData.productFinalTemp, productData.tempUnit, 'C');
  const freezingPointC = convertTemperature(productData.freezingPoint, productData.tempUnit, 'C');
  
  // Convert masses to kg - Use capacityRequired from productData as the primary mass
  const capacityRequiredKg = convertMass(productData.capacityRequired, productData.massUnit, 'kg');
  const massKg = capacityRequiredKg; // Excel uses same mass for all calculations
  
  // Calculate areas EXACTLY as Excel
  // Wall area: 2*(L*H) + 2*(B*H) = 2*(5*3.5) + 2*(5*3.5) = 35 + 35 = 70 m²
  const wallArea = (length * height * 2) + (width * height * 2);
  const ceilingArea = length * width; // 5 * 5 = 25 m²
  const floorArea = length * width;   // 5 * 5 = 25 m²
  
  // Calculate temperature differences EXACTLY as Excel
  const wallTempDiff = ambientTempC - roomTempC;     // 43 - (-35) = 78K
  const ceilingTempDiff = ambientTempC - roomTempC;  // 43 - (-35) = 78K
  const floorTempDiff = 28 - roomTempC;              // 28 - (-35) = 63K (Excel uses 28°C for floor)
  
  // Calculate U-factors based on insulation thickness (Excel methodology)
  const wallUFactor = calculateUFactor(roomData.wallInsulationThickness, roomData.insulationType);
  const ceilingUFactor = calculateUFactor(roomData.ceilingInsulationThickness, roomData.insulationType);
  const floorUFactor = calculateUFactor(roomData.floorInsulationThickness, roomData.insulationType);
  
  // TRANSMISSION LOADS - Excel formulas G8, G9, G10
  // Excel: =((E8*D8*C8)/1000)*3600*F8
  // Where: E8=TD, D8=Area, C8=U-factor, F8=Hours (user input)
  const wallLoad = ((wallTempDiff * wallArea * wallUFactor) / 1000) * 3600 * roomData.wallHours;
  const ceilingLoad = ((ceilingTempDiff * ceilingArea * ceilingUFactor) / 1000) * 3600 * roomData.ceilingHours;
  const floorLoad = ((floorTempDiff * floorArea * floorUFactor) / 1000) * 3600 * roomData.floorHours;
  const totalTransmissionLoad = wallLoad + ceilingLoad + floorLoad;

  // PRODUCT LOADS - Excel formulas G14, G15, G16
  // Calculate temperature differences for product
  const tempDiffBeforeFreezing = productEnteringTempC - freezingPointC; // -5 - (-1.7) = -3.3K
  const tempDiffAfterFreezing = freezingPointC - productFinalTempC;      // -1.7 - (-30) = 28.3K
  
  // Excel G14: =C14*D14*E14*(D46/F14) - Before freezing
  // C14=Mass(2000), D14=Cp(3.49), E14=TempDiff(-3.3), D46=BatchHours(8), F14=PullDownHours(8)
  // Result: =2000*3.49*(-3.3)*(8/8) = -23034 kJ
  const beforeFreezingLoad = massKg * productData.cpAboveFreezing * tempDiffBeforeFreezing * (productData.batchHours / productData.pullDownHours);
  
  // Excel G15: =(C15*D15)*(D46/F15) - Latent heat
  // C15=Mass(2000), D15=LatentHeat(233), D46=BatchHours(8), F15=PullDownHours(8)
  // Result: =(2000*233)*(8/8) = 466000 kJ
  const latentHeatLoad = (massKg * productData.latentHeat) * (productData.batchHours / productData.pullDownHours);
  
  // Excel G16: =(C16*D16*E16)*(D46/F16) - After freezing
  // C16=Mass(2000), D16=Cp(2.14), E16=TempDiff(28.3), D46=BatchHours(8), F16=PullDownHours(8)
  // Result: =(2000*2.14*28.3)*(8/8) = 121124 kJ
  const afterFreezingLoad = (massKg * productData.cpBelowFreezing * tempDiffAfterFreezing) * (productData.batchHours / productData.pullDownHours);
  
  const totalProductLoad = beforeFreezingLoad + latentHeatLoad + afterFreezingLoad;

  // AIR CHANGE LOAD - Excel formula G20
  // Excel: =C20*D20*3600*F20
  // C20=4.2, D20=0.14, F20=2, Result: =4.2*0.14*3600*2 = 4233.6 kJ
  const airChangeLoad = miscData.airChangeRate * miscData.enthalpyDiff * 3600 * miscData.hoursOfLoad;

  // MISCELLANEOUS LOADS - Excel formulas G23, G25, G27, G29, G31, G33, G34
  // Excel G23: =(C23*D23*3600*F23) - Equipment load in kJ
  // C23=0.37, D23=3, F23=8, Result: =0.37*3*3600*8 = 31968 kJ
  const equipmentLoad = (miscData.fanMotorRating * miscData.equipmentQuantity * 3600 * miscData.equipmentHours);
  
  // Excel G25: =(C25*D25)*3600*F25 - Occupancy load in kJ
  // C25=1.0, D25=0.5, F25=1, Result: =1.0*0.5*3600*1 = 1800 kJ
  const occupancyLoad = (miscData.occupancyCount * miscData.occupancyHeatLoad) * 3600 * miscData.occupancyHours;
  
  // Excel G27: =(C27*3.6)*F27 - Light load in kJ
  // C27=0.1, F27=1.2, Result: =0.1*3.6*1.2 = 0.432 kJ
  const lightLoad = (miscData.lightLoad * 3.6) * miscData.lightHours;
  
  // Excel G29: =(C29*D29*3600*F29) - Peripheral heater load in kJ
  // C29=1.5, D29=1, F29=8, Result: =1.5*1*3600*8 = 43200 kJ
  const peripheralHeaterLoad = (miscData.peripheralHeaterCapacity * miscData.peripheralHeaterCount * 3600 * miscData.peripheralHeaterHours);
  
  // Excel G31: =(C31*D31*3600*F31) - Door heater load in kJ
  // C31=0.27, D31=1, F31=8, Result: =0.27*1*3600*8 = 7776 kJ
  const doorHeaterLoad = (miscData.doorHeaterCapacity * miscData.doorHeaterCount * 3600 * miscData.doorHeaterHours);
  
  // Excel G33: =(C33*D33*3600*F33) - Tray heater load in kJ
  // C33=2.2, D33=1, F33=0.4, Result: =2.2*1*3600*0.4 = 3168 kJ
  const trayHeaterLoad = (miscData.trayHeaterCapacity * miscData.trayHeaterCount * 3600 * miscData.trayHeaterHours);
  
  // Excel G34: =(C34*D34*3600*F34) - Drain heater load in kJ
  // C34=0.04, D34=1, F34=8, Result: =0.04*1*3600*8 = 1152 kJ
  const drainHeaterLoad = (miscData.drainHeaterCapacity * miscData.drainHeaterCount * 3600 * miscData.drainHeaterHours);
  
  const totalMiscLoad = equipmentLoad + occupancyLoad + lightLoad + peripheralHeaterLoad + doorHeaterLoad + trayHeaterLoad + drainHeaterLoad;

  // FINAL CALCULATIONS - Excel formulas G36, G37, G38, G39, G40, G41, G42, G43
  // Excel G36: =SUM(G8:G34) = 24059+8592+6940+(-23034)+466000+121124+4233.6+31968+1800+0.432+43200+7776+3168+1152 = 696925 kJ
  const totalLoadKJ = totalTransmissionLoad + totalProductLoad + airChangeLoad + totalMiscLoad;
  
  // Excel G37: =G36/(3600*D46) = 696925/(3600*8) = 24.20 kW
  const totalLoadKw = totalLoadKJ / (3600 * productData.batchHours);
  
  // Excel G38: =G37/3.517 = 24.20/3.517 = 6.88 TR
  const totalLoadTR = totalLoadKw / 3.517;
  
  // Excel G39: =G38*(100+D39)/100 (20% safety factor)
  const capacityIncludingSafety = 20; // 20% safety factor
  const refrigerationCapacity = totalLoadTR * (100 + capacityIncludingSafety) / 100;
  
  // Excel G40: =SUM(G8:G14)+SUM(G16:G17)+0.4*C (simplified)
  const sensibleHeatKJ24Hr = totalTransmissionLoad + beforeFreezingLoad + afterFreezingLoad + (0.4 * airChangeLoad);
  
  // Excel G41: =G15+0.6*G20+0.6*G25
  const latentHeatKJ24Hr = latentHeatLoad + (0.6 * airChangeLoad) + (0.6 * occupancyLoad);
  
  // Excel G42: =G40/(G40+G41)
  const shr = sensibleHeatKJ24Hr / (sensibleHeatKJ24Hr + latentHeatKJ24Hr);
  
  // Excel G43: =((G37*12000)*G42)/(5*1.08)
  const airQtyRequiredCfm = ((totalLoadKw * 12000) * shr) / (5 * 1.08);

  // Individual TR calculations - Excel formulas: =G8/(3600*3.517*24)
  const trConversionFactor = 3600 * 3.517 * 24;
  const wallLoadTR = wallLoad / trConversionFactor;
  const ceilingLoadTR = ceilingLoad / trConversionFactor;
  const floorLoadTR = floorLoad / trConversionFactor;
  const beforeFreezingLoadTR = beforeFreezingLoad / trConversionFactor;
  const latentHeatLoadTR = latentHeatLoad / trConversionFactor;
  const afterFreezingLoadTR = afterFreezingLoad / trConversionFactor;
  const airChangeLoadTR = airChangeLoad / trConversionFactor;
  const equipmentLoadTR = equipmentLoad / trConversionFactor;
  const occupancyLoadTR = occupancyLoad / trConversionFactor;
  const lightLoadTR = lightLoad / trConversionFactor;
  const peripheralHeaterLoadTR = peripheralHeaterLoad / trConversionFactor;
  const doorHeaterLoadTR = doorHeaterLoad / trConversionFactor;
  const trayHeaterLoadTR = trayHeaterLoad / trConversionFactor;
  const drainHeaterLoadTR = drainHeaterLoad / trConversionFactor;

  return {
    wallLoad,
    ceilingLoad,
    floorLoad,
    totalTransmissionLoad,
    beforeFreezingLoad,
    latentHeatLoad,
    afterFreezingLoad,
    totalProductLoad,
    airChangeLoad,
    equipmentLoad,
    occupancyLoad,
    lightLoad,
    peripheralHeaterLoad,
    doorHeaterLoad,
    trayHeaterLoad,
    drainHeaterLoad,
    totalMiscLoad,
    totalLoadKJ,
    totalLoadKw,
    totalLoadTR,
    capacityIncludingSafety,
    sensibleHeatKJ24Hr,
    latentHeatKJ24Hr,
    shr,
    airQtyRequiredCfm,
    refrigerationCapacity,
    // Individual TR calculations
    wallLoadTR,
    ceilingLoadTR,
    floorLoadTR,
    beforeFreezingLoadTR,
    latentHeatLoadTR,
    afterFreezingLoadTR,
    airChangeLoadTR,
    equipmentLoadTR,
    occupancyLoadTR,
    lightLoadTR,
    peripheralHeaterLoadTR,
    doorHeaterLoadTR,
    trayHeaterLoadTR,
    drainHeaterLoadTR,
  };
};