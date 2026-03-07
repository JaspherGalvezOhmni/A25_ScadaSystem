import { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { subSeconds, subHours, subDays, subMonths, startOfYear } from 'date-fns';
import { getSystemStatus } from '../constants';

// import PensSidebar from '../components/PensSidebar';    -- Staging the removal of penssidebar
import StreamingChart from '../components/StreamingChart';
import PopoutWindow from '../components/PopoutWindow';
import { chartDefinitions, tagColorMap } from '../constants';
import apiClient from '../api';
import { useSystemStatus } from '../context/SystemStatusContext';
import { useAuth } from '../context/AuthContext'; // <--- Added this line

const staticChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    parsing: false,
    normalized: true,
    plugins: {
        legend: { display: true, position: 'top', labels: { color: '#a0a0a0' } }
    },
    scales: {
        x: {
            type: 'time',
            time: { tooltipFormat: 'PP pp' },
            displayFormats: {
                hour: 'MMM d, h a',
                day: 'MMM d',
                week: 'MMM d',
                month: 'MMM yyyy'
            },
            ticks: { color: '#a0a0a0', maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            grid: { color: '#333' }
        },
        y: {
            type: 'linear',
            display: true,
            position: 'left', // Main axis for Temp, Vibration, Power, etc.
            ticks: { color: '#a0a0a0' },
            grid: { color: '#333' }
        },
        y1: {
            type: 'linear',
            display: true,
            position: 'right',
            min: 0,
            max: 9000,
            title: {
                display: true,
                text: 'Speed (RPM)',
                color: '#a0a0a0'
            },
            ticks: { color: '#a0a0a0' },
            grid: { drawOnChartArea: false }
        }
    },
    animation: { duration: 0 }
};

const getDurationInSeconds = (timeRangeKey) => {
    const value = parseInt(timeRangeKey.slice(0, -1));
    const unit = timeRangeKey.slice(-1);
    if (unit === 's') return value;
    if (unit === 'm') return value * 60;
    return 0;
};

const getStartEndTime = (timeRangeKey) => {
    const now = new Date();
    let startTime = null;

    if (timeRangeKey === '1h') startTime = subHours(now, 1);
    else if (timeRangeKey === '24h') startTime = subHours(now, 24);
    else if (timeRangeKey === '7d') startTime = subDays(now, 7);
    else if (timeRangeKey === '1mo') startTime = subMonths(now, 1);
    else if (timeRangeKey === 'YTD') startTime = startOfYear(now);
    // CHANGE: Reduce All Time to 1 year or 90 days depending on your needs.
    // If you look back 5 years but only have 1 month of data, the line looks like a tiny dot.
    else if (timeRangeKey === 'All') startTime = subDays(now, 365);

    return { startTime, endTime: now };
};

// --- UPDATED: LiveSensorTable with Pop-out Logic ---
const TELEMETRY_TAGS_TO_DISPLAY = [
    { label: "Power", tag: "A25_Power", unit: "kW" },
    { label: "Speed", tag: "A25_Speed", unit: "RPM" },
    { label: "Flywheel Status", tag: "A25_Status", unit: "Status" }, // Handled specially
    { label: "Upper Bearing Temp.", tag: "TT001.Scaled", unit: "°C" },
    { label: "Lower Bearing Temp.", tag: "TT002.Scaled", unit: "°C" },
    { label: "Motor Temp.", tag: "TT003.Scaled", unit: "°C" },
    { label: "Upper Vibration", tag: "VT001.Scaled", unit: "" },
    { label: "Lower Vibration", tag: "VT002.Scaled", unit: "" },
    { label: "Load Cell", tag: "WT001.Scaled", unit: "kg" },
    { label: "Pressure", tag: "PT001.Scaled", unit: "" },
    { label: "Load Cell Target", tag: "EM_SV", unit: "kg" },
];

function LiveSensorTable({ tags }) {

    const handlePopout = () => {
        // Calculate center of screen
        const width = 1000;
        const height = 800;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);

        // Open the dedicated route in a new window
        window.open(
            '/sensor-wall',
            'SensorWallWindow',
            `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars`
        );
    };

    if (!tags || Object.keys(tags).length === 0) return <div className="sidebar sensor-sidebar">Loading Telemetry...</div>;

    const statusCode = tags['A25_Status'] ?? 0;
    const derivedFlywheelStatus = getSystemStatus(statusCode).text;

    return (
        <div className="sidebar sensor-sidebar">
            <div className="sidebar-header-row">
                <h2>Telemetry</h2> {/* <--- Updated Title */}
                <button
                    className="maximize-btn"
                    onClick={handlePopout}
                >
                    ❐ View All Tags
                </button>
            </div>

            <div className="sensor-list">
                {TELEMETRY_TAGS_TO_DISPLAY.map(({ label, tag, unit }) => {
                    const value = tags[tag];
                    let displayValue;

                    if (tag === "A25_Status") {
                        displayValue = derivedFlywheelStatus;
                    } else if (typeof value === 'number') {
                        // All numeric values display to 2 decimal places (or just the number)
                        displayValue = `${value.toFixed(value % 1 !== 0 ? 2 : 0)} ${unit}`;
                    } else if (typeof value === 'boolean' || unit === 'Bool') {
                        displayValue = value ? 'TRUE' : 'FALSE';
                    } else {
                        displayValue = String(value);
                    }

                    return (
                        <div className="sensor-item" key={tag}>
                            <span className="sensor-label">{label}</span>
                            <span className="sensor-value">
                                {displayValue}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const IndividualTimeSelector = ({ onSelect, rangeValue }) => {
    const ranges = {
        '1m': '1 Minute (Live)',
        '5m': '5 Minutes (Live)',
        '30m': '30 Minutes (Live)',
        '1h': '1 Hour (History)',
        '24h': '24 Hours (History)',
        '7d': '7 Days (History)',
        '1mo': '1 Month (History)',
        'YTD': 'Year to Date',
        'All': 'All Time'
    };

    return (
        <div className="individual-time-selector">
            <span>Range:</span>
            <select onChange={(e) => onSelect(e.target.value)} value={rangeValue || '5m'}>
                {Object.entries(ranges).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                ))}
            </select>
        </div>
    );
};

// --- UPDATED: HistorianChart with Pop-out Logic ---
function HistorianChart({ title, allTags, visibleTags, fetchHistoricalData, liveTags, timeRange = '5m', onTimeRangeChange, onTogglePen }) {
    const [staticData, setStaticData] = useState({ datasets: [] });
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isPoppedOut, setIsPoppedOut] = useState(false);

    const isStreamingMode = ['1m', '5m', '30m'].includes(timeRange);

    useEffect(() => {
        if (isStreamingMode || allTags.length === 0) return;

        const loadHistory = async () => {
            setIsLoadingHistory(true);
            const data = await fetchHistoricalData(title, allTags, timeRange);
            setStaticData(data);
            setIsLoadingHistory(false);
        };

        loadHistory();
    }, [timeRange, allTags, isStreamingMode, title, fetchHistoricalData]);

    // The Inner Content
    const chartContent = (
        <div className="chart-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="chart-header">
                <h3>
                    {title}
                    {isStreamingMode ?
                        <span className="live-badge" style={{ marginLeft: '10px' }}>LIVE</span> :
                        <span style={{ marginLeft: '10px', fontSize: '0.7em', color: '#a0a0a0' }}>HISTORICAL</span>
                    }
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <IndividualTimeSelector onSelect={onTimeRangeChange} rangeValue={timeRange} />
                    <button className="maximize-btn" onClick={() => setIsPoppedOut(!isPoppedOut)}>
                        {isPoppedOut ? 'Dock' : '❐ Maximise Chart'}
                    </button>
                </div>
            </div>

            <div className="chart-wrapper" style={{ flexGrow: 1, minHeight: 0 }}>
                {allTags.length === 0 ? (
                    <div className="no-data-message">No Pens Available</div>
                ) : isStreamingMode ? (
                    <StreamingChart
                        allTags={allTags}
                        visibleTags={visibleTags}
                        displayRangeSec={getDurationInSeconds(timeRange)}
                        tagColorMap={tagColorMap}
                        liveTags={liveTags}
                        onTogglePen={onTogglePen}
                    />
                ) : (
                    isLoadingHistory ? (
                        <div className="loading-message">Loading History...</div>
                    ) : (
                        <Line
                            key={allTags.join('-')}
                            options={{
                                ...staticChartOptions,
                                plugins: {
                                    ...staticChartOptions.plugins,
                                    legend: {
                                        ...staticChartOptions.plugins.legend,
                                        onClick: (e, legendItem, legend) => {
                                            if (onTogglePen) onTogglePen(legendItem.text);
                                        }
                                    }
                                }
                            }}
                            data={{
                                ...staticData,
                                datasets: staticData.datasets.map(ds => ({
                                    ...ds,
                                    hidden: !visibleTags.includes(ds.label)
                                }))
                            }}></Line>
                    )
                )}
            </div>
        </div>
    );

    if (isPoppedOut) {
        return (
            <>
                {/* Placeholder in main window remains the same */}
                <PopoutWindow title={title} onClose={() => setIsPoppedOut(false)}>
                    {/* --- FIX CONTAINER HERE --- */}
                    <div style={{
                        height: '100vh',
                        width: '100vw',
                        padding: '2rem',
                        boxSizing: 'border-box',
                        backgroundColor: '#1e1e1e',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ flexGrow: 1, position: 'relative' }}>
                            {chartContent}
                        </div>
                    </div>
                </PopoutWindow>
            </>
        );
    }

    return (
        <div className="chart-card-container">
            {chartContent}
        </div>
    );
}

function OperationalDetailsPage() {
    const { liveData } = useSystemStatus();
    const { user, token } = useAuth(); // <--- Identify User
    const liveTags = liveData?.tags || {};

    const [visiblePens, setVisiblePens] = useState(() => {
        const initial = {};
        chartDefinitions.forEach(def => {
            initial[def.title] = def.tags;
        });
        return initial;
    });

    const [timeRanges, setTimeRanges] = useState(() => {
        const initial = {};
        chartDefinitions.forEach(def => {
            initial[def.title] = '5m';
        });
        return initial;
    });

    const [hasLoadedPrefs, setHasLoadedPrefs] = useState(false);

    // Initial Load of Preferences
    useEffect(() => {
        if (!user || !token) {
            setHasLoadedPrefs(true);
            return;
        }

        const fetchPrefs = async () => {
            try {
                const response = await apiClient.get('/api/user/prefs');
                const prefs = response.data?.prefs || {};

                if (prefs.visiblePens) setVisiblePens(prefs.visiblePens);
                if (prefs.timeRanges) setTimeRanges(prefs.timeRanges);
            } catch (error) {
                console.error("Failed to fetch user prefs:", error);
            } finally {
                setHasLoadedPrefs(true);
            }
        };

        fetchPrefs();
    }, [user, token]);

    // Save Preferences on Change
    useEffect(() => {
        if (!user || !token || !hasLoadedPrefs) return;

        const savePrefs = async () => {
            try {
                await apiClient.put('/api/user/prefs', {
                    prefs: { visiblePens, timeRanges }
                });
            } catch (error) {
                console.error("Failed to save user prefs:", error);
            }
        };
        savePrefs();
    }, [visiblePens, timeRanges, user, token, hasLoadedPrefs]);

    const [historicalCache, setHistoricalCache] = useState({});
    const fetchHistoricalData = useCallback(async (chartTitle, visibleTags, timeRange) => {
        // Create unique key for the cache entry
        const cacheKey = `${chartTitle}-${timeRange}-${visibleTags.join(',')}`;

        // 1. Check Cache
        if (historicalCache[cacheKey]) {
            return historicalCache[cacheKey];
        }

        // 2. Fetch from API
        try {
            const { startTime, endTime } = getStartEndTime(timeRange);
            const params = new URLSearchParams();
            visibleTags.forEach(tag => params.append('tags', tag));
            if (startTime) params.append('start_time', startTime.toISOString());
            params.append('end_time', endTime.toISOString());

            const response = await apiClient.get('/api/historian', { params });
            const data = response.data;

            // Convert data into chart datasets (same logic as before)
            const newDatasets = visibleTags.map(tagName => ({
                label: tagName,
                data: data[tagName]?.map(p => ({ x: new Date(p.ts).getTime(), y: p.value })) || [],
                borderColor: tagColorMap[tagName] || '#888',
                backgroundColor: (tagColorMap[tagName] || '#888') + '80',
                yAxisID: tagName === 'A25_Speed' ? 'y1' : 'y',
                tension: 0.2,
                pointRadius: 0,
                borderWidth: 2,
            }));
            const chartData = { datasets: newDatasets };

            // 3. Update Cache
            setHistoricalCache(prev => ({ ...prev, [cacheKey]: chartData }));
            return chartData;

        } catch (error) {
            console.error(`History fetch failed for ${chartTitle}:`, error);
            return { datasets: [] };
        }
    }, [historicalCache, setHistoricalCache]);

    const handleTogglePen = (chartTitle, penName) => {
        setVisiblePens(prev => {
            const currentList = prev[chartTitle] || [];
            if (currentList.includes(penName)) {
                return { ...prev, [chartTitle]: currentList.filter(p => p !== penName) };
            } else {
                return { ...prev, [chartTitle]: [...currentList, penName] };
            }
        });
    };

    return (
        <div className="details-layout-final" style={{
            gridTemplateColumns: '1fr 300px',
            gap: '1.5rem'
        }}>
            {/* Commented Penssidebar to reduce clutter. */}
            {/* <PensSidebar 
                chartDefinitions={chartDefinitions} 
                visiblePens={visiblePens} 
                onTogglePen={handleTogglePen} 
            /> */}
            <div className="charts-container-final">
                {chartDefinitions.map(chart => (
                    <HistorianChart
                        key={chart.title}
                        title={chart.title}
                        allTags={chart.tags}
                        visibleTags={visiblePens[chart.title] || []}
                        fetchHistoricalData={fetchHistoricalData}
                        liveTags={liveTags}
                        timeRange={timeRanges[chart.title] || '5m'}
                        onTimeRangeChange={(newRange) => {
                            setTimeRanges(prev => ({ ...prev, [chart.title]: newRange }));
                        }}
                        onTogglePen={(penName) => handleTogglePen(chart.title, penName)}
                    />
                ))}
            </div>
            <LiveSensorTable tags={liveTags} />
        </div>
    );
}

export default OperationalDetailsPage;