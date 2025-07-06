import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import { toast } from 'react-toastify';
import AlertBox from '../components/AlertBox';

function IssueForm() {
  const [formData, setFormData] = useState({
    issue: '',
    description: '',
    address: '',
    requireDepartment: '',
  });

  const [departments, setDeparments] = useState([{}]);
  const [loading, setLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState(null);

  const navigateToAboutPage = () => {
    window.location.href = '/issue-history';
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear warning when user changes the department
    if (e.target.name === 'requireDepartment') {
      setWarningMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setWarningMessage(null);

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      toast.error('Authentication error: Please log in again');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('https://issue-tracker-lppf.onrender.com/api/v1/raise-issue',
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      // Check if there's a warning message in the response
      if (response.data?.data?.warning) {
        setWarningMessage(response.data.data.warning);
        toast.warning('Issue created with a warning');
        // Reset form after successful submission with warning
        setFormData({
          issue: '',
          description: '',
          address: '',
          requireDepartment: '',
        });
      } else {
        toast.success('Issue submitted successfully!');
        navigateToAboutPage();
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      
      // Extract error message from response or use a generic message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to submit issue. Please try again later.';
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        toast.error('Authentication error: Please log in again');
        return;
      }

      try {
        const response = await axios.get('https://issue-tracker-lppf.onrender.com/api/v1/department-names',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          }
        );
        
        setDeparments(response.data.data.departments);
      } catch (error) {
        console.error('Error fetching departments:', error);
        const errorMessage = error.response?.data?.message || 
                            'Failed to load departments. Please refresh the page.';
        toast.error(errorMessage);
      }
    };

    fetchDepartments();
  }, []);

  return (
    <>
      <Header />
      
      <div className="max-w-xl mx-auto my-10 p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Report an Issue</h2>
        
        {warningMessage && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{warningMessage}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={navigateToAboutPage}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                View Issue History
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-1">
              Issue Title
            </label>
            <input
              type="text"
              id="issue"
              name="issue"
              value={formData.issue}
              onChange={handleChange}
              required
              placeholder="Enter a brief title for the issue"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Provide details about the issue"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Location/Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="Where is the issue located?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div>
            <label htmlFor="requireDepartment" className="block text-sm font-medium text-gray-700 mb-1">
              Required Department
            </label>
            <select
              id="requireDepartment"
              name="requireDepartment"
              value={formData.requireDepartment}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select Department</option>
              {departments.length > 0 ? (
                departments.map((department, index) => (
                  <option key={index} value={department.name}>
                    {department.name}
                  </option>
                ))
              ) : (
                <option disabled>Loading departments...</option>
              )}
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-3 text-white font-medium rounded-lg shadow-md 
              ${loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transition-colors duration-300 transform hover:-translate-y-0.5'
              }`}
          >
            {loading ? 'Submitting...' : 'Submit Issue'}
          </button>
        </form>
      </div>
    </>
  );
};

export default IssueForm;
