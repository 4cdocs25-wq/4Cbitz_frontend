import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../api';
import UsersList from '../../components/admin/UsersList';

const UsersManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    hasMore: true
  });

  useEffect(() => {
    fetchUsers(true); // true = reset users
  }, [filters]);

  const fetchUsers = async (reset = false) => {
    try {
      setLoading(true);
      const offset = reset ? 0 : pagination.offset;

      const response = await usersAPI.getAllUsers({
        limit: pagination.limit,
        offset,
        ...filters
      });

      if (response.success) {
        const newUsers = response.data.users;

        if (reset) {
          setUsers(newUsers);
          setPagination({ ...pagination, offset: newUsers.length });
        } else {
          setUsers([...users, ...newUsers]);
          setPagination({ ...pagination, offset: pagination.offset + newUsers.length });
        }

        // Check if there are more users to load
        if (newUsers.length < pagination.limit) {
          setPagination(prev => ({ ...prev, hasMore: false }));
        } else {
          setPagination(prev => ({ ...prev, hasMore: true }));
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination({ ...pagination, offset: 0, hasMore: true });
  };

  const handleSearchChange = (e) => {
    handleFilterChange('search', e.target.value);
  };

  const handleLoadMore = () => {
    fetchUsers(false);
  };

  // Calculate stats from users
  const stats = {
    totalUsers: users.length,
    subscribedUsers: users.filter(u => u.hasLifetimeSubscription).length,
    freeUsers: users.filter(u => !u.hasLifetimeSubscription).length
  };

  return (
    <div className="py-8 px-4 md:px-8">
        <div>
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
            <p className="mt-2 text-gray-600">View and manage all registered users</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Subscribed Users */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Subscribed Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stats.subscribedUsers}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Free Users */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Free Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stats.freeUsers}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search and Filter Users</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={handleSearchChange}
                    placeholder="Search by email or name..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <svg
                    className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Users List - Outside max-w-7xl */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
            <p className="text-sm text-gray-600 mt-1">View all registered users and their subscription status</p>
          </div>

          <UsersList
            users={users}
            loading={loading}
            hasMore={pagination.hasMore}
            onLoadMore={handleLoadMore}
          />
        </div>
      </div>
  );
};

export default UsersManagementPage;
