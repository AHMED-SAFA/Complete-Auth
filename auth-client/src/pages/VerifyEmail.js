import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  CircularProgress,
  Zoom,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import { motion } from "framer-motion";

const VerifyEmail = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const success = await verifyEmail(email, code);
      if (success) {
        console.log("Email verified successfully!", success);
        setMessage("Email verified successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        console.log(
          "Verification failed. Please check your code and try again."
        );
        setError("Verification failed. Please check your code and try again.");
      }
    } catch (err) {
      setError("An error occurred during verification. Please try again.");
    } finally {
      setLoading(false);
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
        overflow: "hidden",
      }}
      component={motion.div}
      transition={{ duration: 0.6 }}
    >
      <Zoom in={true} timeout={800}>
        <Paper
          elevation={12}
          sx={{
            borderRadius: 2,
            p: 4,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Typography
              component="h1"
              variant="h4"
              sx={{
                fontWeight: 200,
                mb: 1,
                background: "black",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Verify Your Email
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textAlign: "center" }}
            >
              Please enter the verification code sent to your email address
            </Typography>
          </Box>

          {message && (
            <Alert
              severity="success"
              sx={{
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
                mb: 3,
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(244, 67, 54, 0.2)",
              }}
            >
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
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: "#3f51b5" }} />,
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
              name="code"
              label="Verification Code"
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: "#3f51b5" }} />,
              }}
              sx={{
                mb: 4,
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
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 1,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                fontSize: "1rem",
                fontWeight: 600,
                textTransform: "none",
                background: "linear-gradient(90deg, #3f51b5 0%, #2196f3 100%)",
                boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
                "&:hover": {
                  background:
                    "linear-gradient(90deg, #303f9f 0%, #1976d2 100%)",
                  boxShadow: "0 6px 14px rgba(33, 150, 243, 0.4)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Verify Email"
              )}
            </Button>
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Didn't receive a code?{" "}
                <Typography
                  component="span"
                  variant="body2"
                  onClick={() => navigate("/login")}
                  sx={{
                    color: "#3f51b5",
                    fontWeight: 600,
                    cursor: "pointer",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Login
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Zoom>
    </Box>
  );
};

export default VerifyEmail;
