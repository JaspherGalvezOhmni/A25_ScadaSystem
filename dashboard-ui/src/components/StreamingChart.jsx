import { useState, useEffect, useRef, useMemo } from "react";
import { Line } from "react-chartjs-2";
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    Title, 
    Tooltip, 
    Legend, 
    TimeScale,
    Decimation 
} from "chart.js";
import 'chartjs-adapter-date-fns';
import apiClient from '../api';
import { subSeconds } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale, Decimation);

function StreamingChart({ selectedTags, displayRangeSec, tagColorMap }) {
  const rawDataRef = useRef({});
  const [chartData, setChartData] = useState({ datasets: [] });
  const [isLoading, setIsLoading] = useState(true);
  const pollingRef = useRef(null);
  
  const pollInterval = 1000; // 10Hz

  // --- DUAL MODE CONFIGURATION ---
  // "Safe Mode" (<= 5 mins): Standard rendering. Reliable.
  // "Performance Mode" (> 5 mins): Decimation ON, Parsing OFF. Fast.
  const isPerformanceMode = displayRangeSec > 300; 

  const chartOptions = useMemo(() => {
    // BASE OPTIONS
    const opts = {
        responsive: true, 
        maintainAspectRatio: false, 
        animation: false, 
        spanGaps: false,
        plugins: { 
            legend: { display: false },
            decimation: { enabled: false } // Default disabled
        },
        scales: {
            x: {
                type: "time",
                time: { unit: "second", tooltipFormat: "HH:mm:ss.SSS" },
                displayFormats: {
                  second: 'HH:mm:ss',
                  minute: 'HH:mm',
                  hour: 'MMM d, HH"mm',
                },
                ticks: { color: '#a0a0a0', maxRotation: 0, autoSkip: true, maxTicksLimit: 10, source: 'auto' },
                grid: { color: '#333' }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              ticks: { color: '#a0a0a0' },
              grid: { color: '#333' }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              min: 0,
              max: 9000,
              ticks: { color: '#a0a0a0' },
              grid: { drawOnChartArea: false }
            }
        },
        elements: {
            line: { tension: 0, borderWidth: 2 },
            point: { radius: 0, hoverRadius: 5 } // Default hidden
        }
    };

    if (isPerformanceMode) {
        // --- PERFORMANCE MODE (> 5 mins) ---
        opts.parsing = false; // Trust our x: ms data
        opts.normalized = true;
        opts.plugins.decimation = {
            enabled: true,
            algorithm: 'min-max',
            samples: 500, 
        };
    } else {
        // --- SAFE MODE (<= 5 mins) ---
        opts.parsing = true; // Let Chart.js parse the ISO strings/Date objs
        // Show dots only if range is very short (1 min or less)
        if (displayRangeSec <= 120) {
            opts.elements.point.radius = 2;
        }
    }

    return opts;
  }, [isPerformanceMode, displayRangeSec]);

  const mergeAndSetData = (incomingData, endTime, windowSeconds) => {
    const newRawData = { ...rawDataRef.current };

    selectedTags.forEach((tag) => {
      if (!newRawData[tag]) newRawData[tag] = [];
      const existingTimestamps = new Set(newRawData[tag].map((p) => p.ts));
      
      if (incomingData[tag] && Array.isArray(incomingData[tag])) {
          incomingData[tag].forEach((newPoint) => {
            if (existingTimestamps.has(newPoint.ts)) return;
            // Basic validation
            if (newPoint.value === null || newPoint.value === undefined) return;
            const numericValue = parseFloat(newPoint.value);
            if (isNaN(numericValue)) return;

            newRawData[tag].push({ ts: newPoint.ts, value: numericValue });
          });
      }
      
      // Prune old
      const cutoff = subSeconds(endTime, windowSeconds).getTime();
      newRawData[tag] = newRawData[tag].filter(
        (p) => new Date(p.ts).getTime() >= cutoff
      );
      
      newRawData[tag].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    });

    rawDataRef.current = newRawData;

    const datasets = selectedTags.map((tag) => {
        const rawPoints = rawDataRef.current[tag] || [];
        
        // DATA TRANSFORMATION BASED ON MODE
        let dataPoints;
        if (isPerformanceMode) {
            // Performance Mode: Needs {x: Milliseconds, y: Value}
            dataPoints = rawPoints.map(p => ({ x: new Date(p.ts).getTime(), y: p.value }));
        } else {
            // Safe Mode: Needs {x: ISO String, y: Value} (Standard parsing)
            dataPoints = rawPoints.map(p => ({ x: p.ts, y: p.value }));
        }

        return {
            label: tag,
            data: dataPoints,
            borderColor: tagColorMap[tag],
            backgroundColor: tagColorMap[tag] + '80',
            yAxisID: tag === 'A25_Speed' ? 'y1' : 'y',
        };
    });

    setChartData({ datasets });
  };

  useEffect(() => {
    rawDataRef.current = {};
    if (pollingRef.current) clearTimeout(pollingRef.current);
    setIsLoading(true);

    let isMounted = true;

    const runProcess = async () => {
      const now = new Date();
      
      // 1. Initial Backfill
      try {
        const start = subSeconds(now, displayRangeSec);
        const params = new URLSearchParams();
        selectedTags.forEach(tag => params.append('tags', tag));
        params.append('start_time', start.toISOString());
        params.append('end_time', now.toISOString());

        const histResponse = await apiClient.get('/api/historian', { params });
        if (isMounted) {
            mergeAndSetData(histResponse.data, now, displayRangeSec);
            setIsLoading(false); 
        }
      } catch (e) {
        if (isMounted) setIsLoading(false);
      }

      // 2. Polling Loop
      const poll = async () => {
        if (!isMounted) return;
        const loopNow = new Date();
        const loopStart = subSeconds(loopNow, 10); // Fetch last 10 seconds to avoid gaps 

        try {
          const params = new URLSearchParams();
          selectedTags.forEach(tag => params.append('tags', tag));
          params.append('start_time', loopStart.toISOString());
          params.append('end_time', loopNow.toISOString());

          const liveResponse = await apiClient.get('/api/historian', { params });
          if (isMounted) {
            mergeAndSetData(liveResponse.data, loopNow, displayRangeSec);
          }
        } catch (e) { }
        pollingRef.current = setTimeout(poll, pollInterval);
      };

      poll();
    };

    runProcess();

    return () => {
      isMounted = false;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [selectedTags, displayRangeSec]); 

  if (isLoading) {
    return (
        <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: '#a0a0a0', flexDirection: 'column', gap: '10px'
        }}>
            <span>Loading Data...</span>
        </div>
    );
  }

  // Key forces full re-mount when switching between Safe/Performance modes
  return (
    <Line 
        key={isPerformanceMode ? 'perf' : 'safe'} 
        data={chartData} 
        options={chartOptions} 
    />
  );
};

export default StreamingChart;