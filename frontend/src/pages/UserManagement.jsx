import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Header from './Header';
import AlertBox from '../components/AlertBox';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    department: '',
    isAdmin: false,
    password: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    setFetchLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axios.get('https://issue-tracker-lppf.onrender.com/api/v1/users', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true
      });
      
      if (response.data.data?.users) {
        setUsers(response.data.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      AlertBox(0, 'Failed to fetch users');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axios.get('https://issue-tracker-lppf.onrender.com/api/v1/departments', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true
      });
      
      if (response.data.data) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      AlertBox(0, 'Failed to fetch departments');
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    setFormData({ ...formData, [e.target.name]: value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleChangePassword = () => {
    setChangePassword(!changePassword);
    if (!changePassword) {
      setFormData({ ...formData, password: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = localStorage.getItem('accessToken');
      
      // Only require department if user is not admin
      if (!formData.isAdmin && !formData.department) {
        AlertBox(2, "Department is required for regular users");
        setLoading(false);
        return;
      }
      
      if (editMode) {
        // Prepare data for update
        const updateData = {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          department: formData.department || null, // Allow null for admin users
          isAdmin: formData.isAdmin
        };
        
        // Add password if changing it
        if (changePassword && formData.password) {
          updateData.password = formData.password;
        }
        
        // Update existing user
        await axios.put(`https://issue-tracker-lppf.onrender.com/api/v1/users/${currentUserId}`, updateData, { 
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true 
        });
        
        AlertBox(1, "User updated successfully");
      } else {
        // This form is for editing only, not creating users
        AlertBox(2, "This form is for editing users only");
        setLoading(false);
        return;
      }
      
      // Reset form and state
      resetForm();
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      AlertBox(2, error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phoneNumber: '',
      department: '',
      isAdmin: false,
      password: ''
    });
    setEditMode(false);
    setCurrentUserId(null);
    setChangePassword(false);
    setShowPassword(false);
  };

  const handleEdit = (user) => {
    setCurrentUserId(user.id);
    setFormData({
      fullName: user.full_name,
      email: user.email,
      phoneNumber: user.phone_number || '',
      department: user.department_id || '',
      isAdmin: user.is_admin,
      password: ''
    });
    setEditMode(true);
    setChangePassword(false);
    
    // Scroll to form
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleDelete = async (userId) => {
    // Get current user info from localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    // Check if user is trying to delete themselves
    if (userInfo && userInfo.id === userId) {
      AlertBox(2, "You cannot delete your own account");
      return;
    }
    
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      await axios.delete(`https://issue-tracker-lppf.onrender.com/api/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true
      });
      
      AlertBox(1, "User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      AlertBox(0, `Failed to delete user: ${error.response?.data?.message || 'Unknown error'}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto my-10 p-4">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-10">User Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* User Edit Form */}
          {editMode && (
            <div className="bg-white rounded-xl shadow-lg p-8 lg:col-span-2">
              <h2 className="text-2xl font-bold text-blue-600 mb-6">
                Edit User
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required={!formData.isAdmin}
                    disabled={formData.isAdmin}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {formData.isAdmin ? (
                    <p className="mt-1 text-xs text-gray-500">Department not required for admin users</p>
                  ) : null}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isAdmin"
                      name="isAdmin"
                      checked={formData.isAdmin}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isAdmin" className="ml-2 text-sm font-medium text-gray-700">
                      Administrator Account
                    </label>
                  </div>
                  <button 
                    type="button" 
                    onClick={toggleChangePassword}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {changePassword ? 'Cancel Password Change' : 'Change Password'}
                  </button>
                </div>
                
                {changePassword && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required={changePassword}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-10"
                      />
                      <button 
                        type="button" 
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Password should be at least 8 characters long. Include numbers and special characters for better security.
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 px-4 py-3 text-white font-medium rounded-lg shadow-md 
                      ${loading 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transition-colors'
                      }`}
                  >
                    {loading ? 'Updating...' : 'Update User'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-3 text-gray-700 font-medium rounded-lg shadow-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Users List */}
          <div className={`bg-white rounded-xl shadow-lg p-8 ${editMode ? 'lg:col-span-3' : 'lg:col-span-5'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-600">
                Users List
              </h2>
              
              <a 
                href="/register" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add New User
              </a>
            </div>
            
            {fetchLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.department_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                            {user.is_admin ? 'Administrator' : 'User'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4 bg-indigo-50 px-3 py-1 rounded-md hover:bg-indigo-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No users found. Add users using the registration form.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserManagement;