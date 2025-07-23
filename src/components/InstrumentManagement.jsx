// InstrumentManagement.jsx — unified page for managing Loans, Deposits, Derivatives

import React, { useState } from 'react';
import LoanManagement from './LoanManagement';
import DepositManagement from './DepositManagement';
import DerivativeManagement from './DerivativeManagement';

const InstrumentManagement = ({ BACKEND_URL, refreshDashboard }) => {
  const [selectedType, setSelectedType] = useState('Loans');

  const renderSelectedComponent = () => {
    switch (selectedType) {
      case 'Loans':
        return <LoanManagement BACKEND_URL={BACKEND_URL} refreshDashboard={refreshDashboard} />;
      case 'Deposits':
        return <DepositManagement BACKEND_URL={BACKEND_URL} refreshDashboard={refreshDashboard} />;
      case 'Derivatives':
        return <DerivativeManagement BACKEND_URL={BACKEND_URL} refreshDashboard={refreshDashboard} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Instrument Management</h1>
      <select
        className="p-2 rounded-md bg-gray-800 text-white mb-6"
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
      >
        <option value="Loans">Loans</option>
        <option value="Deposits">Deposits</option>
        <option value="Derivatives">Derivatives</option>
      </select>
      {renderSelectedComponent()}
    </div>
  );
};

export default InstrumentManagement;