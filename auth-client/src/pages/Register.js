import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Avatar,
  InputLabel,
  OutlinedInput,
  FormControl,
  InputAdornment,
  IconButton,
  Card,
  Zoom,
  CardContent,
  useTheme,
  Badge,
} from "@mui/material";
import { PhotoCamera, Visibility, VisibilityOff } from "@mui/icons-material";
import { motion } from "framer-motion";
const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    password2: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setImage(selectedFile);

      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (formData.password !== formData.password2) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      // Create a FormData object to send both text fields and the image
      const submitData = new FormData();
      submitData.append("email", formData.email);
      submitData.append("username", formData.username);
      submitData.append("password", formData.password);
      submitData.append("password2", formData.password2);

      // Only append image if one was selected
      if (image) {
        submitData.append("image", image);
      }

      const result = await register(submitData);
      if (result.success) {
        navigate("/verify-email", { state: { email: formData.email } });
        console.log("Registration successful", result);
      } else {
        console.log("Registration error:", result.error);
        setError(
          result.error?.email?.[0] ||
            result.error?.username?.[0] ||
            result.error?.image?.[0] ||
            "Registration failed. Please try again."
        );
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
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
            maxWidth: 480,
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
              <Typography component="h1" variant="h4" fontWeight="bold">
                Create Account
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Join our community today
              </Typography>
            </Box>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ width: "100%" }}
            >
              {/* Profile Image Upload */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    <label htmlFor="upload-photo">
                      <input
                        accept="image/*"
                        id="upload-photo"
                        type="file"
                        style={{ display: "none" }}
                        onChange={handleImageChange}
                      />
                      <IconButton
                        component="span"
                        sx={{
                          bgcolor: "primary.main",
                          color: "white",
                          border: "2px solid white",
                          "&:hover": { bgcolor: "primary.dark" },
                          width: 36,
                          height: 36,
                        }}
                      >
                        <PhotoCamera fontSize="small" />
                      </IconButton>
                    </label>
                  }
                >
                  <Avatar
                    src={previewImage}
                    sx={{
                      width: 110,
                      height: 110,
                      border: "3px solid white",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                    }}
                  />
                </Badge>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Upload profile picture
                </Typography>
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
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleChange}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                variant="outlined"
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                  },
                }}
              />

              <FormControl
                fullWidth
                variant="outlined"
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                  },
                }}
              >
                <InputLabel htmlFor="outlined-adornment-password">
                  Password*
                </InputLabel>
                <OutlinedInput
                  id="outlined-adornment-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  name="password"
                  required
                  endAdornment={
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
                  }
                  label="Password"
                />
              </FormControl>

              <FormControl
                fullWidth
                variant="outlined"
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                  },
                }}
              >
                <InputLabel htmlFor="outlined-adornment-password2">
                  Confirm Password*
                </InputLabel>
                <OutlinedInput
                  id="outlined-adornment-password2"
                  type={showPassword ? "text" : "password"}
                  value={formData.password2}
                  onChange={handleChange}
                  name="password2"
                  required
                  endAdornment={
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
                  }
                  label="Confirm Password"
                />
              </FormControl>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  borderRadius: 1,
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
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <Box sx={{ textAlign: "center", mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    style={{
                      color: theme.palette.primary.main,
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    Sign In
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Zoom>
    </Box>
  );
};

export default Register;
