import IssueForm from "./pages/IssueForm";
import History from "./pages/History";
import LoginForm from "./pages/LoginForm";
import Register from "./pages/Register";
import Reports from "./pages/Reports";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from "./pages/ProtectdRouter";
import DepartmentForm from "./pages/DepartmentForm";
import UserManagement from "./pages/UserManagement";
import { AuthProvider } from "./context/AuthContext";
import LicenseUpload from "./pages/LicenseUpload";
import AllLicenses from "./pages/AllLicenses";
import ExpiringLicenses from "./pages/ExpiringLicenses";
import ChangePassword from "./pages/ChangePassword";

function App(){
  return(
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/register" element={<ProtectedRoute element={<Register />} adminOnly={true} />} />
          <Route path="/issue-history" element={<ProtectedRoute element={<History />} />} />
          <Route path="/home" element={<ProtectedRoute element={<History />} />} />
          <Route path="/issue-form" element={<ProtectedRoute element={<IssueForm />} />} />
          <Route path="/reports" element={<ProtectedRoute element={<Reports />} adminOnly={true} />} />
          <Route path="/add-department" element={<ProtectedRoute element={<DepartmentForm />} adminOnly={true} />} />
          
          {/* License management routes */}
          <Route path="/license-upload" element={<ProtectedRoute element={<LicenseUpload />} adminOnly={true} />} />
          <Route path="/all-licenses" element={<ProtectedRoute element={<AllLicenses />} adminOnly={true} />} />
          <Route path="/expiring-licenses" element={<ProtectedRoute element={<ExpiringLicenses />} adminOnly={true} />} />
          
          {/* User management route */}
          <Route path="/user-management" element={<ProtectedRoute element={<UserManagement />} adminOnly={true} />} />
          
          {/* Password change route - accessible to all authenticated users */}
          <Route path="/change-password" element={<ProtectedRoute element={<ChangePassword />} adminOnly={true}/>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
} 

export default App;