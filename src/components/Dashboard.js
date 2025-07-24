import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchEveDrivers, fetchNiiDrivers } from './services';

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

// Duration chart helpers
const getDurationChartData = (drivers, type) => {
  // Filter for instrument_type (Loan=asset, Deposit=liability), only Base Case
  const filtered = drivers.filter(d => d.instrument_type === type && d.duration != null);
  // Sort by instrument_id for consistent x-axis
  const sorted = filtered.sort((a, b) => a.instrument_id.localeCompare(b.instrument_id));
  // Calculate weighted average duration
  let total = 0, weightedSum = 0;
  sorted.forEach(d => {
    const notional = Math.abs(d.base_pv || 0);
    total += notional;
    weightedSum += (d.duration || 0) * notional;
  });
  const weightedAvg = total > 0 ? weightedSum / total : null;
  return {
    points: sorted.map(d => ({
      instrument: d.instrument_id,
      duration: d.duration
    })),
    weightedAvg
  };
};


const Dashboard = ({ dashboardData, isLoading, error, fetchLiveIRRBBData }) => {
  // Local state for NMD and Prepayment assumptions
  const [nmdEffectiveMaturity, setNmdEffectiveMaturity] = useState(dashboardData.current_assumptions.nmd_effective_maturity_years);
  const [nmdDepositBeta, setNmdDepositBeta] = useState(dashboardData.current_assumptions.nmd_deposit_beta);
  const [prepaymentRate, setPrepaymentRate] = useState(dashboardData.current_assumptions.prepayment_rate);

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

  // EVE Drivers modal state
  const [eveDrivers, setEveDrivers] = useState([]);
  const [showEveModal, setShowEveModal] = useState(false);
  const [eveModalLoading, setEveModalLoading] = useState(false);
  const [eveModalError, setEveModalError] = useState(null);
  const [eveScenario, setEveScenario] = useState('Base Case');

  const EVE_SCENARIOS = [
    'Base Case',
    'Parallel Up +200bps',
    'Parallel Down -200bps',
    'Short Rates Up +100bps',
    'Short Rates Down -100bps',
    'Long Rates Up +100bps',
  ];

  // Handler to fetch and show EVE drivers
  const handleEveClick = async (scenario = 'Base Case') => {
    setEveModalLoading(true);
    setEveModalError(null);
    setShowEveModal(true);
    setEveScenario(scenario);
    try {
      const data = await fetchEveDrivers(scenario);
      setEveDrivers(data);
    } catch (err) {
      setEveModalError('Failed to load EVE drivers');
    } finally {
      setEveModalLoading(false);
    }
  };

  // Handler for scenario change
  const handleEveScenarioChange = async (e) => {
    const scenario = e.target.value;
    setEveScenario(scenario);
    handleEveClick(scenario);
  };

  // NII Drivers modal state
  const [niiDrivers, setNiiDrivers] = useState([]);
  const [showNiiModal, setShowNiiModal] = useState(false);
  const [niiModalLoading, setNiiModalLoading] = useState(false);
  const [niiModalError, setNiiModalError] = useState(null);
  const [niiBreakdown, setNiiBreakdown] = useState('instrument');

  // Handler to fetch and show NII drivers
  const handleNiiClick = async (breakdown = 'instrument') => {
    setNiiModalLoading(true);
    setNiiModalError(null);
    setShowNiiModal(true);
    setNiiBreakdown(breakdown);
    try {
      const data = await fetchNiiDrivers('Base Case', breakdown);
      setNiiDrivers(data);
    } catch (err) {
      setNiiModalError('Failed to load NII drivers');
    } finally {
      setNiiModalLoading(false);
    }
  };

  // Handler for breakdown change
  const handleBreakdownChange = async (e) => {
    const breakdown = e.target.value;
    setNiiBreakdown(breakdown);
    handleNiiClick(breakdown);
  };

  const [eveDriversBase, setEveDriversBase] = useState([]);
  useEffect(() => {
    fetchEveDrivers('Base Case').then(setEveDriversBase).catch(() => setEveDriversBase([]));
  }, []);

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Key Metrics Cards */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-blue-300 mb-3">EVE Sensitivity (%)</h2>
              <p className={`text-5xl font-extrabold ${getSensitivityColor(dashboardData.eveSensitivity)}`}>
                {dashboardData.eveSensitivity}%
              </p>
              <p className="text-gray-400 mt-2 text-sm">Economic Value of Equity Sensitivity to Rate Shocks (Base vs +200bps)</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-purple-300 mb-3">NII Sensitivity (%)</h2>
              <p className={`text-5xl font-extrabold ${getSensitivityColor(dashboardData.niiSensitivity)}`}>
                {dashboardData.niiSensitivity}%
              </p>
              <p className="text-gray-400 mt-2 text-sm">Net Interest Income Sensitivity to Rate Shocks (Base vs +200bps)</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-green-300 mb-3">Net Interest Income (Base)</h2>
              <p className="text-5xl font-extrabold text-green-400 cursor-pointer underline" title="Click to see NII drivers" onClick={() => handleNiiClick('instrument')}>
                {formatCurrency(dashboardData.netInterestIncome)}
              </p>
              <p className="text-gray-400 mt-2 text-sm">Calculated Net Interest Income (Base Case)</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-teal-300 mb-3">Economic Value of Equity (Base)</h2>
              <p className="text-5xl font-extrabold text-teal-400 cursor-pointer underline" title="Click to see EVE drivers" onClick={() => handleEveClick('Base Case')}>
                {formatCurrency(dashboardData.economicValueOfEquity)}
              </p>
              <p className="text-gray-400 mt-2 text-sm">Economic Value of Equity (Base Case)</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-orange-300 mb-3">Total Assets PV</h2>
              <p className="text-5xl font-extrabold text-orange-400">
                {formatCurrency(dashboardData.totalAssetsValue)}
              </p>
              <p className="text-gray-400 mt-2 text-sm">Present Value of all Assets (Loans)</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-red-300 mb-3">Total Liabilities PV</h2>
              <p className="text-5xl font-extrabold text-red-400">
                {formatCurrency(dashboardData.totalLiabilitiesValue)}
              </p>
              <p className="text-gray-400 mt-2 text-sm">Present Value of all Liabilities (Deposits)</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-yellow-300 mb-3">Total Loans</h2>
              <p className="text-5xl font-extrabold text-yellow-400">
                {dashboardData.totalLoans}
              </p>
              <p className="text-gray-400 mt-2 text-sm">Number of loan instruments in the database</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-cyan-300 mb-3">Total Deposits</h2>
              <p className="text-5xl font-extrabold text-cyan-400">
                {dashboardData.totalDeposits}
              </p>
              <p className="text-gray-400 mt-2 text-sm">Number of deposit instruments in the database</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-lime-300 mb-3">Total Derivatives</h2>
              <p className="text-5xl font-extrabold text-lime-400">
                {dashboardData.totalDerivatives}
              </p>
              <p className="text-gray-400 mt-2 text-sm">Number of derivative instruments in the database</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-indigo-300 mb-3">Portfolio Value (Net PV)</h2>
              <p className="text-5xl font-extrabold text-indigo-400">
                {formatCurrency(dashboardData.portfolioValue)}
              </p>
              <p className="text-gray-400 mt-2 text-sm">Net Present Value of Assets, Liabilities & Derivatives</p>
            </div>

            {/* Charts Section */}
            <div className="lg:col-span-2 xl:col-span-2 bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-gray-300 mb-4">Yield Curve</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.yieldCurveData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="name" stroke="#94a3b8" /> {/* slate-400 */}
                  <YAxis stroke="#94a3b8" label={{ value: 'Yield (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: 'none', borderRadius: '0.75rem' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#cbd5e1' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', color: '#cbd5e1' }} />
                  <Line type="monotone" dataKey="yield" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-gray-400 mt-2 text-sm">Current yield curve across different maturities.</p>
            </div>

            {/* NII Scenarios Table */}
            <div className="lg:col-span-2 xl:col-span-2 bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-x-auto table-container">
              <h2 className="text-xl font-semibold text-gray-300 mb-4">NII by Scenario (USD)</h2>
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider rounded-tl-lg">Scenario</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider rounded-tr-lg">NII Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {dashboardData.niiScenarios.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{item.scenario_name}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getGapColor(item.nii_value)}`}>{formatCurrency(item.nii_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-gray-400 mt-4 text-sm">Net Interest Income under various predefined interest rate shock scenarios.</p>
            </div>

            {/* NII Repricing Gap Table */}
            <div className="lg:col-span-2 xl:col-span-2 bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-x-auto table-container">
              <h2 className="text-xl font-semibold text-gray-300 mb-4">NII Repricing Gap (USD)</h2>
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider rounded-tl-lg">Bucket</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Assets (IR-Sensitive)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Liabilities (IR-Sensitive)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider rounded-tr-lg">Net Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {dashboardData.niiRepricingGap.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{item.bucket}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatCurrency(item.assets)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatCurrency(item.liabilities)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getGapColor(item.gap)}`}>{formatCurrency(item.gap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-gray-400 mt-4 text-sm">Exposure of Net Interest Income to rate changes over time.</p>
            </div>

            {/* EVE Maturity Gap Table */}
            <div className="lg:col-span-2 xl:col-span-2 bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-x-auto table-container">
              <h2 className="text-xl font-semibold text-gray-300 mb-4">EVE Maturity Gap (USD)</h2>
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider rounded-tl-lg">Bucket</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Assets (PV)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Liabilities (PV)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider rounded-tr-lg">Net Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {dashboardData.eveMaturityGap.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{item.bucket}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatCurrency(item.assets)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatCurrency(item.liabilities)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getGapColor(item.gap)}`}>{formatCurrency(item.gap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-gray-400 mt-4 text-sm">Exposure of Economic Value of Equity to rate changes over time.</p>
            </div>

            {/* Portfolio Composition Section */}
            <div className="lg:col-span-full xl:col-span-full grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Loan Composition */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <h2 className="text-xl font-semibold text-gray-300 mb-4">Loan Composition (Notional)</h2>
                {Object.keys(dashboardData.loanComposition).length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={Object.entries(dashboardData.loanComposition).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {Object.keys(dashboardData.loanComposition).map((entry, index) => (
                          <Cell key={`cell-loan-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: 'none', borderRadius: '0.75rem' }}
                        labelStyle={{ color: '#e2e8f0' }}
                        itemStyle={{ color: '#cbd5e1' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px', color: '#cbd5e1' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm">No loan composition data available.</p>
                )}
              </div>

              {/* Deposit Composition */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <h2 className="text-xl font-semibold text-gray-300 mb-4">Deposit Composition (Balance)</h2>
                {Object.keys(dashboardData.depositComposition).length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={Object.entries(dashboardData.depositComposition).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#82ca9d"
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {Object.keys(dashboardData.depositComposition).map((entry, index) => (
                          <Cell key={`cell-deposit-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: 'none', borderRadius: '0.75rem' }}
                        labelStyle={{ color: '#e2e8f0' }}
                        itemStyle={{ color: '#cbd5e1' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px', color: '#cbd5e1' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm">No deposit composition data available.</p>
                )}
              </div>

              {/* Derivative Composition */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <h2 className="text-xl font-semibold text-gray-300 mb-4">Derivative Composition (Notional)</h2>
                {Object.keys(dashboardData.derivativeComposition).length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={Object.entries(dashboardData.derivativeComposition).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#ffc658"
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {Object.keys(dashboardData.derivativeComposition).map((entry, index) => (
                          <Cell key={`cell-derivative-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: 'none', borderRadius: '0.75rem' }}
                        labelStyle={{ color: '#e2e8f0' }}
                        itemStyle={{ color: '#cbd5e1' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px', color: '#cbd5e1' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm">No derivative composition data available.</p>
                )}
              </div>
            </div>

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
      {/* EVE Drivers Modal */}
      {showEveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-3xl w-full relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl" onClick={() => setShowEveModal(false)}>&times;</button>
            <h3 className="text-2xl font-bold text-teal-300 mb-4">EVE Drivers ({eveScenario})</h3>
            <div className="mb-4">
              <label htmlFor="eveScenario" className="text-gray-300 mr-2">Scenario:</label>
              <select id="eveScenario" value={eveScenario} onChange={handleEveScenarioChange} className="bg-gray-800 text-gray-200 rounded px-2 py-1">
                {EVE_SCENARIOS.map((sc) => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </div>
            {eveModalLoading ? (
              <div className="text-center text-gray-300">Loading...</div>
            ) : eveModalError ? (
              <div className="text-center text-red-400">{eveModalError}</div>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Instrument ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Base PV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {eveDrivers.map((drv, idx) => (
                      <tr key={drv.id || idx}>
                        <td className="px-4 py-2 text-gray-200">{drv.instrument_id}</td>
                        <td className="px-4 py-2 text-gray-200">{drv.instrument_type}</td>
                        <td className="px-4 py-2 text-gray-200">{drv.base_pv != null ? drv.base_pv.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {eveDrivers.length === 0 && <div className="text-center text-gray-400 mt-4">No EVE driver data available.</div>}
              </div>
            )}
          </div>
        </div>
      )}
      {/* NII Drivers Modal */}
      {showNiiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-3xl w-full relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl" onClick={() => setShowNiiModal(false)}>&times;</button>
            <h3 className="text-2xl font-bold text-green-300 mb-4">NII Drivers (Base Case)</h3>
            <div className="mb-4">
              <label htmlFor="niiBreakdown" className="text-gray-300 mr-2">Breakdown by:</label>
              <select id="niiBreakdown" value={niiBreakdown} onChange={handleBreakdownChange} className="bg-gray-800 text-gray-200 rounded px-2 py-1">
                <option value="instrument">Instrument</option>
                <option value="type">Type</option>
                <option value="bucket">Bucket</option>
              </select>
            </div>
            {niiModalLoading ? (
              <div className="text-center text-gray-300">Loading...</div>
            ) : niiModalError ? (
              <div className="text-center text-red-400">{niiModalError}</div>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800">
                    <tr>
                      {niiBreakdown === 'instrument' && <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Instrument ID</th>}
                      {niiBreakdown === 'instrument' && <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Type</th>}
                      {niiBreakdown === 'type' && <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Type</th>}
                      {niiBreakdown === 'bucket' && <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Bucket</th>}
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">NII Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {niiDrivers.map((drv, idx) => (
                      <tr key={drv.id || idx}>
                        {niiBreakdown === 'instrument' && <td className="px-4 py-2 text-gray-200">{drv.instrument_id}</td>}
                        {niiBreakdown === 'instrument' && <td className="px-4 py-2 text-gray-200">{drv.instrument_type}</td>}
                        {niiBreakdown === 'type' && <td className="px-4 py-2 text-gray-200">{drv.instrument_type}</td>}
                        {niiBreakdown === 'bucket' && <td className="px-4 py-2 text-gray-200">{drv.breakdown_value}</td>}
                        <td className="px-4 py-2 text-gray-200">{drv.nii_contribution != null ? drv.nii_contribution.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {niiDrivers.length === 0 && <div className="text-center text-gray-400 mt-4">No NII driver data available.</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
