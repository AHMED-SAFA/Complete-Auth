// /* eslint-disable react-hooks/exhaustive-deps */
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { Container, Typography, Button, Box } from "@mui/material";
// import { useEffect, useState } from "react";
// import axios from "axios";

// const Home = () => {
//   const { user, token, logout } = useAuth();
//   const navigate = useNavigate();
//   const [userData, setUserData] = useState(null);

//   useEffect(() => {
//     if (!user) {
//       console.log("No user found");
//       navigate("/login");
//     } else {
//       console.log("User found:", user);
//       if (!user.username && user.user_id) {
//         fetchUserData();
//       } else {
//         setUserData(user);
//       }
//     }
//   }, [user, navigate]);

//   const fetchUserData = async () => {
//     try {
//       const response = await axios.get("http://127.0.0.1:8000/api/auth/user/", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       console.log("Fetched user data:", response.data);
//       setUserData(response.data);
//     } catch (error) {
//       console.error("Error fetching user data:", error);
//     }
//   };

//   const handleLogout = async () => {
//     await logout();
//     navigate("/login");
//   };

//   return (
//     <Container maxWidth="sm">
//       <Box
//         sx={{
//           mt: 8,
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           textAlign: "center",
//         }}
//       >
//         <Typography component="h1" variant="h4" gutterBottom>
//           Welcome {userData?.username || user?.username || "User"}!
//         </Typography>

//         <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
//           {userData?.is_verified || user?.is_verified
//             ? "Your email is verified and you're all set!"
//             : "Please verify your email to access all features."}
//         </Typography>

//         <Button
//           variant="contained"
//           color="secondary"
//           onClick={handleLogout}
//           sx={{ mt: 2 }}
//         >
//           Logout
//         </Button>
//       </Box>
//     </Container>
//   );
// };

// export default Home;

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Container, Typography, Button, Box, Avatar } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";

const Home = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!user) {
      console.log("No user found");
      navigate("/login");
    } else {
      console.log("User found:", user);
      if (!user.username && user.user_id) {
        fetchUserData();
      } else {
        setUserData(user);
      }
    }
  }, [user, navigate]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/auth/user/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Fetched user data:", response.data);
      setUserData(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Get the profile image URL from userData or user object
  const profileImage = userData?.image || user?.image;

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {profileImage && (
          <Avatar
            src={profileImage}
            alt={`${userData?.username || user?.username}'s profile`}
            sx={{ width: 100, height: 100, mb: 2 }}
          />
        )}
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome {userData?.username || user?.username || "User"}!
        </Typography>
        <Typography variant="h5" component="h1" gutterBottom>
          Email: {userData?.email || user?.email}
        </Typography>
        <Typography variant="body1" gutterBottom>
          {userData?.is_verified || user?.is_verified
            ? "Your email is verified and you're all set!"
            : "Please verify your email to access all features."}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleLogout}
          sx={{ mt: 2 }}
        >
          Logout
        </Button>
      </Box>
    </Container>
  );
};

export default Home;
