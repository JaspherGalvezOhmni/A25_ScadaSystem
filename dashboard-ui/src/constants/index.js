// src/constants/index.js

export const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

export const chartDefinitions = [
    { title: "Power Output & Speed", tags: ['VFD_Sts_OutPowerScaled', 'VFD_Sts_MtrSpeedScaled'] },
    { title: "System Vibration & Temperature", tags: ['VT001.Scaled', 'VT002.Scaled', 'TT001.Scaled', 'TT002.Scaled', 'TT003.Scaled'] },
    { title: "Electromagnet & Load Cell", tags: ['EM001_Rescaled', 'WT001.Scaled', 'EM_SV'] }
];

export const allPossibleTags = [...new Set(chartDefinitions.flatMap(c => c.tags))];

// The map is created once and exported for global use
export const tagColorMap = Object.fromEntries(
    allPossibleTags.map((tag, index) => [tag, COLORS[index % COLORS.length]])
);