// PortfolioComposition.jsx — shows fixed/floating mix, repricing gaps, basis linkages

import React, { useEffect, useState } from 'react';
import { fetchPortfolioComposition, fetchNetPositions } from './services';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00c49f', '#ffbb28'];

const formatCurrency = (value) => {
  const valueInMillions = value / 1000000;
  return `$${valueInMillions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
};

const PortfolioComposition = ({
  totalLoans = 0,
  totalDeposits = 0,
  totalDerivatives = 0,
  loanComposition = {},
  depositComposition = {},
  derivativeComposition = {},
  avgRatesData = [] // Array of { category, instrument_type, average_interest_rate }
}) => {
  // Prepare data for average interest rate chart
  const avgRateChartData = avgRatesData.filter(d => d.average_interest_rate != null).map(d => ({
    name: `${d.instrument_type}: ${d.category}`,
    avgRate: d.average_interest_rate * 100 // convert to %
  }));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Portfolio Composition</h1>

      {/* Total Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="text-xl font-semibold text-yellow-300 mb-3">Total Loans</h2>
          <p className="text-5xl font-extrabold text-yellow-400">{totalLoans}</p>
          <p className="text-gray-400 mt-2 text-sm">Number of loan instruments in the database</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="text-xl font-semibold text-cyan-300 mb-3">Total Deposits</h2>
          <p className="text-5xl font-extrabold text-cyan-400">{totalDeposits}</p>
          <p className="text-gray-400 mt-2 text-sm">Number of deposit instruments in the database</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="text-xl font-semibold text-lime-300 mb-3">Total Derivatives</h2>
          <p className="text-5xl font-extrabold text-lime-400">{totalDerivatives}</p>
          <p className="text-gray-400 mt-2 text-sm">Number of derivative instruments in the database</p>
        </div>
      </div>

      {/* Composition Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Loan Composition */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="text-xl font-semibold text-gray-300 mb-4">Loan Composition (Notional)</h2>
          {Object.keys(loanComposition).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(loanComposition).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {Object.keys(loanComposition).map((entry, index) => (
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
          {Object.keys(depositComposition).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(depositComposition).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#82ca9d"
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {Object.keys(depositComposition).map((entry, index) => (
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
          {Object.keys(derivativeComposition).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(derivativeComposition).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#ffc658"
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {Object.keys(derivativeComposition).map((entry, index) => (
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

      {/* Average Interest Rate Comparison Bar Chart */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-2xl shadow-xl border border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 mb-8">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">Average Interest Rate by Product</h2>
        {avgRateChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={avgRateChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#94a3b8" interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="#94a3b8" label={{ value: 'Avg Rate (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
              <Tooltip formatter={(v) => `${v.toFixed(2)}%`} />
              <Legend />
              <Bar dataKey="avgRate" fill="#6366f1" name="Avg Interest Rate" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-sm">No average interest rate data available.</p>
        )}
      </div>
    </div>
  );
};

export default PortfolioComposition;