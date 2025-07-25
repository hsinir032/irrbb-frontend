import React, { useState, useEffect } from 'react';

const DepositManagement = ({ BACKEND_URL, refreshDashboard }) => {
  const [deposits, setDeposits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // State for adding new deposit
  const [newDeposit, setNewDeposit] = useState({
    instrument_id: '',
    type: 'Checking',
    balance: '',
    interest_rate: '',
    open_date: '',
    maturity_date: '',
    repricing_frequency: '',
    next_repricing_date: '',
    payment_frequency: 'Monthly'
  });
  // State for editing deposit
  const [editingDeposit, setEditingDeposit] = useState(null); // Holds the deposit object being edited
  // State for delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [depositToDelete, setDepositToDelete] = useState(null);

  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  // Function to fetch deposits from the backend
  const fetchDeposits = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/deposits`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDeposits(data);
    } catch (err) {
      console.error("Error fetching deposits:", err);
      setError(`Failed to load deposits: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch deposits on component mount
  useEffect(() => {
    fetchDeposits();
  }, []);

  // Handle changes in the "Add New Deposit" form
  const handleNewDepositChange = (e) => {
    const { name, value } = e.target;
    setNewDeposit(prev => ({ ...prev, [name]: value }));
  };

  // Handle changes in the "Edit Deposit" form
  const handleEditingDepositChange = (e) => {
    const { name, value } = e.target;
    setEditingDeposit(prev => ({ ...prev, [name]: value }));
  };

  // Handle adding a new deposit
  const handleAddDeposit = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    // Basic validation
    if (!newDeposit.instrument_id || !newDeposit.balance || !newDeposit.interest_rate || !newDeposit.open_date) {
      setFormMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    try {
      const payload = {
        ...newDeposit,
        balance: parseFloat(newDeposit.balance),
        interest_rate: parseFloat(newDeposit.interest_rate),
        maturity_date: newDeposit.type === 'CD' ? newDeposit.maturity_date : null,
        next_repricing_date: (newDeposit.type === 'Checking' || newDeposit.type === 'Savings') ? newDeposit.next_repricing_date : null,
        payment_frequency: newDeposit.type === 'CD' ? newDeposit.payment_frequency : null,
        repricing_frequency: (newDeposit.type === 'Checking' || newDeposit.type === 'Savings') ? newDeposit.repricing_frequency : null,
      };

      const response = await fetch(`${BACKEND_URL}/api/v1/deposits`, {
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

      setFormMessage({ type: 'success', text: 'Deposit added successfully!' });
      setNewDeposit({ // Reset form
        instrument_id: '', type: 'Checking', balance: '', interest_rate: '',
        open_date: '', maturity_date: '', repricing_frequency: '', next_repricing_date: '', payment_frequency: 'Monthly'
      });
      fetchDeposits(); // Refresh list
      refreshDashboard(); // Refresh dashboard data
    } catch (err) {
      console.error("Error adding deposit:", err);
      setFormMessage({ type: 'error', text: `Failed to add deposit: ${err.message}` });
    }
  };

  // Start editing a deposit
  const handleEditClick = (deposit) => {
    // Pre-populate the editing form with current deposit data
    setEditingDeposit({
      ...deposit,
      balance: deposit.balance.toString(),
      interest_rate: deposit.interest_rate.toString(),
      open_date: deposit.open_date || '',
      maturity_date: deposit.maturity_date || '',
      next_repricing_date: deposit.next_repricing_date || ''
    });
  };

  // Handle updating an existing deposit
  const handleUpdateDeposit = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    if (!editingDeposit.instrument_id || !editingDeposit.balance || !editingDeposit.interest_rate || !editingDeposit.open_date) {
      setFormMessage({ type: 'error', text: 'Please fill in all required fields for update.' });
      return;
    }

    try {
      const payload = {
        ...editingDeposit,
        balance: parseFloat(editingDeposit.balance),
        interest_rate: parseFloat(editingDeposit.interest_rate),
        maturity_date: editingDeposit.type === 'CD' ? editingDeposit.maturity_date : null,
        next_repricing_date: (editingDeposit.type === 'Checking' || editingDeposit.type === 'Savings') ? editingDeposit.next_repricing_date : null,
        payment_frequency: editingDeposit.type === 'CD' ? editingDeposit.payment_frequency : null,
        repricing_frequency: (editingDeposit.type === 'Checking' || editingDeposit.type === 'Savings') ? editingDeposit.repricing_frequency : null,
      };

      const response = await fetch(`${BACKEND_URL}/api/v1/deposits/${editingDeposit.instrument_id}`, {
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

      setFormMessage({ type: 'success', text: 'Deposit updated successfully!' });
      setEditingDeposit(null); // Close edit form
      fetchDeposits(); // Refresh list
      refreshDashboard(); // Refresh dashboard data
    } catch (err) {
      console.error("Error updating deposit:", err);
      setFormMessage({ type: 'error', text: `Failed to update deposit: ${err.message}` });
    }
  };

  // Show delete confirmation modal
  const handleDeleteClick = (deposit) => {
    setDepositToDelete(deposit);
    setShowDeleteConfirm(true);
  };

  // Confirm and delete deposit
  const confirmDeleteDeposit = async () => {
    setFormMessage({ type: '', text: '' });
    setShowDeleteConfirm(false); // Close modal

    if (!depositToDelete) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/deposits/${depositToDelete.instrument_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.detail || 'Unknown error'}`);
      }

      setFormMessage({ type: 'success', text: `Deposit ${depositToDelete.instrument_id} deleted successfully!` });
      setDepositToDelete(null); // Clear deposit to delete
      fetchDeposits(); // Refresh list
      refreshDashboard(); // Refresh dashboard data
    } catch (err) {
      console.error("Error deleting deposit:", err);
      setFormMessage({ type: 'error', text: `Failed to delete deposit: ${err.message}` });
    }
  };

  // Cancel delete operation
  const cancelDeleteDeposit = () => {
    setDepositToDelete(null);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-4xl font-extrabold text-green-400 mb-6">Deposit Management</h1>

      {formMessage.text && (
        <div className={`p-4 mb-4 rounded-lg ${formMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {formMessage.text}
        </div>
      )}

      {/* Add New Deposit Form */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl mb-8 border border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-200 mb-4">Add New Deposit</h2>
        <form onSubmit={handleAddDeposit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="new_instrument_id" className="block text-gray-400 text-sm font-bold mb-2">Instrument ID:</label>
            <input type="text" name="instrument_id" id="new_instrument_id" value={newDeposit.instrument_id} onChange={handleNewDepositChange} required
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
          </div>
          <div>
            <label htmlFor="new_type" className="block text-gray-400 text-sm font-bold mb-2">Type:</label>
            <select name="type" id="new_type" value={newDeposit.type} onChange={handleNewDepositChange}
              className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
              <option value="Checking">Checking</option>
              <option value="Savings">Savings</option>
              <option value="CD">CD</option>
              <option value="Wholesale Funding">Wholesale Funding</option>
              <option value="Equity">Equity</option>
            </select>
          </div>
          <div>
            <label htmlFor="new_balance" className="block text-gray-400 text-sm font-bold mb-2">Balance:</label>
            <input type="number" name="balance" id="new_balance" value={newDeposit.balance} onChange={handleNewDepositChange} required step="0.01"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
          </div>
          <div>
            <label htmlFor="new_interest_rate" className="block text-gray-400 text-sm font-bold mb-2">Interest Rate:</label>
            <input type="number" name="interest_rate" id="new_interest_rate" value={newDeposit.interest_rate} onChange={handleNewDepositChange} required step="0.0001"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
          </div>
          <div>
            <label htmlFor="new_open_date" className="block text-gray-400 text-sm font-bold mb-2">Open Date:</label>
            <input type="date" name="open_date" id="new_open_date" value={newDeposit.open_date} onChange={handleNewDepositChange} required
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
          </div>
          {newDeposit.type === 'CD' || newDeposit.type === 'Wholesale Funding' ? (
            <>
              <div>
                <label htmlFor="new_maturity_date" className="block text-gray-400 text-sm font-bold mb-2">Maturity Date:</label>
                <input type="date" name="maturity_date" id="new_maturity_date" value={newDeposit.maturity_date} onChange={handleNewDepositChange}
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
              <div>
                <label htmlFor="new_payment_frequency" className="block text-gray-400 text-sm font-bold mb-2">Payment Frequency:</label>
                <select name="payment_frequency" id="new_payment_frequency" value={newDeposit.payment_frequency} onChange={handleNewDepositChange}
                  className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Semi-Annually">Semi-Annually</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>
            </>
          ) : null}
          {(newDeposit.type === 'Checking' || newDeposit.type === 'Savings') && (
            <>
              <div>
                <label htmlFor="new_repricing_frequency" className="block text-gray-400 text-sm font-bold mb-2">Repricing Frequency:</label>
                <select name="repricing_frequency" id="new_repricing_frequency" value={newDeposit.repricing_frequency} onChange={handleNewDepositChange}
                  className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                  <option value="">Select</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>
              <div>
                <label htmlFor="new_next_repricing_date" className="block text-gray-400 text-sm font-bold mb-2">Next Repricing Date:</label>
                <input type="date" name="next_repricing_date" id="new_next_repricing_date" value={newDeposit.next_repricing_date} onChange={handleNewDepositChange}
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
            </>
          )}
          {newDeposit.type === 'Equity' && (
            <div className="col-span-full text-yellow-400 text-sm font-semibold">Note: Equity is excluded from IRRBB (NII/EVE) calculations.</div>
          )}
          <div className="md:col-span-2 lg:col-span-3 flex justify-end">
            <button type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
              Add Deposit
            </button>
          </div>
        </form>
      </div>

      {/* Existing Deposits Table */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 overflow-x-auto table-container">
        <h2 className="text-2xl font-semibold text-gray-200 mb-4">Existing Deposits</h2>
        {isLoading ? (
          <p className="text-blue-400">Loading deposits...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : deposits.length === 0 ? (
          <p className="text-gray-400">No deposits found. Add a new deposit above!</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Int. Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Maturity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Next Reprice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {deposits.map(deposit => (
                <tr key={deposit.id} className={`hover:bg-gray-700 transition-colors duration-200${deposit.type === 'Equity' ? ' bg-yellow-900' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{deposit.instrument_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{deposit.type}{deposit.type === 'Equity' && <span className="ml-2 text-yellow-400 font-semibold">(Excluded from IRRBB)</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{deposit.balance.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{`${(deposit.interest_rate * 100).toFixed(2)}%`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{deposit.maturity_date || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{deposit.next_repricing_date || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(deposit)}
                      className="text-indigo-400 hover:text-indigo-600 mr-4 transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(deposit)}
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

      {/* Edit Deposit Modal */}
      {editingDeposit && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-gray-200 mb-6">Edit Deposit: {editingDeposit.instrument_id}</h2>
            <form onSubmit={handleUpdateDeposit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit_type" className="block text-gray-400 text-sm font-bold mb-2">Type:</label>
                <select name="type" id="edit_type" value={editingDeposit.type} onChange={handleEditingDepositChange}
                  className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                  <option value="Checking">Checking</option>
                  <option value="Savings">Savings</option>
                  <option value="CD">CD</option>
                  <option value="Wholesale Funding">Wholesale Funding</option>
                  <option value="Equity">Equity</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit_balance" className="block text-gray-400 text-sm font-bold mb-2">Balance:</label>
                <input type="number" name="balance" id="edit_balance" value={editingDeposit.balance} onChange={handleEditingDepositChange} required step="0.01"
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
              <div>
                <label htmlFor="edit_interest_rate" className="block text-gray-400 text-sm font-bold mb-2">Interest Rate:</label>
                <input type="number" name="interest_rate" id="edit_interest_rate" value={editingDeposit.interest_rate} onChange={handleEditingDepositChange} required step="0.0001"
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
              <div>
                <label htmlFor="edit_open_date" className="block text-gray-400 text-sm font-bold mb-2">Open Date:</label>
                <input type="date" name="open_date" id="edit_open_date" value={editingDeposit.open_date} onChange={handleEditingDepositChange} required
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
              {editingDeposit.type === 'CD' || editingDeposit.type === 'Wholesale Funding' ? (
                <>
                  <div>
                    <label htmlFor="edit_maturity_date" className="block text-gray-400 text-sm font-bold mb-2">Maturity Date:</label>
                    <input type="date" name="maturity_date" id="edit_maturity_date" value={editingDeposit.maturity_date} onChange={handleEditingDepositChange}
                      className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
                  </div>
                  <div>
                    <label htmlFor="edit_payment_frequency" className="block text-gray-400 text-sm font-bold mb-2">Payment Frequency:</label>
                    <select name="payment_frequency" id="edit_payment_frequency" value={editingDeposit.payment_frequency} onChange={handleEditingDepositChange}
                      className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Semi-Annually">Semi-Annually</option>
                      <option value="Annually">Annually</option>
                    </select>
                  </div>
                </>
              ) : null}
              {(editingDeposit.type === 'Checking' || editingDeposit.type === 'Savings') && (
                <>
                  <div>
                    <label htmlFor="edit_repricing_frequency" className="block text-gray-400 text-sm font-bold mb-2">Repricing Frequency:</label>
                    <select name="repricing_frequency" id="edit_repricing_frequency" value={editingDeposit.repricing_frequency} onChange={handleEditingDepositChange}
                      className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                      <option value="">Select</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annually">Annually</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit_next_repricing_date" className="block text-gray-400 text-sm font-bold mb-2">Next Repricing Date:</label>
                    <input type="date" name="next_repricing_date" id="edit_next_repricing_date" value={editingDeposit.next_repricing_date} onChange={handleEditingDepositChange}
                      className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
                  </div>
                </>
              )}
              {editingDeposit.type === 'Equity' && (
                <div className="col-span-full text-yellow-400 text-sm font-semibold">Note: Equity is excluded from IRRBB (NII/EVE) calculations.</div>
              )}
              <div className="md:col-span-2 flex justify-end space-x-4 mt-4">
                <button type="button" onClick={() => setEditingDeposit(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                  Cancel
                </button>
                <button type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                  Update Deposit
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
            <p className="text-gray-300 mb-6">Are you sure you want to delete deposit: <span className="font-bold text-red-400">{depositToDelete?.instrument_id}</span>?</p>
            <div className="flex justify-end space-x-4">
              <button onClick={cancelDeleteDeposit}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                Cancel
              </button>
              <button onClick={confirmDeleteDeposit}
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

export default DepositManagement;
