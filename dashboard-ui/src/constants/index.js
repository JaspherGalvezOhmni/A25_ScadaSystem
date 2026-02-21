// src/constants/index.js

export const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

export const STATUS_MAP = {
    1: { text: "Stopped", color: "#7f8c8d" },
    2: { text: "Starting Up", color: "#3498db" },
    3: { text: "Idle", color: "#95a5a6" },
    4: { text: "Charging", color: "#2ecc71" },
    5: { text: "Discharging", color: "#e74c3c" },
    6: { text: "Idle", color: "#95a5a6"},
    7: { text: "Idle", color: "#95a5a6" },
}

export const getSystemStatus = (statusCode) => {
    return STATUS_MAP[statusCode] || { text: "Unknown", color: "#888" };
};

// arrow logic
export const getDirectionConfig = (statusText) => {
    if (statusText === "Charging" || statusText === "Starting Up") {
        return { char: '↓', color: '#2ecc71' };
    }
    if (statusText === "Discharging") {
        return { char: '↑', color: '#e74c3c' };
    }
    if (statusText === "Stopped" || statusText === "Idle") {
        return { char: '-', color: '#888' };
    }
    return { char: '⚠️', color: '#f39c12' };
};

export const chartDefinitions = [
    { 
        title: "Power", // Based on Picture 2 Top
        tags: [
            'A25_Power', 
            'A25_Speed', 
            'A25_Energy', // Mapped to 'Energy' in diagram
        ] 
    },
    { 
        title: "Vibration", // Based on Picture 2 Middle
        tags: [
            'VT001.Scaled', 
            'VT002.Scaled',
            'A25_Speed',
        ] 
    },
    { 
        title: "Temperature", 
        tags: [
            'A25_Speed',
            'TT001.Scaled',
            'TT002.Scaled',
            'TT003.Scaled',
        ] 
    },
    { 
        title: "Electromag", // Based on Picture 3 Top (Simplified)
        tags: [
            'A25_Speed',
            'EM_SV',
            'WT001.Scaled',
        ] 
    },
    { 
        title: "Pressure", // Based on Picture 3 Middle (Simplified)
        tags: [
            'PT001.Scaled'
        ] 
    },
    {
        title: "Custom", // Based on Picture 3 Bottom (Simplified / Custom)
        tags: [
            'A25_SoC',
            'A25_Cycles',
            'A25_RunHours',
        ]
    }
];

// All tags from all definitions
export const allPossibleTags = [...new Set(chartDefinitions.flatMap(c => c.tags))];

// The map is created once and exported for global use
export const tagColorMap = Object.fromEntries(
    allPossibleTags.map((tag, index) => [tag, COLORS[index % COLORS.length]])
);