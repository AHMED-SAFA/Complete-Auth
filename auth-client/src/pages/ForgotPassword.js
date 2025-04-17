import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Slide,
  Fade,
  InputAdornment,
  Zoom,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import EmailIcon from "@mui/icons-material/Email";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { motion } from "framer-motion";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const success = await requestPasswordReset(email);
      if (success) {
        setMessage(
          "If an account with that email exists, we have sent a password reset link."
        );
        console.log("Password reset email sent successfully", success);
        setTimeout(() => {
          navigate("/login");
        }, 3000); // Navigate after showing success message for 3 seconds
      }
    } catch (error) {
      console.log("Failed to send password reset email", error);
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
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
              boxShadow: "0 16px 70px -12.125px rgba(0,0,0,0.3)",
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
                  bgcolor: "primary.main",
                  width: 56,
                  height: 56,
                  transform: "scale(1)",
                  transition: "transform 0.3s ease-in-out",
                  "&:hover": {
                    transform: "scale(1.1)",
                  },
                }}
              >
                <LockResetIcon fontSize="large" />
              </Avatar>

              <Fade in={true} timeout={1000}>
                <Typography component="h1" variant="h4" fontWeight={300}>
                  Reset Password
                </Typography>
              </Fade>

              <Fade in={true} timeout={1200}>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  sx={{ mt: 1, textAlign: "center" }}
                >
                  Enter your email address and we'll send you a link to reset
                  your password
                </Typography>
              </Fade>
            </Box>

            {message && (
              <Slide direction="up" in={true} mountOnEnter unmountOnExit>
                <Alert
                  severity="success"
                  sx={{
                    width: "100%",
                    mb: 3,
                    borderRadius: 2,
                    animation: "pulse 2s infinite",
                  }}
                >
                  {message}
                </Alert>
              </Slide>
            )}

            {error && (
              <Slide direction="up" in={true} mountOnEnter unmountOnExit>
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
              </Slide>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ mt: 1 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
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
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    transition: "transform 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-2px)",
                    },
                    "&.Mui-focused": {
                      transform: "translateY(-2px)",
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />

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
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                    transform: "translateY(-3px)",
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
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate("/login")}
                startIcon={<ArrowBackIcon />}
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(63, 81, 181, 0.04)",
                    transform: "translateX(-3px)",
                  },
                }}
              >
                Back to Login
              </Button>
            </Box>

            <style jsx>{`
              @keyframes pulse {
                0% {
                  box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
                }
                70% {
                  box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
                }
                100% {
                  box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
                }
              }
            `}</style>
          </CardContent>
        </Card>
      </Zoom>
    </Box>
  );
};

export default ForgotPassword;
