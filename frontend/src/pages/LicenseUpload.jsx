import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Header from './Header';

const LicenseUpload = () => {
    const [file, setFile] = useState(null);
    const [expiryDate, setExpiryDate] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [licenses, setLicenses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

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
            
            const res = await axios.get('https://issue-tracker-lppf.onrender.com/api/v1/licenses/all', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                withCredentials: true
            });
            setLicenses(res.data.data);
        } catch (error) {
            console.error('Error fetching licenses:', error);
            toast.error('Failed to fetch licenses');
        }
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

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Handle drop event
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            setFile(droppedFile);
        }
    };

    // Trigger file input click
    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    // Handle file input change
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        
        if (!file || !expiryDate || !departmentId) {
            toast.error('All fields are required');
            return;
        }
        
        // Validate file type
        if (!file.type.match(/^(application\/pdf|image\/png)$/)) {
            toast.error('Only PDF and PNG files are allowed');
            return;
        }
        
        setLoading(true);
        
        try {
            // Convert file to base64
            const base64Data = await convertFileToBase64(file);
            
            // Get access token from localStorage
            const accessToken = localStorage.getItem('accessToken');
            
            // Prepare request data
            const requestData = {
                expiry_date: expiryDate,
                department_id: departmentId,
                file: {
                    name: file.name,
                    type: file.type,
                    data: base64Data
                }
            };
            
            // Send request to API with Authorization header
            await axios.post('https://issue-tracker-lppf.onrender.com/api/v1/licenses/upload', requestData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                withCredentials: true
            });
            
            toast.success('License uploaded successfully');
            
            // Reset form
            setFile(null);
            setExpiryDate('');
            setDepartmentId('');
            
            // Refresh licenses list
            fetchLicenses();
        } catch (error) {
            console.error('Error uploading license:', error);
            toast.error('Upload failed: ' + (error.response?.data?.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    // Find department name by ID - no longer needed as backend returns department_name directly
    const getDepartmentDisplay = (license) => {
        return license.department_name || getDepartmentNameById(license.department_id);
    };

    // Keep the getDepartmentNameById as fallback in case department_name is not available
    const getDepartmentNameById = (id) => {
        const department = departments.find(dep => dep.department_id.toString() === id.toString());
        return department ? department.name : id;
    };

    // Function to create a view URL with the auth token
    const getLicenseViewUrl = (licenseId) => {
        // Instead of using query param, we'll open the link in a new tab where we can
        // set the Authorization header programmatically
        return `/license-viewer.html?id=${licenseId}`;
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

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-2xl font-semibold text-center mb-6">Upload License</h2>
                        <form onSubmit={handleUpload} className="max-w-xl mx-auto space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    License File (PDF or PNG only)
                                </label>
                                <div 
                                    className={`relative w-full h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer ${
                                        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                                    }`}
                                    onDragEnter={handleDrag}
                                    onDragOver={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={handleButtonClick}
                                >
                                    <input 
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.png"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        required={!file}
                                    />
                                    
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    
                                    {file ? (
                                        <p className="mt-2 text-sm text-gray-700 font-medium">
                                            Selected: {file.name}
                                        </p>
                                    ) : (
                                        <>
                                            <p className="mt-2 text-sm text-gray-700 font-medium">
                                                Drag & Drop your file here
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                or click to browse files
                                            </p>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Only PDF and PNG files are accepted
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Expiry Date
                                </label>
                                <input
                                    type="date"
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    value={expiryDate}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department
                                </label>
                                <select
                                    onChange={(e) => setDepartmentId(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    value={departmentId}
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
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full px-4 py-2 text-white font-medium rounded-md shadow-sm ${
                                    loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                }`}
                            >
                                {loading ? 'Uploading...' : 'Upload License'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-semibold text-center mb-6">Recent Licenses</h2>
                        {licenses.length === 0 ? (
                            <p className="text-center text-gray-500 text-lg">No licenses uploaded yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm md:text-base">
                                    <thead>
                                        <tr className="bg-blue-50 text-gray-700">
                                            <th className="px-4 py-3 text-left">File Name</th>
                                            <th className="px-4 py-3 text-left">Expiry Date</th>
                                            <th className="px-4 py-3 text-left">Department</th>
                                            <th className="px-4 py-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {licenses.slice(0, 5).map((license) => (
                                            <tr key={license.id} className="border-t border-gray-200 hover:bg-gray-50">
                                                <td className="px-4 py-3">{license.file_name}</td>
                                                <td className="px-4 py-3">{license.expiry_date}</td>
                                                <td className="px-4 py-3">{getDepartmentDisplay(license)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex justify-center space-x-2">
                                                        <button
                                                            onClick={() => openLicenseViewer(license.id)}
                                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        >
                                                            View
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {licenses.length > 5 && (
                                    <div className="mt-4 text-center">
                                        <a 
                                            href="/all-licenses" 
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            View All Licenses
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default LicenseUpload;
