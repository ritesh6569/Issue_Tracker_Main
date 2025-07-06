import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Header from './Header';

const ExpiringLicenses = () => {
    const [licenses, setLicenses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [formData, setFormData] = useState({
        expiry_date: '',
        department_id: '',
        file: null,
    });

    useEffect(() => {
        fetchLicenses();
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            
            const res = await axios.get('https://issue-tracker-lppf.onrender.com/api/v1/departments', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                withCredentials: true
            });
            
            setDepartments(res.data.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('Failed to fetch departments');
        }
    };

    const fetchLicenses = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            
            const response = await axios.get('https://issue-tracker-lppf.onrender.com/api/v1/licenses/expiring', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                withCredentials: true
            });
            setLicenses(response.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch expiring licenses');
        }
    };

    const handleEdit = (license) => {
        setEditId(license.id);
        setFormData({
            expiry_date: license.expiry_date.split('-').reverse().join('-'), // Convert DD-MM-YYYY to YYYY-MM-DD for input
            department_id: license.department_id,
            file: null, // Reset file
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    };

    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result;
                // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
                const base64Data = base64String.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleUpdate = async (id) => {
        setLoading(true);
        
        try {
            const accessToken = localStorage.getItem('accessToken');
            
            const requestData = {
                expiry_date: formData.expiry_date,
                department_id: formData.department_id
            };
            
            // If a new file is uploaded, convert it to base64 and add to request
            if (formData.file) {
                // Validate file type
                if (!formData.file.type.match(/^(application\/pdf|image\/png)$/)) {
                    toast.error('Only PDF and PNG files are allowed');
                    setLoading(false);
                    return;
                }
                
                const base64Data = await convertFileToBase64(formData.file);
                requestData.file = {
                    name: formData.file.name,
                    type: formData.file.type,
                    data: base64Data
                };
            }
            
            // Send request to update license with Authorization header
            await axios.put(`https://issue-tracker-lppf.onrender.com/api/v1/licenses/${id}`, requestData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                withCredentials: true
            });
            
            toast.success('License updated successfully');
            fetchLicenses();
            setEditId(null);
        } catch (error) {
            console.error('Error updating license:', error);
            toast.error('Update failed: ' + (error.response?.data?.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    // Function to handle license deletion
    const deleteLicense = async (licenseId) => {
        if (!confirm('Are you sure you want to delete this license?')) {
            return;
        }
        
        setDeleteLoading(true);
        
        try {
            const accessToken = localStorage.getItem('accessToken');
            
            await axios.delete(`https://issue-tracker-lppf.onrender.com/api/v1/licenses/${licenseId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                withCredentials: true
            });
            
            toast.success('License deleted successfully');
            
            // Update licenses list after deletion
            fetchLicenses();
        } catch (error) {
            console.error('Error deleting license:', error);
            toast.error('Failed to delete license: ' + (error.response?.data?.message || 'Unknown error'));
        } finally {
            setDeleteLoading(false);
        }
    };

    // Find department name by ID - use department_name from backend if available
    const getDepartmentDisplay = (license) => {
        return license.department_name || getDepartmentNameById(license.department_id);
    };
    
    // Keep the getDepartmentNameById as fallback in case department_name is not available
    const getDepartmentNameById = (id) => {
        const department = departments.find(dep => dep.department_id.toString() === id.toString());
        return department ? department.name : id;
    };

    // Function to open license in a new tab with proper headers
    const openLicenseViewer = (licenseId) => {
        const accessToken = localStorage.getItem('accessToken');
        // Open in a new window and set auth header there
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(`
                <html>
                <head>
                    <title>License Viewer</title>
                    <script>
                        window.onload = function() {
                            const iframe = document.createElement('iframe');
                            iframe.style.width = '100%';
                            iframe.style.height = '100vh';
                            iframe.style.border = 'none';
                            
                            // Create a fetch request with the proper auth header
                            fetch(\`https://issue-tracker-lppf.onrender.com/api/v1/licenses/${licenseId}\`, {
                                headers: {
                                    'Authorization': \`Bearer ${accessToken}\`
                                }
                            })
                            .then(response => {
                                if (!response.ok) throw new Error('Failed to load license');
                                return response.blob();
                            })
                            .then(blob => {
                                // Create object URL and set as iframe src
                                const url = URL.createObjectURL(blob);
                                iframe.src = url;
                                document.body.appendChild(iframe);
                                // Remove loading message once the iframe is added
                                document.querySelector('h3').remove();
                            })
                            .catch(error => {
                                document.body.innerHTML = '<h1>Error loading license: ' + error.message + '</h1>';
                            });
                        };
                    </script>
                </head>
                <body style="margin:0; padding:0;">
                    <h3 style="text-align:center; margin:20px 0;">Loading license...</h3>
                </body>
                </html>
            `);
            newWindow.document.close();
        }
    };

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-2xl font-semibold text-center mb-6">Expiring Licenses</h2>

                    {licenses.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-6 text-center">
                            <p className="text-gray-500 text-lg">No licenses expiring soon.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm md:text-base">
                                    <thead>
                                        <tr className="bg-blue-50 text-gray-700">
                                            <th className="px-4 py-3 text-left">File Name</th>
                                            <th className="px-4 py-3 text-left">Expiry Date</th>
                                            <th className="px-4 py-3 text-left">Department</th>
                                            <th className="px-4 py-3 text-center">View Document</th>
                                            <th className="px-4 py-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {licenses.map((license) => (
                                            <tr key={license.id} className="border-t border-gray-200 hover:bg-gray-50">
                                                {editId === license.id ? (
                                                    <>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.png"
                                                                onChange={handleFileChange}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="date"
                                                                name="expiry_date"
                                                                value={formData.expiry_date}
                                                                onChange={handleChange}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select
                                                                name="department_id"
                                                                value={formData.department_id}
                                                                onChange={handleChange}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                            >
                                                                <option value="">Select Department</option>
                                                                {departments.map((department) => (
                                                                    <option 
                                                                        key={department.department_id} 
                                                                        value={department.department_id}
                                                                    >
                                                                        {department.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-gray-400">—</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex justify-center space-x-2">
                                                                <button
                                                                    onClick={() => handleUpdate(license.id)}
                                                                    disabled={loading}
                                                                    className={`px-3 py-1 rounded ${
                                                                        loading 
                                                                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                                                                        : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                                                                    }`}
                                                                >
                                                                    {loading ? 'Saving...' : 'Save'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditId(null)}
                                                                    className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                                                    disabled={loading}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-4 py-3">{license.file_name}</td>
                                                        <td className="px-4 py-3">{license.expiry_date}</td>
                                                        <td className="px-4 py-3">{getDepartmentDisplay(license)}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => openLicenseViewer(license.id)}
                                                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            >
                                                                View
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex justify-center space-x-2">
                                                                <button
                                                                    onClick={() => handleEdit(license)}
                                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteLicense(license.id)}
                                                                    disabled={deleteLoading}
                                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ExpiringLicenses;
