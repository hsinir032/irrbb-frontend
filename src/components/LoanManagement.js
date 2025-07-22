import React, { useState, useEffect } from 'react';

const LoanManagement = ({ BACKEND_URL, refreshDashboard }) => {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // State for adding new loan
  const [newLoan, setNewLoan] = useState({
    instrument_id: '',
    type: 'Fixed Rate Loan',
    notional: '',
    interest_rate: '',
    maturity_date: '',
    origination_date: '',
    benchmark_rate_type: '',
    spread: '',
    repricing_frequency: '',
    next_repricing_date: '',
    payment_frequency: 'Monthly'
  });
  // State for editing loan
  const [editingLoan, setEditingLoan] = useState(null); // Holds the loan object being edited
  // State for delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState(null);

  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  // Function to fetch loans from the backend
  const fetchLoans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/loans`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLoans(data);
    } catch (err) {
      console.error("Error fetching loans:", err);
      setError(`Failed to load loans: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch loans on component mount
  useEffect(() => {
    fetchLoans();
  }, []);

  // Handle changes in the "Add New Loan" form
  const handleNewLoanChange = (e) => {
    const { name, value } = e.target;
    setNewLoan(prev => ({ ...prev, [name]: value }));
  };

  // Handle changes in the "Edit Loan" form
  const handleEditingLoanChange = (e) => {
    const { name, value } = e.target;
    setEditingLoan(prev => ({ ...prev, [name]: value }));
  };

  // Handle adding a new loan
  const handleAddLoan = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    // Basic validation
    if (!newLoan.instrument_id || !newLoan.notional || !newLoan.maturity_date || !newLoan.origination_date) {
      setFormMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    try {
      const payload = {
        ...newLoan,
        notional: parseFloat(newLoan.notional),
        interest_rate: newLoan.interest_rate ? parseFloat(newLoan.interest_rate) : null,
        spread: newLoan.spread ? parseFloat(newLoan.spread) : null,
        maturity_date: newLoan.maturity_date,
        origination_date: newLoan.origination_date,
        next_repricing_date: newLoan.next_repricing_date || null
      };

      const response = await fetch(`${BACKEND_URL}/api/v1/loans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.detail || 'Unknown error'}`);
      }

      setFormMessage({ type: 'success', text: 'Loan added successfully!' });
      setNewLoan({ // Reset form
        instrument_id: '', type: 'Fixed Rate Loan', notional: '', interest_rate: '',
        maturity_date: '', origination_date: '', benchmark_rate_type: '', spread: '',
        repricing_frequency: '', next_repricing_date: '', payment_frequency: 'Monthly'
      });
      fetchLoans(); // Refresh list
      refreshDashboard(); // Refresh dashboard data
    } catch (err) {
      console.error("Error adding loan:", err);
      setFormMessage({ type: 'error', text: `Failed to add loan: ${err.message}` });
    }
  };

  // Start editing a loan
  const handleEditClick = (loan) => {
    // Pre-populate the editing form with current loan data
    setEditingLoan({
      ...loan,
      notional: loan.notional.toString(), // Convert number to string for input field
      interest_rate: loan.interest_rate?.toString() || '',
      spread: loan.spread?.toString() || '',
      maturity_date: loan.maturity_date || '',
      origination_date: loan.origination_date || '',
      next_repricing_date: loan.next_repricing_date || ''
    });
  };

  // Handle updating an existing loan
  const handleUpdateLoan = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    if (!editingLoan.instrument_id || !editingLoan.notional || !editingLoan.maturity_date || !editingLoan.origination_date) {
      setFormMessage({ type: 'error', text: 'Please fill in all required fields for update.' });
      return;
    }

    try {
      const payload = {
        ...editingLoan,
        notional: parseFloat(editingLoan.notional),
        interest_rate: editingLoan.interest_rate ? parseFloat(editingLoan.interest_rate) : null,
        spread: editingLoan.spread ? parseFloat(editingLoan.spread) : null,
        maturity_date: editingLoan.maturity_date,
        origination_date: editingLoan.origination_date,
        next_repricing_date: editingLoan.next_repricing_date || null
      };

      const response = await fetch(`${BACKEND_URL}/api/v1/loans/${editingLoan.instrument_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.detail || 'Unknown error'}`);
      }

      setFormMessage({ type: 'success', text: 'Loan updated successfully!' });
      setEditingLoan(null); // Close edit form
      fetchLoans(); // Refresh list
      refreshDashboard(); // Refresh dashboard data
    } catch (err) {
      console.error("Error updating loan:", err);
      setFormMessage({ type: 'error', text: `Failed to update loan: ${err.message}` });
    }
  };

  // Show delete confirmation modal
  const handleDeleteClick = (loan) => {
    setLoanToDelete(loan);
    setShowDeleteConfirm(true);
  };

  // Confirm and delete loan
  const confirmDeleteLoan = async () => {
    setFormMessage({ type: '', text: '' });
    setShowDeleteConfirm(false); // Close modal

    if (!loanToDelete) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/loans/${loanToDelete.instrument_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.detail || 'Unknown error'}`);
      }

      setFormMessage({ type: 'success', text: `Loan ${loanToDelete.instrument_id} deleted successfully!` });
      setLoanToDelete(null); // Clear loan to delete
      fetchLoans(); // Refresh list
      refreshDashboard(); // Refresh dashboard data
    } catch (err) {
      console.error("Error deleting loan:", err);
      setFormMessage({ type: 'error', text: `Failed to delete loan: ${err.message}` });
    }
  };

  // Cancel delete operation
  const cancelDeleteLoan = () => {
    setLoanToDelete(null);
    setShowDeleteConfirm(false);
  };


  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-4xl font-extrabold text-blue-400 mb-6">Loan Management</h1>

      {formMessage.text && (
        <div className={`p-4 mb-4 rounded-lg ${formMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {formMessage.text}
        </div>
      )}

      {/* Add New Loan Form */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl mb-8 border border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-200 mb-4">Add New Loan</h2>
        <form onSubmit={handleAddLoan} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="new_instrument_id" className="block text-gray-400 text-sm font-bold mb-2">Instrument ID:</label>
            <input type="text" name="instrument_id" id="new_instrument_id" value={newLoan.instrument_id} onChange={handleNewLoanChange} required
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
          </div>
          <div>
            <label htmlFor="new_type" className="block text-gray-400 text-sm font-bold mb-2">Type:</label>
            <select name="type" id="new_type" value={newLoan.type} onChange={handleNewLoanChange}
              className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
              <option value="Fixed Rate Loan">Fixed Rate Loan</option>
              <option value="Floating Rate Loan">Floating Rate Loan</option>
            </select>
          </div>
          <div>
            <label htmlFor="new_notional" className="block text-gray-400 text-sm font-bold mb-2">Notional:</label>
            <input type="number" name="notional" id="new_notional" value={newLoan.notional} onChange={handleNewLoanChange} required step="0.01"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
          </div>
          {newLoan.type === 'Fixed Rate Loan' && (
            <div>
              <label htmlFor="new_interest_rate" className="block text-gray-400 text-sm font-bold mb-2">Interest Rate:</label>
              <input type="number" name="interest_rate" id="new_interest_rate" value={newLoan.interest_rate} onChange={handleNewLoanChange} step="0.0001"
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
            </div>
          )}
          {newLoan.type === 'Floating Rate Loan' && (
            <>
              <div>
                <label htmlFor="new_benchmark_rate_type" className="block text-gray-400 text-sm font-bold mb-2">Benchmark Rate Type:</label>
                <select name="benchmark_rate_type" id="new_benchmark_rate_type" value={newLoan.benchmark_rate_type} onChange={handleNewLoanChange}
                  className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                  <option value="">Select</option>
                  <option value="SOFR">SOFR</option>
                  <option value="Prime">Prime</option>
                </select>
              </div>
              <div>
                <label htmlFor="new_spread" className="block text-gray-400 text-sm font-bold mb-2">Spread:</label>
                <input type="number" name="spread" id="new_spread" value={newLoan.spread} onChange={handleNewLoanChange} step="0.0001"
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
              <div>
                <label htmlFor="new_repricing_frequency" className="block text-gray-400 text-sm font-bold mb-2">Repricing Frequency:</label>
                <select name="repricing_frequency" id="new_repricing_frequency" value={newLoan.repricing_frequency} onChange={handleNewLoanChange}
                  className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                  <option value="">Select</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>
              <div>
                <label htmlFor="new_next_repricing_date" className="block text-gray-400 text-sm font-bold mb-2">Next Repricing Date:</label>
                <input type="date" name="next_repricing_date" id="new_next_repricing_date" value={newLoan.next_repricing_date} onChange={handleNewLoanChange}
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
            </>
          )}
          <div>
            <label htmlFor="new_origination_date" className="block text-gray-400 text-sm font-bold mb-2">Origination Date:</label>
            <input type="date" name="origination_date" id="new_origination_date" value={newLoan.origination_date} onChange={handleNewLoanChange} required
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
          </div>
          <div>
            <label htmlFor="new_maturity_date" className="block text-gray-400 text-sm font-bold mb-2">Maturity Date:</label>
            <input type="date" name="maturity_date" id="new_maturity_date" value={newLoan.maturity_date} onChange={handleNewLoanChange} required
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
          </div>
          <div>
            <label htmlFor="new_payment_frequency" className="block text-gray-400 text-sm font-bold mb-2">Payment Frequency:</label>
            <select name="payment_frequency" id="new_payment_frequency" value={newLoan.payment_frequency} onChange={handleNewLoanChange}
              className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Semi-Annually">Semi-Annually</option>
              <option value="Annually">Annually</option>
            </select>
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex justify-end">
            <button type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
              Add Loan
            </button>
          </div>
        </form>
      </div>

      {/* Existing Loans Table */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 overflow-x-auto table-container">
        <h2 className="text-2xl font-semibold text-gray-200 mb-4">Existing Loans</h2>
        {isLoading ? (
          <p className="text-blue-400">Loading loans...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : loans.length === 0 ? (
          <p className="text-gray-400">No loans found. Add a new loan above!</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Notional</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Int. Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Maturity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Repricing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Next Reprice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loans.map(loan => (
                <tr key={loan.id} className="hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{loan.instrument_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{loan.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{loan.notional.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{loan.interest_rate ? `${(loan.interest_rate * 100).toFixed(2)}%` : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{loan.maturity_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{loan.repricing_frequency || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{loan.next_repricing_date || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(loan)}
                      className="text-indigo-400 hover:text-indigo-600 mr-4 transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(loan)}
                      className="text-red-400 hover:text-red-600 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Loan Modal */}
      {editingLoan && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-gray-200 mb-6">Edit Loan: {editingLoan.instrument_id}</h2>
            <form onSubmit={handleUpdateLoan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit_type" className="block text-gray-400 text-sm font-bold mb-2">Type:</label>
                <select name="type" id="edit_type" value={editingLoan.type} onChange={handleEditingLoanChange}
                  className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                  <option value="Fixed Rate Loan">Fixed Rate Loan</option>
                  <option value="Floating Rate Loan">Floating Rate Loan</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit_notional" className="block text-gray-400 text-sm font-bold mb-2">Notional:</label>
                <input type="number" name="notional" id="edit_notional" value={editingLoan.notional} onChange={handleEditingLoanChange} required step="0.01"
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
              {editingLoan.type === 'Fixed Rate Loan' && (
                <div>
                  <label htmlFor="edit_interest_rate" className="block text-gray-400 text-sm font-bold mb-2">Interest Rate:</label>
                  <input type="number" name="interest_rate" id="edit_interest_rate" value={editingLoan.interest_rate} onChange={handleEditingLoanChange} step="0.0001"
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
                </div>
              )}
              {editingLoan.type === 'Floating Rate Loan' && (
                <>
                  <div>
                    <label htmlFor="edit_benchmark_rate_type" className="block text-gray-400 text-sm font-bold mb-2">Benchmark Rate Type:</label>
                    <select name="benchmark_rate_type" id="edit_benchmark_rate_type" value={editingLoan.benchmark_rate_type} onChange={handleEditingLoanChange}
                      className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                      <option value="">Select</option>
                      <option value="SOFR">SOFR</option>
                      <option value="Prime">Prime</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit_spread" className="block text-gray-400 text-sm font-bold mb-2">Spread:</label>
                    <input type="number" name="spread" id="edit_spread" value={editingLoan.spread} onChange={handleEditingLoanChange} step="0.0001"
                      className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
                  </div>
                  <div>
                    <label htmlFor="edit_repricing_frequency" className="block text-gray-400 text-sm font-bold mb-2">Repricing Frequency:</label>
                    <select name="repricing_frequency" id="edit_repricing_frequency" value={editingLoan.repricing_frequency} onChange={handleEditingLoanChange}
                      className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                      <option value="">Select</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annually">Annually</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit_next_repricing_date" className="block text-gray-400 text-sm font-bold mb-2">Next Repricing Date:</label>
                    <input type="date" name="next_repricing_date" id="edit_next_repricing_date" value={editingLoan.next_repricing_date} onChange={handleEditingLoanChange}
                      className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
                  </div>
                </>
              )}
              <div>
                <label htmlFor="edit_origination_date" className="block text-gray-400 text-sm font-bold mb-2">Origination Date:</label>
                <input type="date" name="origination_date" id="edit_origination_date" value={editingLoan.origination_date} onChange={handleEditingLoanChange} required
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
              <div>
                <label htmlFor="edit_maturity_date" className="block text-gray-400 text-sm font-bold mb-2">Maturity Date:</label>
                <input type="date" name="maturity_date" id="edit_maturity_date" value={editingLoan.maturity_date} onChange={handleEditingLoanChange} required
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
              <div>
                <label htmlFor="edit_payment_frequency" className="block text-gray-400 text-sm font-bold mb-2">Payment Frequency:</label>
                <select name="payment_frequency" id="edit_payment_frequency" value={editingLoan.payment_frequency} onChange={handleEditingLoanChange}
                  className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Semi-Annually">Semi-Annually</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end space-x-4 mt-4">
                <button type="button" onClick={() => setEditingLoan(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                  Cancel
                </button>
                <button type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                  Update Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-gray-200 mb-4">Confirm Deletion</h2>
            <p className="text-gray-300 mb-6">Are you sure you want to delete loan: <span className="font-bold text-red-400">{loanToDelete?.instrument_id}</span>?</p>
            <div className="flex justify-end space-x-4">
              <button onClick={cancelDeleteLoan}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                Cancel
              </button>
              <button onClick={confirmDeleteLoan}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;
