// services.js — API calls to backend

const BACKEND_URL = "https://irrbbb-backend.onrender.com";

export const fetchPortfolioComposition = async () => {
  const res = await fetch(`${BACKEND_URL}/api/v1/portfolio/composition`);
  return res.json();
};

export const fetchEveDrivers = async (scenario = "Base Case") => {
  const res = await fetch(`${BACKEND_URL}/api/v1/dashboard/eve-drivers?scenario=${encodeURIComponent(scenario)}`);
  if (!res.ok) throw new Error("Failed to fetch EVE drivers");
  return res.json();
};

export const fetchNetPositions = async (scenario = "Base Case") => {
  const res = await fetch(`${BACKEND_URL}/api/v1/dashboard/net-positions?scenario=${scenario}`);
  return res.json();
};

export const fetchNiiDrivers = async (scenario = "Base Case", breakdown = "instrument") => {
  const res = await fetch(`${BACKEND_URL}/api/v1/dashboard/nii-drivers?scenario=${encodeURIComponent(scenario)}&breakdown=${encodeURIComponent(breakdown)}`);
  if (!res.ok) throw new Error('Failed to fetch NII drivers');
  return res.json();
};
