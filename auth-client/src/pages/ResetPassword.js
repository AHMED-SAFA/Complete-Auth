import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Fade,
  InputAdornment,
  IconButton,
  Divider,
  Zoom,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import KeyIcon from "@mui/icons-material/Key";
import SecurityIcon from "@mui/icons-material/Security";
import { motion } from "framer-motion";

const ResetPassword = () => {
  const { uidb64, token } = useParams();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
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
          setEmail(response.data.email);
        } else {
          setError(
            response.data.error || "The reset link is invalid or has expired."
          );
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
        setError(
          response.data.error || "Password reset failed. Please try again."
        );
      }
    } catch (err) {
      console.log("Password reset error", err);
      setError(
        err.response?.data?.error || "Password reset failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && tokenValid === null) {
    return (
      <Container maxWidth="sm">
        <Fade in={true} timeout={800}>
          <Box
            sx={{
              mt: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              p: 4,
              borderRadius: 2,
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            }}
          >
            <CircularProgress
              size={60}
              thickness={4}
              sx={{ color: "#3f51b5" }}
            />
            <Typography variant="h6" sx={{ mt: 3, fontWeight: 500 }}>
              Verifying reset link...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Please wait while we validate your request
            </Typography>
          </Box>
        </Fade>
      </Container>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, rgb(14, 26, 78) 0%, rgb(183, 132, 235) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 2,
        }}
      >
        <Container maxWidth="sm">
          <Fade in={true} timeout={500}>
            <Paper
              elevation={12}
              sx={{
                p: 4,
                borderRadius: 3,
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "#ffebee",
                    borderRadius: "50%",
                    p: 2,
                    mb: 2,
                  }}
                >
                  <LockIcon sx={{ fontSize: 40, color: "#f44336" }} />
                </Box>

                <Typography
                  component="h1"
                  variant="h5"
                  sx={{ fontWeight: 600, mb: 1 }}
                >
                  Invalid Reset Link
                </Typography>

                <Alert
                  severity="error"
                  sx={{
                    width: "100%",
                    mb: 1,
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(244, 67, 54, 0.2)",
                  }}
                >
                  {error}
                </Alert>

                <Typography
                  variant="body1"
                  align="center"
                  sx={{ mb: 1, color: "text.secondary" }}
                >
                  The password reset link may have expired or is invalid. Please
                  request a new password reset link.
                </Typography>

                <Button
                  variant="contained"
                  onClick={() => navigate("/login")}
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    py: 1.2,
                    px: 4,
                    background:
                      "linear-gradient(45deg, #3f51b5 30%, #2196f3 90%)",
                    boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
                    "&:hover": {
                      boxShadow: "0 6px 14px rgba(33, 150, 243, 0.4)",
                    },
                  }}
                >
                  Request New Link
                </Button>
              </Box>
            </Paper>
          </Fade>
        </Container>
      </Box>
    );
  }

  // Valid token state - Form display
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgb(14, 26, 78) 0%, rgb(183, 132, 235) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Container maxWidth="sm">
        <Zoom in={true} timeout={500}>
          <Paper
            elevation={12}
            sx={{
              borderRadius: 3,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              width: "100%",
            }}
          >
            {/* Header Section */}
            <Box
              sx={{
                p: 3,
                backgroundColor: "#3f51b5",
                background: "linear-gradient(45deg, #3f51b5 30%, #2196f3 90%)",
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "50%",
                  p: 2,
                  width: 80,
                  height: 80,
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LockResetIcon sx={{ fontSize: 40, color: "#fff" }} />
              </Box>
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  mt: 2,
                  color: "white",
                  fontWeight: 600,
                }}
              >
                Reset Password
              </Typography>
            </Box>

            {/* Content Section */}
            <Box sx={{ p: 4 }}>
              {message && (
                <Alert
                  severity="success"
                  sx={{
                    width: "100%",
                    mb: 3,
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(76, 175, 80, 0.2)",
                  }}
                >
                  {message}
                </Alert>
              )}

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    width: "100%",
                    mb: 3,
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(244, 67, 54, 0.2)",
                  }}
                >
                  {error}
                </Alert>
              )}

              <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
                <SecurityIcon sx={{ mr: 1, color: "#3f51b5" }} />
                <Typography variant="body1" color="text.secondary">
                  Setting new password for <strong>{email}</strong>
                </Typography>
              </Box>

              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ width: "100%" }}
              >
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  inputProps={{ minLength: 8 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyIcon sx={{ color: "#3f51b5" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? (
                            <VisibilityOffIcon />
                          ) : (
                            <VisibilityIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#3f51b5",
                      },
                    },
                    "& .MuiFormLabel-root.Mui-focused": {
                      color: "#3f51b5",
                    },
                  }}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password2"
                  label="Confirm New Password"
                  type={showPassword2 ? "text" : "password"}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  inputProps={{ minLength: 8 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyIcon sx={{ color: "#3f51b5" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword2(!showPassword2)}
                          edge="end"
                        >
                          {showPassword2 ? (
                            <VisibilityOffIcon />
                          ) : (
                            <VisibilityIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#3f51b5",
                      },
                    },
                    "& .MuiFormLabel-root.Mui-focused": {
                      color: "#3f51b5",
                    },
                  }}
                />

                <Box sx={{ mt: 2, mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Password must be at least 8 characters long and should
                    include letters, numbers and special characters.
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    mt: 2,
                    mb: 2,
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: "1rem",
                    fontWeight: 600,
                    textTransform: "none",
                    background:
                      "linear-gradient(45deg, #3f51b5 30%, #2196f3 90%)",
                    boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
                    "&:hover": {
                      boxShadow: "0 6px 14px rgba(33, 150, 243, 0.4)",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Reset Password"
                  )}
                </Button>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ textAlign: "center" }}>
                  <Button
                    variant="text"
                    onClick={() => navigate("/login")}
                    sx={{
                      textTransform: "none",
                      fontWeight: 500,
                      color: "#3f51b5",
                    }}
                  >
                    Back to Login
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Zoom>
      </Container>
    </Box>
  );
};

export default ResetPassword;
