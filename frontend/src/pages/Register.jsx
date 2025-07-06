import { useState, useEffect } from 'react';
import axios from 'axios';
import AlertBox from '../components/AlertBox';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    userId: '',
    phone: '',
    department: '',
    email: '',
    password: '',
    isAdmin: false
  });
  
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const navigateToAboutPage = () => {
    navigate('/issue-history');
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        
        // Use the token in the request headers
        const res = await axios.get('https://issue-tracker-lppf.onrender.com/api/v1/departments', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true
        });
        
        console.log('Departments data:', res.data);
        if (res.data.data) {
          setDepartments(res.data.data);
        }
      } catch (e) {
        console.error('Error fetching departments:', e);
      }
    };

    fetchDepartments();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Handle form submission
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      // Only require department if user is not admin
      if (!formData.isAdmin && !formData.department) {
        AlertBox(2, "Department is required for regular users");
        setLoading(false);
        return;
      }
      
      const res = await axios.post('https://issue-tracker-lppf.onrender.com/api/v1/users/register', {
        fullName: formData.name,
        email: formData.email, 
        username: formData.userId, 
        password: formData.password, 
        department: formData.department || null, // Allow null for admin users
        phoneNumber: formData.phone,
        isAdmin: formData.isAdmin
      }, { 
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true 
      });
      
      console.log(res);
      if (res.data.statusCode === 200 || res.data.statusCode === 201) {
        console.log("Success on registration");
        AlertBox(1, `${formData.isAdmin ? "Admin" : "User"} registered successfully!!`);
        navigateToAboutPage();
      } else {
        console.log("Error on registration");
        AlertBox(2, "Registration failed!");
      }

    } catch (e) {
      console.log(e);
      AlertBox(2, e.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-8">Register New Employee</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Create a user ID"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter phone number"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={formData.isAdmin}
              >
                <option value="">Select Department</option>
                {departments && departments.map((dept, idx) => (
                  <option key={idx} value={dept.department_id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {formData.isAdmin && (
                <p className="mt-1 text-xs text-gray-500">Department not required for admin users</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter email address"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Create a password"
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
            </div>
          </div>
          
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
              Register as Administrator
            </label>
            <div className="ml-2 group relative">
              <span className="text-gray-500 cursor-help text-sm">ⓘ</span>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 mb-2 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                Admins can manage all issues, users, and departments
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-3 text-white font-medium rounded-lg shadow-md 
                ${loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transition-colors duration-300 transform hover:-translate-y-0.5'
                }`}
            >
              {loading ? 'Registering...' : formData.isAdmin ? 'Register Administrator' : 'Register Employee'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Register;