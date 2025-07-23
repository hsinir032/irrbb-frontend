// services.js — API calls to backend

export const fetchPortfolioComposition = async (BACKEND_URL) => {
  const res = await fetch(`${BACKEND_URL}/api/v1/portfolio/composition`);
  return res.json();
};

export const fetchEveDrivers = async (BACKEND_URL, scenario = "Parallel Up +200bps") => {
  const res = await fetch(`${BACKEND_URL}/api/v1/dashboard/eve-drivers?scenario=${scenario}`);
  return res.json();
};

export const fetchNetPositions = async (BACKEND_URL, scenario = "Base Case") => {
  const res = await fetch(`${BACKEND_URL}/api/v1/dashboard/net-positions?scenario=${scenario}`);
  return res.json();
};
