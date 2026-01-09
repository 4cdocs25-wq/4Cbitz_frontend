import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { usersAPI } from '../../api';

const ExportUsersModal = ({ isOpen, onClose }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await usersAPI.exportUsers(startDate, endDate);

      if (response.success && response.data.users) {
        const users = response.data.users;

        if (users.length === 0) {
          setError('No users found for the selected date range');
          setLoading(false);
          return;
        }

        // Prepare data for Excel
        const excelData = users.map((u, index) => ({
          'S.No': index + 1,
          'User Name': u.name || 'N/A',
          'Email': u.email || 'N/A',
          'Role': u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'N/A',
          'Subscription Status': u.hasLifetimeSubscription ? 'Lifetime Subscriber' : 'Not Subscribed',
          'Contact Number': u.contact_number || 'N/A',
          'Subscription Date': u.subscriptionDate ? formatDate(u.subscriptionDate) : 'N/A',
          'Amount Paid': u.subscriptionAmount ? `$${parseFloat(u.subscriptionAmount).toFixed(2)}` : 'N/A',
          'Joined Date': formatDate(u.created_at)
        }));

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

        // Auto-size columns
        const colWidths = [
          { wch: 6 },   // S.No
          { wch: 20 },  // User Name
          { wch: 30 },  // Email
          { wch: 10 },  // Role
          { wch: 18 },  // Subscription Status
          { wch: 18 },  // Contact Number
          { wch: 22 },  // Subscription Date
          { wch: 12 },  // Amount Paid
          { wch: 22 }   // Joined Date
        ];
        worksheet['!cols'] = colWidths;

        // Generate filename with date range
        const fileName = `users_${startDate}_to_${endDate}.xlsx`;

        // Download file
        XLSX.writeFile(workbook, fileName);

        // Close modal on success
        onClose();
        setStartDate('');
        setEndDate('');
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(err.response?.data?.message || 'Failed to export users');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStartDate('');
    setEndDate('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Export Users</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-gray-600">
              Select a date range to export users as an Excel file (filtered by join date).
            </p>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Date Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={loading || !startDate || !endDate}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportUsersModal;
