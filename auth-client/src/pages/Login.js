import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Zoom,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  CircularProgress,
  IconButton,
  InputAdornment,
  Avatar,
  useTheme,
  Card,
  CardContent,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { motion } from "framer-motion";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate("/");
      } else {
        // Show specific error message for unverified emails
        if (result.error.includes("verified")) {
          setError(
            result.error + " Check your email for the verification code."
          );
          navigate("/verify-email");
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred during login");
      console.error(err);
    } finally {
      setIsLoading(false);
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
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,rgb(14, 26, 78) 0%,rgb(183, 132, 235) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
      component={motion.div}
      transition={{ duration: 0.6 }}
    >
      <Zoom in={true} timeout={500}>
        <Card
          elevation={10}
          sx={{
            width: "100%",
            maxWidth: 450,
            borderRadius: 3,
            overflow: "hidden",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              boxShadow: "0 10px 30px 1px rgb(20, 20, 20)",
            },
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Avatar
                sx={{
                  mb: 2,
                  bgcolor: "ActiveBorder",
                  width: 56,
                  height: 56,
                }}
              >
                <LockOutlinedIcon fontSize="large" />
              </Avatar>
              <Typography component="h1" variant="h4" fontWeight="bold">
                Welcome back
              </Typography>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Sign in to your account
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              startIcon={
                isGoogleLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <GoogleIcon sx={{ color: "#DB4437" }} />
                )
              }
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 500,
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                borderColor: "rgba(0,0,0,0.12)",
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.01)",
                  borderColor: "rgba(0,0,0,0.2)",
                },
              }}
            >
              {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
            </Button>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                my: 3,
              }}
            >
              <Divider sx={{ flexGrow: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
                OR
              </Typography>
              <Divider sx={{ flexGrow: 1 }} />
            </Box>
            {error && (
              <Alert
                severity="error"
                sx={{
                  width: "100%",
                  mb: 3,
                  borderRadius: 2,
                }}
              >
                {error}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit}>
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
                variant="outlined"
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mb: 2,
                }}
              >
                <Link
                  to="/forgot-password"
                  style={{
                    color: theme.palette.primary.main,
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                  }}
                >
                  Forgot password?
                </Link>
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                  background:
                    "linear-gradient(90deg, #3f51b5 0%, #5c6bc0 100%)",
                  "&:hover": {
                    boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                  },
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress
                      size={24}
                      sx={{ mr: 1 }}
                      color="inherit"
                    />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </Box>

            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  style={{
                    color: theme.palette.primary.main,
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Zoom>
    </Box>
  );
};

export default Login;
