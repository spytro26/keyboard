import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

// Calculation types
export type CalculationType = 'cold_room' | 'blast_freezer' | 'freezer_room';

// Simplified interface for stored calculation data - only main results
export interface StoredCalculationData {
  id: string; // Document ID
  userId: string; // User's UID
  calculationType: CalculationType;

  // User and project info
  userName: string;
  projectName: string;

  // Room details
  roomLength: number;
  roomWidth: number;
  roomHeight: number;
  roomVolume: number;
  roomTemperature: number;

  // Product details
  productName: string;
  productQuantity: number;
  dailyLoading: number;

  // Main calculation results (the important stuff)
  totalLoad: number; // kW (base load without safety)
  totalLoadWithSafety: number; // kW (with 20% safety)
  totalLoadBTU: number; // BTU/hr

  // Detailed load breakdown
  totalTransmissionLoad: number; // kW
  totalProductLoad: number; // kW
  totalMiscellaneousLoad: number; // kW (also called totalMiscLoad)

  // Metadata
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
}

/**
 * Extract simplified data from PDF data
 */
export const extractMainResults = (
  calculationType: CalculationType,
  pdfData: any, // Can be from any of the three calculation types
  roomData: any,
  productData: any
): Omit<StoredCalculationData, 'id' | 'userId' | 'createdAt' | 'updatedAt'> => {
  // Helper to parse numbers reliably (handles commas and trailing units)
  const parseNumber = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isFinite(val) ? val : 0;
    const str = String(val).replace(/,/g, '').trim();
    const match = str.match(/-?\d*(?:\.\d+)?/);
    const num = match ? parseFloat(match[0] || '0') : 0;
    return isNaN(num) ? 0 : num;
  };

  // Extract total loads from finalResults with broader matching
  const finalResults = Array.isArray(pdfData.finalResults)
    ? pdfData.finalResults
    : [];
  const findFinal = (includes: string[]) =>
    finalResults.find((r: any) => {
      const lbl = (r?.label || '').toLowerCase();
      return includes.some((s) => lbl.includes(s));
    });

  const totalLoadResult = findFinal([
    'base load',
    'without safety',
    'total load (kw)',
  ]);
  const totalLoadWithSafetyResult = findFinal([
    'with safety',
    'with 20%',
    'total load with safety',
  ]);
  const totalLoadBTUResult = findFinal(['btu', 'btu/hr', 'btu per hour']);

  // Extract detailed load breakdown from sections
  let totalTransmissionLoad = 0;
  let totalProductLoad = 0;
  let totalMiscellaneousLoad = 0;

  // Find transmission loads section
  const transmissionSection = pdfData.sections?.find((s: any) =>
    s.title.toLowerCase().includes('transmission')
  );
  if (transmissionSection) {
    const totalTransmissionItem = transmissionSection.items?.find(
      (item: any) =>
        (item.label || '').toLowerCase().includes('total transmission') ||
        (item.label || '').toLowerCase().includes('transmission total')
    );
    totalTransmissionLoad = parseNumber(totalTransmissionItem?.value);
  }

  // Find product loads section
  const productSection = pdfData.sections?.find((s: any) =>
    s.title.toLowerCase().includes('product')
  );
  if (productSection) {
    const totalProductItem = productSection.items?.find((item: any) => {
      const lbl = (item.label || '').toLowerCase();
      return (
        lbl.includes('total product') ||
        lbl.includes('product total') ||
        lbl.includes('product load')
      );
    });
    totalProductLoad = parseNumber(totalProductItem?.value);
  }

  // Find other/miscellaneous loads section
  const miscSection = pdfData.sections?.find(
    (s: any) =>
      s.title.toLowerCase().includes('other') ||
      s.title.toLowerCase().includes('miscellaneous')
  );
  if (miscSection) {
    const totalMiscItem = miscSection.items?.find(
      (item: any) =>
        (item.label || '').toLowerCase().includes('total misc') ||
        (item.label || '').toLowerCase().includes('total other') ||
        (item.label || '').toLowerCase().includes('miscellaneous total')
    );
    totalMiscellaneousLoad = parseNumber(totalMiscItem?.value);
  }

  // Calculate room volume
  const roomVolume =
    (roomData.length || 0) * (roomData.width || 0) * (roomData.height || 0);

  // Extract product name with fallbacks
  let extractedProductName = 'Product';
  if (productData.productName) {
    extractedProductName = productData.productName;
  } else if (pdfData.inputs) {
    // Try to find product name in PDF inputs
    const productSection = pdfData.inputs.find((section: any) =>
      section.title?.toLowerCase().includes('product')
    );
    if (productSection) {
      const productItem = productSection.items?.find(
        (item: any) =>
          item.label?.toLowerCase().includes('product') &&
          !item.label?.toLowerCase().includes('quantity') &&
          !item.label?.toLowerCase().includes('temp') &&
          !item.label?.toLowerCase().includes('heat')
      );
      if (productItem && productItem.value && productItem.value !== 'Product') {
        extractedProductName = productItem.value;
      }
    }
  }

  return {
    calculationType,
    userName: pdfData.userName || 'User',
    projectName: pdfData.projectName || 'Untitled Project',

    // Room details
    roomLength: roomData.length || 0,
    roomWidth: roomData.width || 0,
    roomHeight: roomData.height || 0,
    roomVolume: roomVolume,
    roomTemperature: roomData.roomTemp || roomData.ambientTemp || 0,

    // Product details
    productName: extractedProductName,
    productQuantity:
      productData.massBeforeFreezing ||
      productData.capacityRequired ||
      productData.dailyLoading ||
      0,
    dailyLoading:
      productData.dailyLoading ||
      productData.massBeforeFreezing ||
      productData.capacityRequired ||
      0,

    // Main results
    totalLoad: parseNumber(totalLoadResult?.value),
    totalLoadWithSafety: parseNumber(totalLoadWithSafetyResult?.value),
    totalLoadBTU: (() => {
      const btu = parseNumber(totalLoadBTUResult?.value);
      if (btu > 0) return btu;
      // Fallback: convert from kW if BTU not present or parsed as 0
      const kw =
        parseNumber(totalLoadWithSafetyResult?.value) ||
        parseNumber(totalLoadResult?.value);
      return kw > 0 ? Math.round(kw * 3412.142) : 0;
    })(),

    // Detailed load breakdown
    totalTransmissionLoad,
    totalProductLoad,
    totalMiscellaneousLoad,
  };
};

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
const createTimeoutPromise = (timeoutMs: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Network timeout after ${timeoutMs}ms - check your internet connection`
        )
      );
    }, timeoutMs);
  });
};

/**
 * Save simplified calculation data to Firestore with timeout handling
 * Always updates existing document if same calculation type exists
 */
export const saveCalculationToFirestore = async (
  userId: string,
  calculationType: CalculationType,
  pdfData: any,
  roomData: any,
  productData: any,
  timeoutMs: number = 10000 // Default 10 second timeout
): Promise<{ success: boolean; error?: string; details?: string }> => {
  try {
    console.log(
      `[CalculationStorage] 📡 Starting save for ${calculationType} calculation (timeout: ${timeoutMs}ms)`
    );
    console.log(`[CalculationStorage] User ID: ${userId}`);

    // Create document ID based on user and calculation type (ensures only one per type)
    const documentId = `${userId}_${calculationType}`;

    // Extract simplified data
    const mainResults = extractMainResults(
      calculationType,
      pdfData,
      roomData,
      productData
    );

    // Prepare the data to save
    const calculationData: Omit<StoredCalculationData, 'id'> = {
      userId,
      ...mainResults,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('[CalculationStorage] 📊 Data to save:', {
      calculationType,
      projectName: calculationData.projectName,
      productName: calculationData.productName,
      totalLoad: calculationData.totalLoad,
      totalLoadWithSafety: calculationData.totalLoadWithSafety,
      totalTransmissionLoad: calculationData.totalTransmissionLoad,
      totalProductLoad: calculationData.totalProductLoad,
      totalMiscellaneousLoad: calculationData.totalMiscellaneousLoad,
      roomVolume: calculationData.roomVolume,
      productQuantity: calculationData.productQuantity,
    });

    // Save to Firestore with timeout - race between save and timeout
    const docRef = doc(db, 'user_calculations', documentId);
    const savePromise = setDoc(docRef, calculationData, { merge: true });
    const timeoutPromise = createTimeoutPromise(timeoutMs);

    // Wait for either save to complete or timeout to occur
    await Promise.race([savePromise, timeoutPromise]);

    console.log(
      `[CalculationStorage] ✅ Successfully saved ${calculationType} calculation`
    );
    console.log(`[CalculationStorage] Document ID: ${documentId}`);

    return { success: true };
  } catch (error: any) {
    const errorCode = error?.code || 'unknown';
    const errorMessage = error?.message || 'Unknown error';

    // Provide user-friendly error messages
    let userFriendlyMessage = `Failed to save ${calculationType} calculation: ${errorMessage}`;

    if (errorCode === 'permission-denied') {
      userFriendlyMessage =
        'Permission denied: Please check your internet connection and try again.';
    } else if (errorCode === 'unavailable') {
      userFriendlyMessage =
        'Service temporarily unavailable. Please try again later.';
    } else if (errorCode === 'unauthenticated') {
      userFriendlyMessage = 'Authentication required. Please sign in again.';
    } else if (
      errorMessage.includes('Network timeout') ||
      errorMessage.includes('timeout')
    ) {
      userFriendlyMessage =
        'No internet connection - continuing with PDF generation only.';
    } else if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection')
    ) {
      userFriendlyMessage =
        'Network error - continuing with PDF generation only.';
    }

    const errorDetails = `Error Code: ${errorCode}\nError Message: ${errorMessage}\nStack: ${
      error?.stack || 'No stack trace'
    }`;

    console.error(`[CalculationStorage] ❌ ${userFriendlyMessage}`);
    console.error('[CalculationStorage] Full error details:', errorDetails);

    return {
      success: false,
      error: userFriendlyMessage,
      details: errorDetails,
    };
  }
};

/**
 * Get calculation type from PDF title
 */
export const getCalculationTypeFromTitle = (title: string): CalculationType => {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes('blast')) {
    return 'blast_freezer';
  } else if (lowerTitle.includes('freezer')) {
    return 'freezer_room';
  } else {
    return 'cold_room'; // Default fallback
  }
};
