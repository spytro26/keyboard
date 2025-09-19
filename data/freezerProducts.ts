// Freezer product presets based on Excel data and refrigeration engineering
export interface FreezerProductPreset {
  name: string;
  category: string;         // Product category
  cpAboveFreezing: number;  // kJ/kg·K
  cpBelowFreezing: number;  // kJ/kg·K
  latentHeatOfFusion: number; // kJ/kg
  freezingPoint: number;    // °C
  respirationWatts: number; // W/tonne (usually 0 for frozen products)
}

export const freezerProducts: FreezerProductPreset[] = [
  {
    name: 'Custom',
    category: 'Custom',
    cpAboveFreezing: 3.74,
    cpBelowFreezing: 1.96,
    latentHeatOfFusion: 233,
    freezingPoint: -0.8,
    respirationWatts: 0,
  },
  
  // Chicken - Excel exact values
  {
    name: 'Chicken',
    category: 'Meat & Poultry',
    cpAboveFreezing: 3.74,     // Excel shows 3.74 kJ/kg·K
    cpBelowFreezing: 1.96,     // Excel shows 1.96 kJ/kg·K  
    latentHeatOfFusion: 233,   // Excel shows 233 kJ/kg
    freezingPoint: -0.8,       // Excel shows -0.8°C
    respirationWatts: 0,       // Frozen product - no respiration
  },
  
  // Dairy Products
  {
    name: 'Butter',
    category: 'Dairy Products',
    cpAboveFreezing: 2.4,
    cpBelowFreezing: 1.3,
    latentHeatOfFusion: 120,
    freezingPoint: -3.2,
    respirationWatts: 0,
  },
  {
    name: 'Cheese Fat',
    category: 'Dairy Products',
    cpAboveFreezing: 2.8,
    cpBelowFreezing: 1.5,
    latentHeatOfFusion: 160,
    freezingPoint: -2.8,
    respirationWatts: 0,
  },
  {
    name: 'Cheese Lean',
    category: 'Dairy Products',
    cpAboveFreezing: 3.2,
    cpBelowFreezing: 1.7,
    latentHeatOfFusion: 200,
    freezingPoint: -1.8,
    respirationWatts: 0,
  },
  {
    name: 'Curd',
    category: 'Dairy Products',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 1.9,
    latentHeatOfFusion: 220,
    freezingPoint: -1.5,
    respirationWatts: 0,
  },
  {
    name: 'Margarine',
    category: 'Dairy Products',
    cpAboveFreezing: 2.5,
    cpBelowFreezing: 1.4,
    latentHeatOfFusion: 130,
    freezingPoint: -3.0,
    respirationWatts: 0,
  },
  {
    name: 'Milk',
    category: 'Dairy Products',
    cpAboveFreezing: 3.9,
    cpBelowFreezing: 2.0,
    latentHeatOfFusion: 270,
    freezingPoint: -0.5,
    respirationWatts: 0,
  },
  {
    name: 'Ice Cream',
    category: 'Dairy Products',
    cpAboveFreezing: 3.14,
    cpBelowFreezing: 1.72,
    latentHeatOfFusion: 196,
    freezingPoint: -2.8,
    respirationWatts: 0,
  },

  // Meat & Poultry
  {
    name: 'Meat',
    category: 'Meat & Poultry',
    cpAboveFreezing: 3.74,
    cpBelowFreezing: 1.96,
    latentHeatOfFusion: 233,
    freezingPoint: -0.8,
    respirationWatts: 0,
  },
  {
    name: 'Chicken (Lean)',
    category: 'Meat & Poultry',
    cpAboveFreezing: 3.4,
    cpBelowFreezing: 1.8,
    latentHeatOfFusion: 215,
    freezingPoint: -0.7,
    respirationWatts: 0,
  },
  {
    name: 'Pig Fat',
    category: 'Meat & Poultry',
    cpAboveFreezing: 2.8,
    cpBelowFreezing: 1.5,
    latentHeatOfFusion: 180,
    freezingPoint: -1.2,
    respirationWatts: 0,
  },
  {
    name: 'Pig Lean',
    category: 'Meat & Poultry',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 1.9,
    latentHeatOfFusion: 240,
    freezingPoint: -0.6,
    respirationWatts: 0,
  },

  // Fish & Seafood
  {
    name: 'Fish',
    category: 'Fish & Seafood',
    cpAboveFreezing: 3.68,
    cpBelowFreezing: 1.89,
    latentHeatOfFusion: 245,
    freezingPoint: -1.2,
    respirationWatts: 0,
  },
  {
    name: 'Sea Fish Fat',
    category: 'Fish & Seafood',
    cpAboveFreezing: 3.4,
    cpBelowFreezing: 1.7,
    latentHeatOfFusion: 220,
    freezingPoint: -1.5,
    respirationWatts: 0,
  },
  {
    name: 'Sea Fish Lean',
    category: 'Fish & Seafood',
    cpAboveFreezing: 3.8,
    cpBelowFreezing: 1.9,
    latentHeatOfFusion: 260,
    freezingPoint: -1.0,
    respirationWatts: 0,
  },
  {
    name: 'Sea Fish Smoked',
    category: 'Fish & Seafood',
    cpAboveFreezing: 3.2,
    cpBelowFreezing: 1.6,
    latentHeatOfFusion: 190,
    freezingPoint: -2.0,
    respirationWatts: 0,
  },
  {
    name: 'Shell Fish',
    category: 'Fish & Seafood',
    cpAboveFreezing: 3.9,
    cpBelowFreezing: 2.0,
    latentHeatOfFusion: 280,
    freezingPoint: -0.8,
    respirationWatts: 0,
  },

  // Vegetables (Frozen)
  {
    name: 'Vegetables',
    category: 'Vegetables (Frozen)',
    cpAboveFreezing: 3.89,
    cpBelowFreezing: 2.05,
    latentHeatOfFusion: 280,
    freezingPoint: -0.5,
    respirationWatts: 0,
  },
  {
    name: 'Beans (Frozen)',
    category: 'Vegetables (Frozen)',
    cpAboveFreezing: 3.2,
    cpBelowFreezing: 1.7,
    latentHeatOfFusion: 250,
    freezingPoint: -0.6,
    respirationWatts: 0,
  },
  {
    name: 'Carrots (Frozen)',
    category: 'Vegetables (Frozen)',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 1.9,
    latentHeatOfFusion: 270,
    freezingPoint: -0.5,
    respirationWatts: 0,
  },
  {
    name: 'Peas (Frozen)',
    category: 'Vegetables (Frozen)',
    cpAboveFreezing: 3.4,
    cpBelowFreezing: 1.8,
    latentHeatOfFusion: 260,
    freezingPoint: -0.6,
    respirationWatts: 0,
  },
  {
    name: 'Potato (Frozen)',
    category: 'Vegetables (Frozen)',
    cpAboveFreezing: 3.5,
    cpBelowFreezing: 1.8,
    latentHeatOfFusion: 270,
    freezingPoint: -0.4,
    respirationWatts: 0,
  },

  // Fruits (Frozen)
  {
    name: 'Apple (Frozen)',
    category: 'Fruits (Frozen)',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 1.9,
    latentHeatOfFusion: 275,
    freezingPoint: -0.8,
    respirationWatts: 0,
  },
  {
    name: 'Banana (Frozen)',
    category: 'Fruits (Frozen)',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 1.9,
    latentHeatOfFusion: 270,
    freezingPoint: -0.7,
    respirationWatts: 0,
  },
  {
    name: 'Strawberries (Frozen)',
    category: 'Fruits (Frozen)',
    cpAboveFreezing: 3.8,
    cpBelowFreezing: 2.0,
    latentHeatOfFusion: 285,
    freezingPoint: -0.6,
    respirationWatts: 0,
  },

  // Other Products
  {
    name: 'Bread (Frozen)',
    category: 'Other Products',
    cpAboveFreezing: 2.8,
    cpBelowFreezing: 1.5,
    latentHeatOfFusion: 210,
    freezingPoint: -2.0,
    respirationWatts: 0,
  },
  {
    name: 'Dough (Frozen)',
    category: 'Other Products',
    cpAboveFreezing: 3.2,
    cpBelowFreezing: 1.7,
    latentHeatOfFusion: 240,
    freezingPoint: -1.5,
    respirationWatts: 0,
  },
  {
    name: 'Eggs (Frozen)',
    category: 'Other Products',
    cpAboveFreezing: 3.1,
    cpBelowFreezing: 1.6,
    latentHeatOfFusion: 200,
    freezingPoint: -1.8,
    respirationWatts: 0,
  },
];
