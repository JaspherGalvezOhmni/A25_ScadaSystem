import { useState, useEffect } from 'react';
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

import PensSidebar from '../components/PensSidebar';
import StreamingChart from '../components/StreamingChart';
import PopoutWindow from '../components/PopoutWindow'; // <--- NEW IMPORT
import { chartDefinitions, tagColorMap } from '../constants';
import apiClient from '../api'; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

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
            ticks: { color: '#a0a0a0', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }, 
            grid: { color: '#333' } 
        },
        y: { 
            ticks: { color: '#a0a0a0' }, 
            grid: { color: '#333' } 
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
    else if (timeRangeKey === 'All') startTime = new Date(0); 

    return { startTime, endTime: now };
};

// --- UPDATED: LiveSensorTable with Pop-out Logic ---
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

    if (!tags) return <div className="sidebar sensor-sidebar">Loading...</div>;
    const sortedTags = Object.entries(tags).sort((a, b) => a[0].localeCompare(b[0]));

    return (
        <div className="sidebar sensor-sidebar">
            <div className="sidebar-header-row">
                <h2>Live Values</h2>
                <button 
                    className="maximize-btn" 
                    onClick={handlePopout}
                >
                    ❐ Pop Out Wall
                </button>
            </div>
            
            <div className="sensor-list">
                {sortedTags.length === 0 ? (
                    <div style={{padding: '1rem', color: '#666'}}>No active tags found.</div>
                ) : (
                    sortedTags.map(([tagName, value]) => (
                        <div className="sensor-item" key={tagName}>
                            <span className="sensor-label">{tagName}</span>
                            <span className="sensor-value">
                                {typeof value === 'number' ? value.toFixed(2) : String(value)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const IndividualTimeSelector = ({ onSelect }) => {
    const ranges = {
        '1m': '1 Minute (Live)',
        '5m': '5 Minutes (Live)',
        '30m':'30 Minutes (Live)',
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
            <select onChange={(e) => onSelect(e.target.value)} defaultValue="5m">
                {Object.entries(ranges).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                ))}
            </select>
        </div>
    );
};

// --- UPDATED: HistorianChart with Pop-out Logic ---
function HistorianChart({ title, visibleTags }) {
    const [timeRange, setTimeRange] = useState('5m'); 
    const [staticData, setStaticData] = useState({ datasets: [] });
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isPoppedOut, setIsPoppedOut] = useState(false);

    const isStreamingMode = ['1s', '5s', '10s', '30s', '1m', '5m', '15m', '30m'].includes(timeRange);

    useEffect(() => {
        if (isStreamingMode || visibleTags.length === 0) return;

        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            try {
                const { startTime, endTime } = getStartEndTime(timeRange);
                const params = new URLSearchParams();
                visibleTags.forEach(tag => params.append('tags', tag));
                if (startTime) params.append('start_time', startTime.toISOString());
                params.append('end_time', endTime.toISOString());

                const response = await apiClient.get('/api/historian', { params });
                const data = response.data;

                const newDatasets = visibleTags.map(tagName => ({
                    label: tagName,
                    data: data[tagName]?.map(p => ({ x: new Date(p.ts).getTime(), y: p.value })) || [],
                    borderColor: tagColorMap[tagName] || '#888',
                    backgroundColor: (tagColorMap[tagName] || '#888') + '80',
                    tension: 0.2, 
                    pointRadius: 0, 
                    borderWidth: 2,
                }));

                setStaticData({ datasets: newDatasets });
            } catch (error) {
                console.error(`History fetch failed for ${title}:`, error);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [timeRange, visibleTags, isStreamingMode, title]);

    // The Inner Content
    const chartContent = (
        <div className="chart-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="chart-header">
                <h3>
                    {title} 
                    {isStreamingMode ? 
                        <span className="live-badge" style={{marginLeft:'10px'}}>LIVE</span> : 
                        <span style={{marginLeft:'10px', fontSize:'0.7em', color:'#a0a0a0'}}>HISTORICAL</span>
                    }
                </h3>
                <div style={{display:'flex', gap:'10px'}}>
                    <IndividualTimeSelector onSelect={setTimeRange} />
                    <button className="maximize-btn" onClick={() => setIsPoppedOut(!isPoppedOut)}>
                        {isPoppedOut ? 'Dock' : '❐ Pop'}
                    </button>
                </div>
            </div>

            <div className="chart-wrapper" style={{flexGrow: 1, minHeight: 0}}>
                {visibleTags.length === 0 ? (
                    <div className="no-data-message">No Pens Selected</div>
                ) : isStreamingMode ? (
                    <StreamingChart 
                        selectedTags={visibleTags}
                        displayRangeSec={getDurationInSeconds(timeRange)}
                        tagColorMap={tagColorMap}
                    />
                ) : (
                    isLoadingHistory ? (
                        <div className="loading-message">Loading History...</div>
                    ) : (
                        <Line options={staticChartOptions} data={staticData} />
                    )
                )}
            </div>
        </div>
    );

    if (isPoppedOut) {
        return (
            <>
                <div className="chart-card-container placeholder" style={{height: '100px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <span style={{color: '#666', fontStyle: 'italic'}}>{title} is open in another window.</span>
                    <button className="maximize-btn" style={{marginLeft: '10px'}} onClick={() => setIsPoppedOut(false)}>Bring Back</button>
                </div>
                <PopoutWindow title={title} onClose={() => setIsPoppedOut(false)}>
                    <div style={{height: '100vh', padding: '1rem', boxSizing: 'border-box', backgroundColor: '#2d2d2d'}}>
                        {chartContent}
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
    const [liveTags, setLiveTags] = useState({});
    const [visiblePens, setVisiblePens] = useState(() => {
        const initial = {};
        chartDefinitions.forEach(def => {
            initial[def.title] = def.tags; 
        });
        return initial;
    });

    useEffect(() => {
        const fetchLive = async () => {
            try {
                const resp = await apiClient.get('/api/live-data');
                setLiveTags(resp.data.tags || {});
            } catch (err) { 
                console.error("Live data error:", err); 
            }
        };
        fetchLive(); 
        const intervalId = setInterval(fetchLive, 1000); 
        return () => clearInterval(intervalId);
    }, []);

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
        <div className="details-layout-final">
            <PensSidebar 
                chartDefinitions={chartDefinitions} 
                visiblePens={visiblePens} 
                onTogglePen={handleTogglePen} 
            />
            <div className="charts-container-final">
                {chartDefinitions.map(chart => (
                    <HistorianChart 
                        key={chart.title}
                        title={chart.title} 
                        visibleTags={visiblePens[chart.title] || []}
                    />
                ))}
            </div>
            <LiveSensorTable tags={liveTags} />
        </div>
    );
}

export default OperationalDetailsPage;