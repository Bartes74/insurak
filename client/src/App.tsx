import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Admin from './pages/Admin';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import { ThemeProvider } from './context/ThemeContext';
import { AssetsProvider } from './context/AssetsContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AssetsProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="assets" element={<Assets />} />
                  <Route path="policies" element={<div>Policies List (Coming Soon)</div>} />
                  <Route
                    path="admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Routes>
              <ToastContainer />
            </BrowserRouter>
          </AssetsProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
