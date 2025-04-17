/* eslint-disable react-hooks/exhaustive-deps */
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Typography,
  Button,
  Box,
  Avatar,
  Paper,
  Divider,
  Card,
  CardContent,
  IconButton,
  Fade,
  Chip,
} from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import LogoutIcon from "@mui/icons-material/Logout";
import EditIcon from "@mui/icons-material/Edit";
import VerifiedIcon from "@mui/icons-material/Verified";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EmailIcon from "@mui/icons-material/Email";
import { motion } from "framer-motion";

const Home = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      console.log("No user found");
      navigate("/login");
    } else {
      console.log("User found:", user);
      fetchUserData();
    }
  }, [user, navigate]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/api/auth/user/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Fetched user data:", response.data);
      setUserData(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Get the profile image URL from userData or user object
  const profileImage = userData?.image || user?.image;
  const username = userData?.username || user?.username || "User";
  const email = userData?.email || user?.email || "";
  const isVerified = userData?.is_verified || user?.is_verified;

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
      <Fade in={!loading} timeout={500}>
        <Box sx={{ mt: 6, mb: 6 }}>
          <Paper
            elevation={12}
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              background: "linear-gradient(to right bottom, #ffffff,)",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Header Banner */}
            <Box
              sx={{
                height: 160,
                backgroundColor: "#293f61",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                p: 3,
              }}
            >
              <Typography
                variant="h4"
                component="h1"
                mb={4}
                align="center"
                color="white"
                sx={{
                  color: "white",
                  fontWeight: 700,
                  textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                Welcome, {username}!
              </Typography>
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  p: 2,
                }}
              >
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleLogout}
                  startIcon={<LogoutIcon />}
                  sx={{
                    borderRadius: 6,
                    textTransform: "none",
                    px: 2,
                    py: 1,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.3)",
                    },
                  }}
                >
                  Logout
                </Button>
              </Box>
            </Box>

            {/* Profile Section */}
            <Box sx={{ position: "relative", px: 3, pt: 8, pb: 4 }}>
              <Avatar
                src={profileImage}
                alt={`${username}'s profile`}
                sx={{
                  width: 120,
                  height: 120,
                  border: "4px solid white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  position: "absolute",
                  top: -60,
                  left: 40,
                }}
              >
                {!profileImage && <AccountCircleIcon sx={{ fontSize: 80 }} />}
              </Avatar>

              <Box sx={{ ml: { xs: 0, sm: 18 }, mt: { xs: 6, sm: 0 } }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{ fontWeight: 600, mr: 2 }}
                  >
                    {username}
                  </Typography>
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: "#f0f2ff",
                      "&:hover": { backgroundColor: "#e0e4ff" },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
                    color: "text.secondary",
                  }}
                >
                  <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body1">{email}</Typography>
                </Box>

                <Chip
                  icon={<VerifiedIcon />}
                  label={"Email Verified"}
                  color={"success"}
                  variant={"filled"}
                  sx={{ fontWeight: 500, mt: 1 }}
                />

                {!isVerified && (
                  <Button
                    variant="text"
                    color="primary"
                    onClick={() => navigate("/verify-email")}
                    sx={{ ml: 2, textTransform: "none", fontWeight: 500 }}
                  >
                    Verify Now
                  </Button>
                )}
              </Box>
            </Box>

            <Divider sx={{ mx: 3 }} />

            {/* Dashboard Cards */}
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
              >
                Account Overview
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Card
                  sx={{
                    flexGrow: 1,
                    minWidth: { xs: "100%", sm: "240px" },
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Membership Status
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {isVerified ? "Active" : "Pending Verification"}
                    </Typography>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    flexGrow: 1,
                    minWidth: { xs: "100%", sm: "240px" },
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Account Type
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Standard
                    </Typography>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    flexGrow: 1,
                    minWidth: { xs: "100%", sm: "240px" },
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Member Since
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {new Date().toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Fade>
    </Box>
  );
};

export default Home;
