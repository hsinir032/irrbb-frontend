// services.js — API calls to backend

const BACKEND_URL = "https://irrbbb-backend.onrender.com";

export const fetchPortfolioComposition = async () => {
  const res = await fetch(`${BACKEND_URL}/api/v1/portfolio/composition`);
  return res.json();
};

export const fetchEveDrivers = async (scenarios = ["Base Case"]) => {
  let url;
  if (Array.isArray(scenarios)) {
    url = `${BACKEND_URL}/api/v1/dashboard/eve-drivers?scenarios=${encodeURIComponent(scenarios.join(","))}`;
  } else {
    url = `${BACKEND_URL}/api/v1/dashboard/eve-drivers?scenarios=${encodeURIComponent(scenarios)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch EVE drivers");
  return res.json();
};

export const fetchNetPositions = async (scenario = "Base Case") => {
  const res = await fetch(`${BACKEND_URL}/api/v1/dashboard/net-positions?scenario=${scenario}`);
  return res.json();
};

export const fetchNiiDrivers = async (scenarios = ["Base Case"], breakdown = "instrument") => {
  let url;
  if (Array.isArray(scenarios)) {
    url = `${BACKEND_URL}/api/v1/dashboard/nii-drivers?scenarios=${encodeURIComponent(scenarios.join(","))}&breakdown=${encodeURIComponent(breakdown)}`;
  } else {
    url = `${BACKEND_URL}/api/v1/dashboard/nii-drivers?scenarios=${encodeURIComponent(scenarios)}&breakdown=${encodeURIComponent(breakdown)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch NII drivers');
  return res.json();
};

export const fetchYieldCurves = async (scenario = null) => {
    try {
        const url = scenario 
            ? `${BACKEND_URL}/api/v1/yield-curves?scenario=${encodeURIComponent(scenario)}`
            : `${BACKEND_URL}/api/v1/yield-curves`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching yield curves:', error);
        return [];
    }
};
