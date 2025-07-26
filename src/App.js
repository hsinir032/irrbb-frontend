import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
// Import the external components
import Dashboard from './components/Dashboard';
import InstrumentManagement from './components/InstrumentManagement';
import PortfolioComposition from './components/PortfolioComposition';

// Define the backend URL
const BACKEND_URL = "https://irrbbb-backend.onrender.com";

// Main App component (now primarily handles routing and global data fetching)
const App = () => {
  const [dashboardData, setDashboardData] = useState({
    eveSensitivity: 0,
    niiSensitivity: 0,
    portfolioValue: 0,
    yieldCurveData: [],
    scenarioData: [],
    totalLoans: 0,
    totalDeposits: 0,
    totalDerivatives: 0,
    totalAssetsValue: 0,
    totalLiabilitiesValue: 0,
    netInterestIncome: 0,
    economicValueOfEquity: 0,
    niiRepricingGap: [],
    eveMaturityGap: [],
    eveScenarios: [],
    niiScenarios: [],
    loanComposition: {},
    depositComposition: {},
    derivativeComposition: {},
    current_assumptions: { // Initialize with default assumptions
      nmd_effective_maturity_years: 5,
      nmd_deposit_beta: 0.5,
      prepayment_rate: 0.0
    }
  });

  const [portfolioCompositionData, setPortfolioCompositionData] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch live data from the FastAPI backend
  // Now accepts NMD and prepayment assumptions as parameters
  const fetchLiveIRRBBData = async (
    nmdEffectiveMaturity = dashboardData.current_assumptions.nmd_effective_maturity_years,
    nmdDepositBeta = dashboardData.current_assumptions.nmd_deposit_beta,
    prepaymentRate = dashboardData.current_assumptions.prepayment_rate
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/v1/dashboard/live-data?nmd_effective_maturity_years=${nmdEffectiveMaturity}&nmd_deposit_beta=${nmdDepositBeta}&prepayment_rate=${prepaymentRate}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data = await response.json();
      setDashboardData({
        eveSensitivity: data.eve_sensitivity ?? 0,
        niiSensitivity: data.nii_sensitivity ?? 0,
        portfolioValue: data.portfolio_value ?? 0,
        yieldCurveData: data.yield_curve_data?.map(item => ({
          name: item.name,
          yield: item.rate ?? 0
        })) ?? [],
        scenarioData: data.scenario_data?.map(item => ({
  	  time: item.time,
  	  'Base Case': item.data["Base Case"] ?? 0,  // ✅ Correct path
  	  '+200bps': item.data["+200bps"] ?? 0,      // ✅ Correct path
  	  '-200bps': item.data["-200bps"] ?? 0       // ✅ Correct path
	})) ?? [],
        totalLoans: data.total_loans ?? 0,
        totalDeposits: data.total_deposits ?? 0,
        totalDerivatives: data.total_derivatives ?? 0,
        totalAssetsValue: data.total_assets_value ?? 0,
        totalLiabilitiesValue: data.total_liabilities_value ?? 0,
        netInterestIncome: data.net_interest_income ?? 0,
        economicValueOfEquity: data.economic_value_of_equity ?? 0,
        niiRepricingGap: data.nii_repricing_gap ?? [],
        eveMaturityGap: data.eve_maturity_gap ?? [],
        eveScenarios: data.eve_scenarios ?? [],
        niiScenarios: data.nii_scenarios ?? [],
        loanComposition: data.loan_composition ?? {},
        depositComposition: data.deposit_composition ?? {},
        derivativeComposition: data.derivative_composition ?? {},
        current_assumptions: data.current_assumptions ?? { // Ensure assumptions are updated from backend
          nmd_effective_maturity_years: 5,
          nmd_deposit_beta: 0.5,
          prepayment_rate: 0.0
        }
      });
    } catch (err) {
      console.error("Error fetching live data:", err);
      setError(`Failed to load data: ${err.message}. Please ensure the backend is running and accessible.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch with default assumptions
    fetchLiveIRRBBData();
    // Fetch portfolio composition data for avgRatesData
    fetch(`${BACKEND_URL}/api/v1/portfolio/composition`)
      .then(res => res.json())
      .then(setPortfolioCompositionData)
      .catch(() => setPortfolioCompositionData([]));
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-800 text-gray-100 font-inter">
        {/* Global Styles */}
        <style>
          {`
            body {
              font-family: 'Inter', sans-serif;
            }
            .recharts-default-tooltip {
              background-color: rgba(30, 41, 59, 0.9) !important;
              border-radius: 0.75rem !important;
              padding: 0.75rem 1rem !important;
              border: 1px solid rgba(71, 85, 105, 0.5) !important;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
              backdrop-filter: blur(5px);
            }
            .recharts-tooltip-label {
              color: #e2e8f0 !important;
              font-weight: 600 !important;
              margin-bottom: 0.5rem !important;
            }
            .recharts-tooltip-item {
              color: #cbd5e1 !important;
              font-size: 0.875rem !important;
            }
            .recharts-legend-item-text {
              color: #cbd5e1 !important;
            }
            .recharts-cartesian-axis-tick-value {
              fill: #94a3b8 !important;
            }
            .table-container::-webkit-scrollbar {
              height: 8px;
              width: 8px;
            }
            .table-container::-webkit-scrollbar-track {
              background: #1e293b;
              border-radius: 10px;
            }
            .table-container::-webkit-scrollbar-thumb {
              background: #475569;
              border-radius: 10px;
            }
            .table-container::-webkit-scrollbar-thumb:hover {
              background: #64748b;
            }
          `}
        </style>

        {/* Navigation Bar */}
        <nav className="bg-gray-900 p-4 shadow-lg sticky top-0 z-50">
          <div className="container mx-auto flex flex-wrap justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors duration-200">
              IRRBB Dashboard
            </Link>
            <div className="flex items-center space-x-4 mt-2 md:mt-0">
              <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200 flex items-center">
                Dashboard
              </Link>
              <Link to="/instruments" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200 flex items-center">
                Instruments
              </Link>
              <Link to="/portfolio" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200 flex items-center">
                Portfolio
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content Area with Routes */}
        <div className="container mx-auto py-8">
          <Routes>
            <Route path="/" element={
              <Dashboard
                dashboardData={dashboardData}
                isLoading={isLoading}
                error={error}
                fetchLiveIRRBBData={fetchLiveIRRBBData}
              />
            } />
            <Route path="/instruments" element={<InstrumentManagement BACKEND_URL={BACKEND_URL} refreshDashboard={fetchLiveIRRBBData} />} />
	    <Route path="/portfolio" element={
  <PortfolioComposition
    totalLoans={portfolioCompositionData.total_loans}
    totalDeposits={portfolioCompositionData.total_deposits}
    totalDerivatives={portfolioCompositionData.total_derivatives}
    avgRatesData={portfolioCompositionData.records}
  />
} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
