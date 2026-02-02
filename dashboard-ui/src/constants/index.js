// src/constants/index.js

export const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

export const chartDefinitions = [
    { 
        title: "Power, Speed & Status", 
        tags: [
            'A25_Power', 
            'A25_Speed', 
            'A25_Status',
            'A25_Energy',
            'A25_SoC',
            'A25_Energy_Total'
        ] 
    },
    { 
        title: "Vibration & Temperature", 
        tags: [
            'VT001.Scaled', 
            'VT002.Scaled', 
            'TT001.Scaled', 
            'TT002.Scaled', 
            'TT003.Scaled', 
            'VT001_Healthy',
            'VT002_Healthy',
            'TT001_Healthy'
        ] 
    },
    { 
        title: "Control & Fluid", 
        tags: [
            'EM_SV', 
            'WT001_Scaled', 
            'PT001_Scaled', 
            'PT001_Healthy',
            'WT001_Healthy',
            'A25_CMD_Charge', // Including command tags for monitoring
            'A25_CMD_Discharge'
        ] 
    }
];

export const allPossibleTags = [...new Set(chartDefinitions.flatMap(c => c.tags))];

// The map is created once and exported for global use
export const tagColorMap = Object.fromEntries(
    allPossibleTags.map((tag, index) => [tag, COLORS[index % COLORS.length]])
);