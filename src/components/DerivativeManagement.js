import React, { useState, useEffect } from 'react';

const DerivativeManagement = ({ BACKEND_URL, refreshDashboard }) => {
  const [derivatives, setDerivatives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // State for adding new derivative
  const [newDerivative, setNewDerivative] = useState({
    instrument_id: '',
    type: 'Interest Rate Swap',
    subtype: 'Payer Swap',
    notional: '',
    start_date: '',
    end_date: '',
    fixed_rate: '',
    floating_rate_index: '',
    floating_spread: '',
    fixed_payment_frequency: 'Quarterly',
    floating_payment_frequency: 'Monthly'
  });
  // State for editing derivative
  const [editingDerivative, setEditingDerivative] = useState(null); // Holds the derivative object being edited
  // State for delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [derivativeToDelete, setDerivativeToDelete] = useState(null);

  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  // Function to fetch derivatives from the backend
  const fetchDerivatives = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/derivatives`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDerivatives(data);
    } catch (err) {
      console.error("Error fetching derivatives:", err);
      setError(`Failed to load derivatives: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch derivatives on component mount
  useEffect(() => {
    fetchDerivatives();
  }, []);

  // Handle changes in the "Add New Derivative" form
  const handleNewDerivativeChange = (e) => {
    const { name, value } = e.target;
    setNewDerivative(prev => ({ ...prev, [name]: value }));
  };

  // Handle changes in the "Edit Derivative" form
  const handleEditingDerivativeChange = (e) => {
    const { name, value } = e.target;
    setEditingDerivative(prev => ({ ...prev, [name]: value }));
  };

  // Handle adding a new derivative
  const handleAddDerivative = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    // Basic validation
    if (!newDerivative.instrument_id || !newDerivative.notional || !newDerivative.start_date || !newDerivative.end_date) {
      setFormMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    try {
      const payload = {
        ...newDerivative,
        notional: parseFloat(newDerivative.notional),
        fixed_rate: newDerivative.fixed_rate ? parseFloat(newDerivative.fixed_rate) : null,
        floating_spread: newDerivative.floating_spread ? parseFloat(newDerivative.floating_spread) : null,
        start_date: newDerivative.start_date,
        end_date: newDerivative.end_date,
      };

      const response = await fetch(`${BACKEND_URL}/api/v1/derivatives`, {
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

      setFormMessage({ type: 'success', text: 'Derivative added successfully!' });
      setNewDerivative({ // Reset form
        instrument_id: '', type: 'Interest Rate Swap', subtype: 'Payer Swap', notional: '',
        start_date: '', end_date: '', fixed_rate: '', floating_rate_index: '',
        floating_spread: '', fixed_payment_frequency: 'Quarterly', floating_payment_frequency: 'Monthly'
      });
      fetchDerivatives(); // Refresh list
      refreshDashboard(); // Refresh dashboard data
    } catch (err) {
      console.error("Error adding derivative:", err);
      setFormMessage({ type: 'error', text: `Failed to add derivative: ${err.message}` });
    }
  };

  // Start editing a derivative
  const handleEditClick = (derivative) => {
    // Pre-populate the editing form with current derivative data
    setEditingDerivative({
      ...derivative,
      notional: derivative.notional.toString(),
      fixed_rate: derivative.fixed_rate?.toString() || '',
      floating_spread: derivative.floating_spread?.toString() || '',
      start_date: derivative.start_date || '',
      end_date: derivative.end_date || ''
    });
  };

  // Handle updating an existing derivative
  const handleUpdateDerivative = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    if (!editingDerivative.instrument_id || !editingDerivative.notional || !editingDerivative.start_date || !editingDerivative.end_date) {
      setFormMessage({ type: 'error', text: 'Please fill in all required fields for update.' });
      return;
    }

    try {
      const payload = {
        ...editingDerivative,
        notional: parseFloat(editingDerivative.notional),
        fixed_rate: editingDerivative.fixed_rate ? parseFloat(editingDerivative.fixed_rate) : null,
        floating_spread: editingDerivative.floating_spread ? parseFloat(editingDerivative.floating_spread) : null,
        start_date: editingDerivative.start_date,
        end_date: editingDerivative.end_date,
      };

      const response = await fetch(`${BACKEND_URL}/api/v1/derivatives/${editingDerivative.instrument_id}`, {
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

      setFormMessage({ type: 'success', text: 'Derivative updated successfully!' });
      setEditingDerivative(null); // Close edit form
      fetchDerivatives(); // Refresh list
      refreshDashboard(); // Refresh dashboard data
    } catch (err) {
      console.error("Error updating derivative:", err);
      setFormMessage({ type: 'error', text: `Failed to update derivative: ${err.message}` });
    }
  };

  // Show delete confirmation modal
  const handleDeleteClick = (derivative) => {
    setDerivativeToDelete(derivative);
    setShowDeleteConfirm(true);
  };

  // Confirm and delete derivative
  const confirmDeleteDerivative = async () => {
    setFormMessage({ type: '', text: '' });
    setShowDeleteConfirm(false); // Close modal

    if (!derivativeToDelete) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/derivatives/${derivativeToDelete.instrument_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.detail || 'Unknown error'}`);
      }

      setFormMessage({ type: 'success', text: `Derivative ${derivativeToDelete.instrument_id} deleted successfully!` });
      setDerivativeToDelete(null); // Clear derivative to delete
      fetchDerivatives(); // Refresh list
      refreshDashboard(); // Refresh dashboard data
    } catch (err) {
      console.error("Error deleting derivative:", err);
      setFormMessage({ type: 'error', text: `Failed to delete derivative: ${err.message}` });
    }
  };

  // Cancel delete operation
  const cancelDeleteDerivative = () => {
    setDerivativeToDelete(null);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-4xl font-extrabold text-purple-400 mb-6">Derivative Management</h1>

      {formMessage.text && (
        <div className={`p-4 mb-4 rounded-lg ${formMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {formMessage.text}
        </div>
      )}

      {/* Add New Derivative Form */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl mb-8 border border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-200 mb-4">Add New Derivative (Interest Rate Swap)</h2>
        <form onSubmit={handleAddDerivative} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="new_instrument_id" className="block text-gray-400 text-sm font-bold mb-2">Instrument ID:</label>
            <input type="text" name="instrument_id" id="new_instrument_id" value={newDerivative.instrument_id} onChange={handleNewDerivativeChange} required
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
          </div>
          <div>
            <label htmlFor="new_type" className="block text-gray-400 text-sm font-bold mb-2">Type:</label>
            <input type="text" name="type" id="new_type" value={newDerivative.type} readOnly
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 cursor-not-allowed" />
          </div>
          <div>
            <label htmlFor="new_subtype" className="block text-gray-400 text-sm font-bold mb-2">Subtype:</label>
            <select name="subtype" id="new_subtype" value={newDerivative.subtype} onChange={handleNewDerivativeChange}
              className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
              <option value="Payer Swap">Payer Swap (Bank Pays Fixed)</option>
              <option value="Receiver Swap">Receiver Swap (Bank Receives Fixed)</option>
            </select>
          </div>
          <div>
            <label htmlFor="new_notional" className="block text-gray-400 text-sm font-bold mb-2">Notional:</label>
            <input type="number" name="notional" id="new_notional" value={newDerivative.notional} onChange={handleNewDerivativeChange} required step="0.01"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
          </div>
          <div>
            <label htmlFor="new_start_date" className="block text-gray-400 text-sm font-bold mb-2">Start Date:</label>
            <input type="date" name="start_date" id="new_start_date" value={newDerivative.start_date} onChange={handleNewDerivativeChange} required
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
          </div>
          <div>
            <label htmlFor="new_end_date" className="block text-gray-400 text-sm font-bold mb-2">End Date:</label>
            <input type="date" name="end_date" id="new_end_date" value={newDerivative.end_date} onChange={handleNewDerivativeChange} required
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
          </div>
          <div>
            <label htmlFor="new_fixed_rate" className="block text-gray-400 text-sm font-bold mb-2">Fixed Rate:</label>
            <input type="number" name="fixed_rate" id="new_fixed_rate" value={newDerivative.fixed_rate} onChange={handleNewDerivativeChange} step="0.0001"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
          </div>
          <div>
            <label htmlFor="new_floating_rate_index" className="block text-gray-400 text-sm font-bold mb-2">Floating Rate Index:</label>
            <select name="floating_rate_index" id="new_floating_rate_index" value={newDerivative.floating_rate_index} onChange={handleNewDerivativeChange}
              className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
              <option value="">Select</option>
              <option value="SOFR">SOFR</option>
              <option value="LIBOR">LIBOR</option>
            </select>
          </div>
          <div>
            <label htmlFor="new_floating_spread" className="block text-gray-400 text-sm font-bold mb-2">Floating Spread:</label>
            <input type="number" name="floating_spread" id="new_floating_spread" value={newDerivative.floating_spread} onChange={handleNewDerivativeChange} step="0.0001"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
          </div>
          <div>
            <label htmlFor="new_fixed_payment_frequency" className="block text-gray-400 text-sm font-bold mb-2">Fixed Payment Frequency:</label>
            <select name="fixed_payment_frequency" id="new_fixed_payment_frequency" value={newDerivative.fixed_payment_frequency} onChange={handleNewDerivativeChange}
              className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Semi-Annually">Semi-Annually</option>
              <option value="Annually">Annually</option>
            </select>
          </div>
          <div>
            <label htmlFor="new_floating_payment_frequency" className="block text-gray-400 text-sm font-bold mb-2">Floating Payment Frequency:</label>
            <select name="floating_payment_frequency" id="new_floating_payment_frequency" value={newDerivative.floating_payment_frequency} onChange={handleNewDerivativeChange}
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
              Add Derivative
            </button>
          </div>
        </form>
      </div>

      {/* Existing Derivatives Table */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 overflow-x-auto table-container">
        <h2 className="text-2xl font-semibold text-gray-200 mb-4">Existing Derivatives</h2>
        {isLoading ? (
          <p className="text-blue-400">Loading derivatives...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : derivatives.length === 0 ? (
          <p className="text-gray-400">No derivatives found. Add a new derivative above!</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subtype</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Notional</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fixed Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Float Index</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {derivatives.map(derivative => (
                <tr key={derivative.id} className="hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{derivative.instrument_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{derivative.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{derivative.subtype}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{derivative.notional.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{derivative.start_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{derivative.end_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{derivative.fixed_rate ? `${(derivative.fixed_rate * 100).toFixed(2)}%` : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{derivative.floating_rate_index || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(derivative)}
                      className="text-indigo-400 hover:text-indigo-600 mr-4 transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(derivative)}
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

      {/* Edit Derivative Modal */}
      {editingDerivative && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-gray-200 mb-6">Edit Derivative: {editingDerivative.instrument_id}</h2>
            <form onSubmit={handleUpdateDerivative} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit_type" className="block text-gray-400 text-sm font-bold mb-2">Type:</label>
                <input type="text" name="type" id="edit_type" value={editingDerivative.type} readOnly
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 cursor-not-allowed" />
              </div>
              <div>
                <label htmlFor="edit_subtype" className="block text-gray-400 text-sm font-bold mb-2">Subtype:</label>
                <select name="subtype" id="edit_subtype" value={editingDerivative.subtype} onChange={handleEditingDerivativeChange}
                  className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                  <option value="Payer Swap">Payer Swap (Bank Pays Fixed)</option>
                  <option value="Receiver Swap">Receiver Swap (Bank Receives Fixed)</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit_notional" className="block text-gray-400 text-sm font-bold mb-2">Notional:</label>
                <input type="number" name="notional" id="edit_notional" value={editingDerivative.notional} onChange={handleEditingDerivativeChange} required step="0.01"
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
              <div>
                <label htmlFor="edit_start_date" className="block text-gray-400 text-sm font-bold mb-2">Start Date:</label>
                <input type="date" name="start_date" id="edit_start_date" value={editingDerivative.start_date} onChange={handleEditingDerivativeChange} required
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
              <div>
                <label htmlFor="edit_end_date" className="block text-gray-400 text-sm font-bold mb-2">End Date:</label>
                <input type="date" name="end_date" id="edit_end_date" value={editingDerivative.end_date} onChange={handleEditingDerivativeChange} required
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
              <div>
                <label htmlFor="edit_fixed_rate" className="block text-gray-400 text-sm font-bold mb-2">Fixed Rate:</label>
                <input type="number" name="fixed_rate" id="edit_fixed_rate" value={editingDerivative.fixed_rate} onChange={handleEditingDerivativeChange} step="0.0001"
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
              <div>
                <label htmlFor="edit_floating_rate_index" className="block text-gray-400 text-sm font-bold mb-2">Floating Rate Index:</label>
                <select name="floating_rate_index" id="edit_floating_rate_index" value={editingDerivative.floating_rate_index} onChange={handleEditingDerivativeChange}
                  className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                  <option value="">Select</option>
                  <option value="SOFR">SOFR</option>
                  <option value="LIBOR">LIBOR</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit_floating_spread" className="block text-gray-400 text-sm font-bold mb-2">Floating Spread:</label>
                <input type="number" name="floating_spread" id="edit_floating_spread" value={editingDerivative.floating_spread} onChange={handleEditingDerivativeChange} step="0.0001"
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" />
              </div>
              <div>
                <label htmlFor="edit_fixed_payment_frequency" className="block text-gray-400 text-sm font-bold mb-2">Fixed Payment Frequency:</label>
                <select name="fixed_payment_frequency" id="edit_fixed_payment_frequency" value={editingDerivative.fixed_payment_frequency} onChange={handleEditingDerivativeChange}
                  className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Semi-Annually">Semi-Annually</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit_floating_payment_frequency" className="block text-gray-400 text-sm font-bold mb-2">Floating Payment Frequency:</label>
                <select name="floating_payment_frequency" id="edit_floating_payment_frequency" value={editingDerivative.floating_payment_frequency} onChange={handleEditingDerivativeChange}
                  className="shadow border rounded-lg w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Semi-Annually">Semi-Annually</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end space-x-4 mt-4">
                <button type="button" onClick={() => setEditingDerivative(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                  Cancel
                </button>
                <button type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                  Update Derivative
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
            <p className="text-gray-300 mb-6">Are you sure you want to delete derivative: <span className="font-bold text-red-400">{derivativeToDelete?.instrument_id}</span>?</p>
            <div className="flex justify-end space-x-4">
              <button onClick={cancelDeleteDerivative}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200">
                Cancel
              </button>
              <button onClick={confirmDeleteDerivative}
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

export default DerivativeManagement;
