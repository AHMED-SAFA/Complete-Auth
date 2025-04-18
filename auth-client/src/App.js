import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirectRoute from "./components/AuthRedirectRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <AuthRedirectRoute>
                <Login />
              </AuthRedirectRoute>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRedirectRoute>
                <Register />
              </AuthRedirectRoute>
            }
          />
          <Route
            path="/verify-email"
            element={
              <AuthRedirectRoute>
                <VerifyEmail />
              </AuthRedirectRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthRedirectRoute>
                <ForgotPassword />
              </AuthRedirectRoute>
            }
          />
          <Route
            path="/reset-password/:uidb64/:token"
            element={
              <AuthRedirectRoute>
                <ResetPassword />
              </AuthRedirectRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
