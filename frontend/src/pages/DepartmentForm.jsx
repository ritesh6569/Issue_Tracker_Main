import React, { useState, useEffect } from "react";
import axios from "axios";
import AlertBox from '../components/AlertBox';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

const DepartmentForm = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentDepartmentId, setCurrentDepartmentId] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setFetchLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axios.get("https://issue-tracker-lppf.onrender.com/api/v1/departments", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true
      });
      
      if (response.data.data) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      AlertBox(0, "Failed to fetch departments");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = localStorage.getItem('accessToken');
      
      if (editMode) {
        // Update existing department
        await axios.put(`https://issue-tracker-lppf.onrender.com/api/v1/departments/${currentDepartmentId}`, 
          {
            name,
            type,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true
          }
        );
        
        AlertBox(1, "Department updated successfully");
      } else {
        // Add new department
        await axios.post("https://issue-tracker-lppf.onrender.com/api/v1/departments", 
          {
            name,
            type,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true
          }
        );
        
        AlertBox(1, "Department added successfully");
      }
      
      // Reset form fields
      setName("");
      setType("");
      setEditMode(false);
      setCurrentDepartmentId(null);
      
      // Refresh departments list
      fetchDepartments();
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'adding'} department:`, error);
      AlertBox(0, `Failed to ${editMode ? 'update' : 'add'} department: ${error.response?.data?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (department) => {
    setEditMode(true);
    setCurrentDepartmentId(department.department_id);
    setName(department.name);
    setType(department.type || "Regular"); // Default to Regular if type is not set
    
    // Scroll to form
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleDelete = async (departmentId) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      await axios.delete(`https://issue-tracker-lppf.onrender.com/api/v1/departments/${departmentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true
      });
      
      AlertBox(1, "Department deleted successfully");
      fetchDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
      AlertBox(0, `Failed to delete department: ${error.response?.data?.message || 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    setName("");
    setType("");
    setEditMode(false);
    setCurrentDepartmentId(null);
  };

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto my-10 p-4">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-10">Department Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Department Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-blue-600 mb-6">
              {editMode ? 'Edit Department' : 'Add Department'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter department name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Department Type
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="" disabled>Select department type</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Regular">Regular</option>
                </select>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-4 py-3 text-white font-medium rounded-lg shadow-md 
                    ${loading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transition-colors'
                    }`}
                >
                  {loading ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Department' : 'Add Department')}
                </button>
                
                {editMode && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-3 text-gray-700 font-medium rounded-lg shadow-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          
          {/* Departments List */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-blue-600 mb-6">
              Departments List
            </h2>
            
            {fetchLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : departments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {departments.map((department) => (
                      <tr key={department.department_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {department.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {department.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(department)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(department.department_id)}
                            className="text-red-600 hover:text-red-900"
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
                No departments found. Create your first department using the form.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DepartmentForm;
