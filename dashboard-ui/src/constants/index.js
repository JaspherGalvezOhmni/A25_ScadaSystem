// src/constants/index.js

export const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

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
            'Test_InfiniteCounter' // Moved from Home page
        ]
    }
];

// All tags from all definitions
export const allPossibleTags = [...new Set(chartDefinitions.flatMap(c => c.tags))];

// The map is created once and exported for global use
export const tagColorMap = Object.fromEntries(
    allPossibleTags.map((tag, index) => [tag, COLORS[index % COLORS.length]])
);