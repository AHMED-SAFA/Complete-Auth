
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { TextField, Button, Container, Typography, Box, Alert, CircularProgress } from "@mui/material";

const ResetPassword = () => {
  const { uidb64, token } = useParams();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  // Check token validity when component mounts
  useEffect(() => {
    const checkToken = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8000/api/auth/reset-password/${uidb64}/${token}/`
        );
        
        if (response.data.success) {
          setTokenValid(true);
          console.log("Response data from checkToken:", response.data);
          console.log("Email:", response.data.email);
          console.log("Token:", response.data.token);
          setEmail(response.data.email);
        } else {
          setError(response.data.error || "The reset link is invalid or has expired.");
          setTokenValid(false);
        }
      } catch (err) {
        console.log("Error from checkToken:", err);
        setError("The reset link is invalid or has expired.");
        setTokenValid(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkToken();
  }, [uidb64, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.patch(
        "http://localhost:8000/api/auth/password-reset-complete/",
        { uidb64, token, password, password2 }
      );
      
      if (response.data.success) {
        console.log("Password reset successful", response.data);
        setMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        console.log("Password reset failed", response.data.error);
        setError(response.data.error || "Password reset failed. Please try again.");
      }
    } catch (err) {
      console.log("Password reset error", err);
      setError(err.response?.data?.error || "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && tokenValid === null) {
    return (
      <Container maxWidth="xs">
        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Verifying reset link...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (tokenValid === false) {
    return (
      <Container maxWidth="xs">
        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Login
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Reset Password for {email}
        </Typography>
        {message && (
          <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
            {message}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            inputProps={{ minLength: 8 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password2"
            label="Confirm New Password"
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            inputProps={{ minLength: 8 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Reset Password"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ResetPassword;