/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleIcon from "@mui/icons-material/Google";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  Divider,
  CircularProgress,
} from "@mui/material";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await login(email, password);
    if (result.success) {
      navigate("/");
    } else {
      // Show specific error message for unverified emails
      if (result.error.includes("verified")) {
        setError(result.error + " Check your email for the verification code.");
      } else {
        setError(result.error);
      }
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setIsGoogleLoading(true);

    try {
      const result = await loginWithGoogle();

      if (result.success) {
        console.log("Google sign-up successful");
        navigate("/");
      } else {
        // Check specifically for time-related errors
        if (result.error && result.error.includes("clock")) {
          setError(
            "Your computer's clock is not synchronized. Please update your system time and try again."
          );
        } else {
          setError(result.error || "Google sign-up failed. Please try again.");
        }
        console.error("Google sign-up error:", result.error);
      }
    } catch (err) {
      if (err.message && err.message.includes("clock")) {
        setError(
          "Your computer's clock is not synchronized. Please update your system time and try again."
        );
      } else {
        setError("An unexpected error occurred during Google sign-up");
      }
      console.error(err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>

        {/* Google Sign-up Button */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={
            isGoogleLoading ? <CircularProgress size={20} /> : <GoogleIcon />
          }
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading}
          sx={{ mt: 3, py: 1 }}
        >
          {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
        </Button>

        <Box sx={{ position: "relative", width: "100%", my: 3 }}>
          <Divider>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>
        </Box>
        {error && (
          <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Link to="/register" variant="body2">
              Don't have an account? Sign Up
            </Link>
            <Link to="/forgot-password" variant="body2">
              Forgot password?
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
