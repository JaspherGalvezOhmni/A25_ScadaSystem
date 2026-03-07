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

function StreamingChart({ allTags, visibleTags, displayRangeSec, tagColorMap, liveTags, onTogglePen }) {
  const rawDataRef = useRef({});
  const [chartData, setChartData] = useState({ datasets: [] });
  const [isLoading, setIsLoading] = useState(true);

  const isPerformanceMode = displayRangeSec > 300;

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      spanGaps: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: '#a0a0a0',
            boxWidth: 12,
            usePointStyle: 'circle',
            padding: 10,
            font: { size: 11 }
          },
          // FIX: Proper legend click handler for Chart.js 4+
          onClick: (e, legendItem, legend) => {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            const tagName = ci.data.datasets[index].label;

            if (onTogglePen) {
              // This triggers the DB save and state update in OperationalDetailsPage
              onTogglePen(tagName);
            }
          }
        },
        tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
        },
        decimation: { enabled: false }
      },
      scales: {
        x: {
          type: "time",
          time: { unit: "second", tooltipFormat: "HH:mm:ss.SSS" },
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
        point: { radius: 0, hoverRadius: 5 }
      }
    };
  }, [onTogglePen]); // Simplified dependencies to avoid logic loops

  // ... (mergeAndSetData remains the same)
  const mergeAndSetData = (incomingData, endTime, windowSeconds) => {
    const newRawData = { ...rawDataRef.current };
    allTags.forEach((tag) => {
      if (!newRawData[tag]) newRawData[tag] = [];
      const existingTs = new Set(newRawData[tag].map((p) => p.ts));
      if (incomingData[tag] && Array.isArray(incomingData[tag])) {
        incomingData[tag].forEach((newPoint) => {
          if (existingTs.has(newPoint.ts)) return;
          const numVal = parseFloat(newPoint.value);
          if (!isNaN(numVal)) newRawData[tag].push({ ts: newPoint.ts, value: numVal });
        });
      }
      const cutoff = subSeconds(endTime, windowSeconds).getTime();
      newRawData[tag] = newRawData[tag].filter(p => new Date(p.ts).getTime() >= cutoff);
      newRawData[tag].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    });
    rawDataRef.current = newRawData;

    const datasets = allTags.map((tag) => {
      const rawPoints = rawDataRef.current[tag] || [];
      const dataPoints = isPerformanceMode 
        ? rawPoints.map(p => ({ x: new Date(p.ts).getTime(), y: p.value }))
        : rawPoints.map(p => ({ x: p.ts, y: p.value }));

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
    setIsLoading(true);
    let isMounted = true;
    const runProcess = async () => {
      const now = new Date();
      try {
        const start = subSeconds(now, displayRangeSec);
        const params = new URLSearchParams();
        allTags.forEach(tag => params.append('tags', tag));
        params.append('start_time', start.toISOString());
        params.append('end_time', now.toISOString());
        const histResponse = await apiClient.get('/api/historian', { params });
        if (isMounted) {
          mergeAndSetData(histResponse.data, now, displayRangeSec);
          setIsLoading(false);
        }
      } catch (e) { if (isMounted) setIsLoading(false); }
    };
    runProcess();
    return () => { isMounted = false; };
  }, [allTags, displayRangeSec]);

  useEffect(() => {
    if (isLoading || !liveTags || Object.keys(liveTags).length === 0) return;
    const now = new Date();
    const incomingData = {};
    allTags.forEach(tag => {
      if (liveTags[tag] !== undefined) incomingData[tag] = [{ ts: now.toISOString(), value: liveTags[tag] }];
    });
    if (Object.keys(incomingData).length > 0) mergeAndSetData(incomingData, now, displayRangeSec);
  }, [liveTags, isLoading, allTags, displayRangeSec]);

  if (isLoading) return <div className="loading-message">Loading Data...</div>;

  return (
    <Line
      key={isPerformanceMode ? 'perf' : 'safe'}
      data={{
        ...chartData,
        datasets: chartData.datasets.map(ds => ({
          ...ds,
          // CRITICAL: This is what actually hides/shows the line in real-time
          hidden: !visibleTags.includes(ds.label)
        }))
      }}
      options={chartOptions}
    />
  );
}

export default StreamingChart;