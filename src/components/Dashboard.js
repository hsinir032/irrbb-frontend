import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { fetchEveDrivers, fetchNiiDrivers, fetchYieldCurves } from './services';
// Remove react-select import
// import Select from 'react-select';

// Helper function to determine text color based on sensitivity
const getSensitivityColor = (value) => {
  if (value > 0.5) return 'text-red-400';
  if (value < -0.5) return 'text-green-400';
  return 'text-yellow-400';
};

// Helper function to format currency in millions
const formatCurrency = (value) => {
  const valueInMillions = value / 1000000;
  return `$${valueInMillions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
};

// Helper function to determine gap color
const getGapColor = (value) => {
  if (value > 0) return 'text-green-400'; // Asset sensitive (positive gap)
  if (value < 0) return 'text-red-400';   // Liability sensitive (negative gap)
  return 'text-gray-400';
};

// Helper for Pie Chart Colors
const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00c49f', '#ffbb28'];

const BACKEND_URL = 'https://irrbbb-backend.onrender.com'; // Hardcoded backend URL

function getQuarter(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  return `${year} Q${quarter}`;
}

function getYearMonth(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

function getYear(dateStr) {
  return new Date(dateStr).getFullYear().toString();
}

function groupCashflows(data, groupBy) {
  if (!Array.isArray(data)) return [];
  const groups = {};
  data.forEach(item => {
    let groupKey;
    if (groupBy === 'Year') {
      groupKey = getYear(item.time_label || item.cashflow_date);
    } else if (groupBy === 'Quarter') {
      groupKey = getQuarter(item.time_label || item.cashflow_date);
    } else {
      groupKey = getYearMonth(item.time_label || item.cashflow_date);
    }
    if (!groups[groupKey]) {
      groups[groupKey] = { fixed: 0, floating: 0, groupKey };
    }
    groups[groupKey].fixed += item.fixed || 0;
    groups[groupKey].floating += item.floating || 0;
  });
  // Convert to array and sort by groupKey
  return Object.values(groups).sort((a, b) => a.groupKey.localeCompare(b.groupKey));
}

function CashflowLadderChart({
  data,
  scenario,
  setScenario,
  instrumentType,
  setInstrumentType,
  instrumentOptions,
  aggregation,
  setAggregation,
  cashflowType,
  setCashflowType,
  groupBy,
  setGroupBy,
  yAxisMax,
  setYAxisMax
}) {
  // Debug: log the data received
  console.log('CashflowLadderChart data:', data);
  const safeData = Array.isArray(data) ? data : [];
  const groupByOptions = [
    { label: 'Month', value: 'Month' },
    { label: 'Quarter', value: 'Quarter' },
    { label: 'Year', value: 'Year' },
  ];
  const yAxisOptions = [
    { label: 'Auto', value: 'auto' },
    { label: '$10M', value: 10_000_000 },
    { label: '$50M', value: 50_000_000 },
    { label: '$100M', value: 100_000_000 },
    { label: '$500M', value: 500_000_000 },
  ];
  const scenarioOptions = [
    'Base Case',
    'Parallel Up +200bps',
    'Parallel Down -200bps',
    'Short Rates Up +100bps',
    'Short Rates Down -100bps',
    'Long Rates Up +100bps',
  ];
  const aggregationOptions = [
    { label: 'Total Assets', value: 'assets' },
    { label: 'Total Liabilities', value: 'liabilities' },
    { label: 'Net Total', value: 'net' },
  ];
  const cashflowTypeOptions = [
    { label: 'Total Cashflows', value: 'total' },
    { label: 'PV of Cashflows', value: 'pv' },
  ];

  const groupedData = groupCashflows(safeData, groupBy);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <label className="text-gray-300 mr-2">Scenario:</label>
        <select value={scenario} onChange={e => setScenario(e.target.value)} className="bg-gray-800 text-gray-200 rounded px-2 py-1">
          {scenarioOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <label className="text-gray-300 mr-2">Instrument Type:</label>
        <select value={instrumentType} onChange={e => setInstrumentType(e.target.value)} className="bg-gray-800 text-gray-200 rounded px-2 py-1">
          <option value="all">All</option>
          {instrumentOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <label className="text-gray-300 mr-2">Aggregation:</label>
        <select value={aggregation} onChange={e => setAggregation(e.target.value)} className="bg-gray-800 text-gray-200 rounded px-2 py-1">
          {aggregationOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label className="text-gray-300 mr-2">Cashflow Type:</label>
        <select value={cashflowType} onChange={e => setCashflowType(e.target.value)} className="bg-gray-800 text-gray-200 rounded px-2 py-1">
          {cashflowTypeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label className="text-gray-300 mr-2">Group By:</label>
        <select
          id="groupBy"
          value={groupBy}
          onChange={e => setGroupBy(e.target.value)}
          className="bg-gray-800 text-gray-200 rounded px-2 py-1"
        >
          {groupByOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label className="text-gray-300 mr-2">Y-Axis Max:</label>
        <select
          id="yAxisMax"
          value={yAxisMax}
          onChange={e => setYAxisMax(e.target.value === 'auto' ? 'auto' : Number(e.target.value))}
          className="bg-gray-800 text-gray-200 rounded px-2 py-1"
        >
          {yAxisOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={groupedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="groupKey" tick={{ fill: '#ccc' }} />
          <YAxis
            tickFormatter={value => `$${(value / 1_000_000).toFixed(0)}M`}
            domain={yAxisMax === 'auto' ? undefined : [0, yAxisMax]}
          />
          <Tooltip formatter={value => `$${(value / 1_000_000).toFixed(2)}M`} contentStyle={{ background: '#222', border: '1px solid #444', color: '#fff' }} />
          <Legend />
          <Bar dataKey="fixed" stackId="a" fill="#4F8A8B" name="Fixed Component" />
          <Bar dataKey="floating" stackId="a" fill="#FFD166" name="Floating Component" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const RepricingGapChart = () => {
  const [data, setData] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [drillDownData, setDrillDownData] = useState(null);
  const [showNetOnly, setShowNetOnly] = useState(false);
  const BACKEND_URL = 'https://irrbbb-backend.onrender.com';

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/v1/repricing-gap`)
      .then(response => response.json())
      .then(apiData => {
        // Process data to show liabilities as negative bars and ensure net is properly signed
        const processedData = apiData.map(item => ({
          ...item,
          liabilities_negative: -Math.abs(item.liabilities), // liabilities as negative
          net: item.assets + (-Math.abs(item.liabilities)), // net as sum
        }));
        setData(processedData);
      })
      .catch(error => console.error('Error fetching repricing gap data:', error));
  }, []);

  const handleBarClick = (data) => {
    console.log('Bar clicked:', data);
    if (data && data.bucket) {
      console.log('Fetching drill-down for bucket:', data.bucket);
      setSelectedBucket(data.bucket);
      // Fetch drill-down data
      fetch(`${BACKEND_URL}/api/v1/repricing-gap/drill-down/${encodeURIComponent(data.bucket)}`)
        .then(response => {
          console.log('Drill-down response status:', response.status);
          return response.json();
        })
        .then(data => {
          console.log('Drill-down data received:', data);
          setDrillDownData(data);
        })
        .catch(error => console.error('Error fetching drill-down data:', error));
    }
  };

  const handleBackClick = () => {
    setSelectedBucket(null);
    setDrillDownData(null);
  };

  const formatAmount = (amount) => {
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  if (selectedBucket && drillDownData) {
    // Drill-down view
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 mb-8">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">Repricing Gap - {selectedBucket}</h2>
        <div className="flex justify-end mb-4">
          <button onClick={handleBackClick} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
            ← Back to Overview
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Assets</h3>
            <div className="list-group">
              {drillDownData.assets.map((instrument, index) => (
                <div key={index} className="list-group-item d-flex justify-content-between">
                  <span>{instrument.instrument_type} ({instrument.instrument_id})</span>
                  <span className={instrument.amount < 0 ? 'text-red-400' : 'text-green-400'}>
                    {formatAmount(instrument.amount)}
                  </span>
                </div>
              ))}
              {drillDownData.assets.length === 0 && (
                <div className="list-group-item text-gray-400 text-sm">No assets in this bucket</div>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Liabilities</h3>
            <div className="list-group">
              {drillDownData.liabilities.map((instrument, index) => (
                <div key={index} className="list-group-item d-flex justify-content-between">
                  <span>{instrument.instrument_type} ({instrument.instrument_id})</span>
                  <span className={instrument.amount < 0 ? 'text-red-400' : 'text-green-400'}>
                    {formatAmount(instrument.amount)}
                  </span>
                </div>
              ))}
              {drillDownData.liabilities.length === 0 && (
                <div className="list-group-item text-gray-400 text-sm">No liabilities in this bucket</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main chart view
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 mb-8">
      <h2 className="text-xl font-semibold text-gray-300 mb-4">Repricing Gap Analysis</h2>
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="showNetOnly"
            checked={showNetOnly}
            onChange={(e) => setShowNetOnly(e.target.checked)}
          />
          <label className="form-check-label text-gray-300" htmlFor="showNetOnly">
            Show Net Only
          </label>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bucket" />
          <YAxis tickFormatter={(value) => `$${(Math.abs(value) / 1000000).toFixed(0)}M`} />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'Liabilities') {
                return `$${(Math.abs(value) / 1000000).toFixed(1)}M`;
              }
              return `$${(value / 1000000).toFixed(1)}M`;
            }}
            labelFormatter={(label) => `Bucket: ${label}`}
          />
          <Legend />
          {!showNetOnly && (
            <>
              <Bar dataKey="assets" fill="#4f46e5" radius={[8, 8, 0, 0]} onClick={handleBarClick} name="Assets" />
              <Bar dataKey="liabilities_negative" fill="#f87171" radius={[8, 8, 0, 0]} onClick={handleBarClick} name="Liabilities" />
            </>
          )}
          <Bar dataKey="net" fill="#22d3ee" radius={[8, 8, 0, 0]} onClick={handleBarClick} name="Net" />
        </BarChart>
        <div className="text-center mt-2">
          <small className="text-gray-400 text-sm">Click on any bar to see instrument details</small>
        </div>
      </ResponsiveContainer>
    </div>
  );
};

const Dashboard = ({ dashboardData, isLoading, error, fetchLiveIRRBBData }) => {
  // Local state for NMD and Prepayment assumptions
  const [nmdEffectiveMaturity, setNmdEffectiveMaturity] = useState(dashboardData.current_assumptions.nmd_effective_maturity_years);
  const [nmdDepositBeta, setNmdDepositBeta] = useState(dashboardData.current_assumptions.nmd_deposit_beta);
  const [prepaymentRate, setPrepaymentRate] = useState(dashboardData.current_assumptions.prepayment_rate);
  const [nmdEffectiveMaturityYears, setNmdEffectiveMaturityYears] = useState(5);

  // Update local state when dashboardData.current_assumptions changes (e.g., on initial load or refresh)
  useEffect(() => {
    setNmdEffectiveMaturity(dashboardData.current_assumptions.nmd_effective_maturity_years);
    setNmdDepositBeta(dashboardData.current_assumptions.nmd_deposit_beta);
    setPrepaymentRate(dashboardData.current_assumptions.prepayment_rate);
  }, [dashboardData.current_assumptions]);


  // Function to apply new assumptions and refetch data
  const applyAssumptions = () => {
    fetchLiveIRRBBData(nmdEffectiveMaturity, nmdDepositBeta, prepaymentRate);
  };

  // EVE Drivers state
  const [eveDrivers, setEveDrivers] = useState([]);
  const [eveDriversLoading, setEveDriversLoading] = useState(false);
  const [eveDriversError, setEveDriversError] = useState(null);
  const [eveScenario, setEveScenario] = useState('Base Case');

  // NII Drivers state
  const [niiDrivers, setNiiDrivers] = useState([]);
  const [niiDriversLoading, setNiiDriversLoading] = useState(false);
  const [niiDriversError, setNiiDriversError] = useState(null);
  const [niiBreakdown, setNiiBreakdown] = useState('instrument');

  const EVE_SCENARIOS = [
    'Base Case',
    'Parallel Up +200bps',
    'Parallel Down -200bps',
    'Short Rates Up +100bps',
    'Short Rates Down -100bps',
    'Long Rates Up +100bps',
  ];

  // Handler to fetch EVE drivers
  const handleEveScenarioChange = async (e) => {
    const scenario = e.target.value;
    setEveScenario(scenario);
    setEveDriversLoading(true);
    setEveDriversError(null);
    try {
      const data = await fetchEveDrivers(scenario, nmdEffectiveMaturityYears);
      setEveDrivers(data);
    } catch (err) {
      setEveDriversError('Failed to load EVE drivers');
    } finally {
      setEveDriversLoading(false);
    }
  };

  // Add state for NII scenario
  const [niiScenario, setNiiScenario] = useState('Base Case');
  const NII_SCENARIOS = [
    'Base Case',
    'Parallel Up +200bps',
    'Parallel Down -200bps',
    'Short Rates Up +100bps',
    'Short Rates Down -100bps',
    'Long Rates Up +100bps',
  ];

  // Update NII drivers fetch logic to use scenario and breakdown
  const handleNiiScenarioChange = async (e) => {
    const scenario = e.target.value;
    setNiiScenario(scenario);
    setNiiDriversLoading(true);
    setNiiDriversError(null);
    try {
      const data = await fetchNiiDrivers(scenario, niiBreakdown);
      setNiiDrivers(data);
    } catch (err) {
      setNiiDriversError('Failed to load NII drivers');
    } finally {
      setNiiDriversLoading(false);
    }
  };

  const handleNiiBreakdownChange = async (e) => {
    const breakdown = e.target.value;
    setNiiBreakdown(breakdown);
    setNiiDriversLoading(true);
    setNiiDriversError(null);
    try {
      const data = await fetchNiiDrivers(niiScenario, breakdown);
      setNiiDrivers(data);
    } catch (err) {
      setNiiDriversError('Failed to load NII drivers');
    } finally {
      setNiiDriversLoading(false);
    }
  };

  const [yieldCurves, setYieldCurves] = useState([]);
  const [selectedScenarios, setSelectedScenarios] = useState(['Base Case', 'Parallel Up +200bps', 'Parallel Down -200bps']);

  useEffect(() => {
    const loadYieldCurves = async () => {
      try {
        const curves = await fetchYieldCurves();
        setYieldCurves(curves);
      } catch (error) {
        console.error('Error loading yield curves:', error);
      }
    };
    loadYieldCurves();
  }, []);

  // Load initial EVE and NII drivers data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const eveData = await fetchEveDrivers('Base Case', nmdEffectiveMaturityYears);
        setEveDrivers(eveData);
        console.log('EVE Drivers loaded:', eveData.length, 'records');
        
        const niiData = await fetchNiiDrivers(niiScenario, niiBreakdown);
        setNiiDrivers(niiData);
        console.log('NII Drivers loaded:', niiData.length, 'records');
      } catch (error) {
        console.error('Error loading initial drivers data:', error);
      }
    };
    loadInitialData();
  }, [nmdEffectiveMaturityYears]);

  // Add state for multi-scenario selection
  const [eveSelectedScenarios, setEveSelectedScenarios] = useState(["Base Case"]);
  const [niiSelectedScenarios, setNiiSelectedScenarios] = useState(["Base Case"]);

  // Fetch EVE drivers for all selected scenarios
  useEffect(() => {
    const fetchDrivers = async () => {
      setEveDriversLoading(true);
      setEveDriversError(null);
      try {
        const data = await fetchEveDrivers(eveSelectedScenarios, nmdEffectiveMaturityYears);
        setEveDrivers(data);
      } catch (err) {
        setEveDriversError('Failed to load EVE drivers');
      } finally {
        setEveDriversLoading(false);
      }
    };
    fetchDrivers();
  }, [eveSelectedScenarios, nmdEffectiveMaturityYears]);

  // Fetch NII drivers for all selected scenarios
  useEffect(() => {
    const fetchDrivers = async () => {
      setNiiDriversLoading(true);
      setNiiDriversError(null);
      try {
        const data = await fetchNiiDrivers(niiSelectedScenarios, niiBreakdown);
        setNiiDrivers(data);
      } catch (err) {
        setNiiDriversError('Failed to load NII drivers');
      } finally {
        setNiiDriversLoading(false);
      }
    };
    fetchDrivers();
  }, [niiSelectedScenarios, niiBreakdown]);

  // Group EVE drivers by instrument_type
  const eveDriverMatrix = {};
  eveDrivers.forEach((drv) => {
    if (!eveDriverMatrix[drv.instrument_type]) {
      eveDriverMatrix[drv.instrument_type] = {};
    }
    eveDriverMatrix[drv.instrument_type][drv.scenario] = drv;
  });

  // Group NII drivers by instrument_type and bucket
  const niiDriverMatrix = {};
  niiDrivers.forEach((drv) => {
    const key = drv.instrument_type + '|' + (drv.breakdown_value || '');
    if (!niiDriverMatrix[key]) {
      niiDriverMatrix[key] = { instrument_type: drv.instrument_type, bucket: drv.breakdown_value };
    }
    niiDriverMatrix[key][drv.scenario] = drv;
  });


  const prepareYieldCurveData = () => {
    if (!yieldCurves.length) return [];
    
    // Group curves by scenario
    const curvesByScenario = {};
    yieldCurves.forEach(curve => {
      if (!curvesByScenario[curve.scenario]) {
        curvesByScenario[curve.scenario] = [];
      }
      curvesByScenario[curve.scenario].push({
        tenor: curve.tenor,
        rate: curve.rate * 100 // Convert to percentage
      });
    });

    // Create data points for the chart
    const tenors = ['1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '15Y', '20Y', '30Y'];
    const chartData = tenors.map(tenor => {
      const dataPoint = { tenor };
      selectedScenarios.forEach(scenario => {
        const scenarioCurve = curvesByScenario[scenario];
        if (scenarioCurve) {
          const ratePoint = scenarioCurve.find(point => point.tenor === tenor);
          if (ratePoint) {
            dataPoint[scenario] = ratePoint.rate;
          }
        }
      });
      return dataPoint;
    });

    return chartData;
  };

  const scenarioColors = {
    'Base Case': '#8884d8',
    'Parallel Up +200bps': '#ff7300',
    'Parallel Down -200bps': '#00ff00',
    'Short Rates Up +100bps': '#ff0000',
    'Short Rates Down -100bps': '#0000ff',
    'Long Rates Up +100bps': '#800080'
  };

  const renderYieldCurveChart = () => {
    const data = prepareYieldCurveData();
    if (!data.length) return <div>No yield curve data available</div>;

    return (
      <div className="chart-container">
        <div className="mb-4">
          <label htmlFor="yieldScenarios" className="text-gray-300 mr-2">Select Scenarios:</label>
          <select 
            id="yieldScenarios" 
            multiple 
            value={selectedScenarios}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedScenarios(selected);
            }}
            className="bg-gray-800 text-gray-200 rounded px-2 py-1 min-w-64 border border-gray-600 focus:outline-none focus:border-blue-500"
            size="4"
          >
            {Object.keys(scenarioColors).map(scenario => (
              <option key={scenario} value={scenario} className="py-1">
                {scenario}
              </option>
            ))}
          </select>
          <p className="text-gray-400 text-sm mt-1">Hold Ctrl/Cmd to select multiple scenarios</p>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tenor" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedScenarios.map(scenario => (
              <Line
                key={scenario}
                type="monotone"
                dataKey={scenario}
                stroke={scenarioColors[scenario]}
                strokeWidth={2}
                dot={{ fill: scenarioColors[scenario] }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const scenarioOptionsEVE = EVE_SCENARIOS.map(sc => ({ value: sc, label: sc }));
  const scenarioOptionsNII = NII_SCENARIOS.map(sc => ({ value: sc, label: sc }));
  const selectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: '#1f2937', // Tailwind gray-800
      color: '#e5e7eb', // Tailwind gray-200
      borderColor: '#4b5563', // Tailwind gray-600
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#1f2937',
      color: '#e5e7eb',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#374151', // Tailwind gray-700
      color: '#e5e7eb',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#374151' : '#1f2937',
      color: '#e5e7eb',
    }),
  };

  const [cashflowLadderData, setCashflowLadderData] = useState([]);
  const [ladderScenario, setLadderScenario] = useState('Base Case');
  const [ladderInstrumentType, setLadderInstrumentType] = useState('all');
  const [ladderAggregation, setLadderAggregation] = useState('assets');
  const [ladderCashflowType, setLadderCashflowType] = useState('pv');
  const [instrumentOptions, setInstrumentOptions] = useState([]);
  const [groupBy, setGroupBy] = useState('Month');
  const [yAxisMax, setYAxisMax] = useState('auto');

  useEffect(() => {
    // Fetch instrument types for dropdown
    fetch(`${BACKEND_URL}/api/v1/cashflow-ladder/instrument-types`)
      .then(res => res.json())
      .then(setInstrumentOptions);
  }, []);

  useEffect(() => {
    // Fetch cashflow ladder data from backend
    const params = new URLSearchParams({
      scenario: ladderScenario,
      instrument_type: ladderInstrumentType,
      aggregation: ladderAggregation,
      cashflow_type: ladderCashflowType
    });
    console.log('Fetching cashflow ladder...');
    fetch(`${BACKEND_URL}/api/v1/cashflow-ladder?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        console.log('Cashflow ladder response:', data);
        setCashflowLadderData(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Error fetching cashflow ladder:', err);
        setCashflowLadderData([]);
      });
  }, [ladderScenario, ladderInstrumentType, ladderAggregation, ladderCashflowType]);

  return (
    <div className="p-4 sm:p-8">
      <header className="mb-10 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-xl p-3 shadow-2xl inline-block">
          IRRBB Live Dashboard
        </h1>
        <p className="text-xl text-gray-300 mt-3 font-light">Real-time insights into Interest Rate Risk in the Banking Book</p>
      </header>

      {error && (
        <div className="bg-red-700 bg-opacity-80 text-white p-5 rounded-xl mb-8 text-center shadow-xl border border-red-600">
          <p className="font-bold text-2xl mb-2">Error Loading Data!</p>
          <p className="text-lg">{error}</p>
          <p className="text-sm mt-3 opacity-80">Please ensure the backend is running and accessible.</p>
          <button
            onClick={() => fetchLiveIRRBBData(nmdEffectiveMaturity, nmdDepositBeta, prepaymentRate)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
          >
            Retry Fetch
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col justify-center items-center h-96">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-500"></div>
          <p className="ml-4 mt-6 text-2xl font-medium text-blue-400">Fetching live data from backend...</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
            <label className="text-gray-300 mr-2">NMD Effective Maturity (years):</label>
            <select value={nmdEffectiveMaturityYears} onChange={e => setNmdEffectiveMaturityYears(Number(e.target.value))} className="bg-gray-800 text-gray-200 rounded px-2 py-1">
              {[2, 3, 4, 5, 7, 10].map(val => <option key={val} value={val}>{val}</option>)}
            </select>
          </div>
          <CashflowLadderChart
            data={cashflowLadderData}
            scenario={ladderScenario}
            setScenario={setLadderScenario}
            instrumentType={ladderInstrumentType}
            setInstrumentType={setLadderInstrumentType}
            instrumentOptions={instrumentOptions}
            aggregation={ladderAggregation}
            setAggregation={setLadderAggregation}
            cashflowType={ladderCashflowType}
            setCashflowType={setLadderCashflowType}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
            yAxisMax={yAxisMax}
            setYAxisMax={setYAxisMax}
          />
          {/* Behavioral Assumptions Panel */}
          <div className="bg-gray-800 p-6 rounded-2xl shadow-xl mb-8 border border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-200 mb-4">Behavioral Assumptions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label htmlFor="nmdMaturity" className="block text-gray-400 text-sm font-bold mb-2">
                  NMD Effective Maturity (Years):
                </label>
                <input
                  type="number"
                  id="nmdMaturity"
                  value={nmdEffectiveMaturity}
                  onChange={(e) => setNmdEffectiveMaturity(parseInt(e.target.value))}
                  min="1"
                  max="30"
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                />
              </div>
              <div>
                <label htmlFor="nmdBeta" className="block text-gray-400 text-sm font-bold mb-2">
                  NMD Deposit Beta (0-1):
                </label>
                <input
                  type="number"
                  id="nmdBeta"
                  value={nmdDepositBeta}
                  onChange={(e) => setNmdDepositBeta(parseFloat(e.target.value))}
                  min="0.0"
                  max="1.0"
                  step="0.01"
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                />
              </div>
              <div>
                <label htmlFor="prepaymentRate" className="block text-gray-400 text-sm font-bold mb-2">
                  Loan Prepayment Rate (CPR, 0-1):
                </label>
                <input
                  type="number"
                  id="prepaymentRate"
                  value={prepaymentRate}
                  onChange={(e) => setPrepaymentRate(parseFloat(e.target.value))}
                  min="0.0"
                  max="1.0"
                  step="0.01"
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button
                  onClick={applyAssumptions}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200"
                >
                  Apply Assumptions
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Metrics Cards */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-green-300 mb-3">Net Interest Income (Base)</h2>
              <p className="text-5xl font-extrabold text-green-400">
                {formatCurrency(dashboardData.netInterestIncome)}
              </p>
              <p className="text-gray-400 mt-2 text-sm">Calculated Net Interest Income (Base Case)</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-teal-300 mb-3">Economic Value of Equity (Base)</h2>
              <p className="text-5xl font-extrabold text-teal-400">
                {formatCurrency(dashboardData.economicValueOfEquity)}
              </p>
              <p className="text-gray-400 mt-2 text-sm">Economic Value of Equity (Base Case)</p>
            </div>

            {/* EVE by Scenario and NII by Scenario Tables - Side by Side */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-x-auto table-container">
              <h2 className="text-xl font-semibold text-gray-300 mb-4">EVE by Scenario (USD)</h2>
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider rounded-tl-lg">Scenario</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">EVE Value</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider rounded-tr-lg">% Change vs Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {dashboardData.eveScenarios.map((item, index) => {
                    const baseEve = dashboardData.eveScenarios.find(s => s.scenario_name === 'Base Case')?.eve_value || 0;
                    const percentChange = baseEve !== 0 ? ((item.eve_value - baseEve) / baseEve * 100) : 0;
                    return (
                      <tr key={index} className="hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{item.scenario_name}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getGapColor(item.eve_value)}`}>{formatCurrency(item.eve_value)}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${percentChange > 0 ? 'text-green-400' : percentChange < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {percentChange.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-gray-400 mt-4 text-sm">Economic Value of Equity under various predefined interest rate shock scenarios.</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-x-auto table-container">
              <h2 className="text-xl font-semibold text-gray-300 mb-4">NII by Scenario (USD)</h2>
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider rounded-tl-lg">Scenario</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">NII Value</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider rounded-tr-lg">% Change vs Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {dashboardData.niiScenarios.map((item, index) => {
                    const baseNii = dashboardData.niiScenarios.find(s => s.scenario_name === 'Base Case')?.nii_value || 0;
                    const percentChange = baseNii !== 0 ? ((item.nii_value - baseNii) / baseNii * 100) : 0;
                    return (
                      <tr key={index} className="hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{item.scenario_name}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getGapColor(item.nii_value)}`}>{formatCurrency(item.nii_value)}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${percentChange > 0 ? 'text-green-400' : percentChange < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {percentChange.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-gray-400 mt-4 text-sm">Net Interest Income under various predefined interest rate shock scenarios.</p>
            </div>

            {/* EVE Drivers Comparison Table */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-x-auto table-container">
              <h2 className="text-xl font-semibold text-gray-300 mb-4">EVE Drivers (Scenario Comparison)</h2>
              <div className="mb-4">
                <label htmlFor="eveScenarios" className="text-gray-300 mr-2">Select Scenarios:</label>
                <select
                  id="eveScenarios"
                  multiple
                  value={eveSelectedScenarios}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setEveSelectedScenarios(options);
                  }}
                  className="bg-gray-800 text-gray-200 rounded px-2 py-1 min-w-[200px]"
                >
                  {scenarioOptionsEVE.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-gray-400 text-sm mt-1">Hold Ctrl/Cmd to select multiple scenarios</p>
              </div>
              {eveDriversLoading ? (
                <div className="text-center text-gray-300">Loading...</div>
              ) : eveDriversError ? (
                <div className="text-center text-red-400">{eveDriversError}</div>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-600">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider rounded-tl-lg">Type</th>
                        {eveSelectedScenarios.map(sc => (
                          <th key={sc} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{sc} PV</th>
                        ))}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider rounded-tr-lg">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {Object.keys(eveDriverMatrix).map(type => (
                        <tr key={type} className="hover:bg-gray-700 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{type}</td>
                          {eveSelectedScenarios.map(sc => (
                            <td key={sc} className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getGapColor(eveDriverMatrix[type][sc]?.base_pv)}`}>{
                              eveDriverMatrix[type][sc]?.base_pv != null ? (eveDriverMatrix[type][sc].base_pv / 1000000).toFixed(2) + 'M' : '-'
                            }</td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{
                            // Show duration for the first selected scenario that has it
                            eveSelectedScenarios.map(sc => eveDriverMatrix[type][sc]?.duration).find(d => d != null) != null
                              ? eveSelectedScenarios.map(sc => eveDriverMatrix[type][sc]?.duration).find(d => d != null).toFixed(2) + ' years'
                              : '-'
                          }</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {Object.keys(eveDriverMatrix).length === 0 && <div className="text-center text-gray-400 mt-4">No EVE driver data available.</div>}
                </div>
              )}
            </div>

            {/* NII Drivers Comparison Table */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-x-auto table-container">
              <h2 className="text-xl font-semibold text-gray-300 mb-4">NII Drivers (Scenario Comparison)</h2>
              <div className="mb-4">
                <label htmlFor="niiScenarios" className="text-gray-300 mr-2">Select Scenarios:</label>
                <select
                  id="niiScenarios"
                  multiple
                  value={niiSelectedScenarios}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setNiiSelectedScenarios(options);
                  }}
                  className="bg-gray-800 text-gray-200 rounded px-2 py-1 min-w-[200px]"
                >
                  {scenarioOptionsNII.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-gray-400 text-sm mt-1">Hold Ctrl/Cmd to select multiple scenarios</p>
              </div>
              {niiDriversLoading ? (
                <div className="text-center text-gray-300">Loading...</div>
              ) : niiDriversError ? (
                <div className="text-center text-red-400">{niiDriversError}</div>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-600">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider rounded-tl-lg">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bucket</th>
                        {niiSelectedScenarios.map(sc => (
                          <th key={sc} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{sc} NII</th>
                        ))}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider rounded-tr-lg"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {Object.values(niiDriverMatrix).map(row => (
                        <tr key={row.instrument_type + '|' + row.bucket} className="hover:bg-gray-700 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{row.instrument_type || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{row.bucket || '-'}</td>
                          {niiSelectedScenarios.map(sc => (
                            <td key={sc} className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getGapColor(row[sc]?.nii_contribution)}`}>{
                              row[sc]?.nii_contribution != null ? formatCurrency(row[sc].nii_contribution) : '-'
                            }</td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {Object.keys(niiDriverMatrix).length === 0 && <div className="text-center text-gray-400 mt-4">No NII driver data available.</div>}
                </div>
              )}
            </div>

            {/* Yield Curve Chart and NII Repricing Gap Table - Side by Side */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-gray-300 mb-4">Yield Curve</h2>
              {renderYieldCurveChart()}
            </div>

            <RepricingGapChart />

            {/* Additional Info / Disclaimer */}
            <div className="lg:col-span-full xl:col-span-full bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-gray-300 mb-3">Disclaimer</h2>
              <p className="text-gray-400 text-sm">
                This dashboard provides a simplified, illustrative view of IRRBB metrics using simulated data. In a real-world scenario, this would be integrated with actual financial data sources and sophisticated risk models.
              </p>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Dashboard;
