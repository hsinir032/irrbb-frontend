// PortfolioComposition.jsx — shows fixed/floating mix, repricing gaps, basis linkages

import React, { useEffect, useState } from 'react';
import { fetchPortfolioComposition, fetchNetPositions } from './services';
import { PieChart, Pie, Cell, BarChart, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1"];

const PortfolioComposition = ({ BACKEND_URL }) => {
  const [composition, setComposition] = useState([]);
  const [netPositions, setNetPositions] = useState([]);

  useEffect(() => {
    fetchPortfolioComposition(BACKEND_URL).then(setComposition);
    fetchNetPositions(BACKEND_URL).then(setNetPositions);
  }, [BACKEND_URL]);

  const groupByCategory = (data, type) => {
    return data.filter(d => d.instrument_type === type).map(d => ({ name: d.category, value: d.total_amount }));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Portfolio Composition</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Fixed vs Floating Pie Charts */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Loan Types</h2>
          <PieChart width={400} height={300}>
            <Pie
              data={groupByCategory(composition, 'Loan')}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {groupByCategory(composition, 'Loan').map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Deposit Types</h2>
          <PieChart width={400} height={300}>
            <Pie
              data={groupByCategory(composition, 'Deposit')}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#82ca9d"
              label
            >
              {groupByCategory(composition, 'Deposit').map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      {/* Net Positions Chart */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-2">Net Positions Across Buckets</h2>
        <BarChart width={800} height={300} data={netPositions}>
          <XAxis dataKey="bucket" stroke="#ccc" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="total_assets" fill="#8884d8" name="Assets" />
          <Bar dataKey="total_liabilities" fill="#ff8042" name="Liabilities" />
          <Bar dataKey="net_position" fill="#82ca9d" name="Net Position" />
        </BarChart>
      </div>
    </div>
  );
};

export default PortfolioComposition;