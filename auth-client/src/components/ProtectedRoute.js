import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

const ProtectedRoute = ({ children, requireVerified = false }) => {
  const { user, isLoading } = useAuth();

  function GradientCircularProgress(props) {
    return (
      <Box sx={{ position: "relative" }}>
        <CircularProgress
          variant="determinate"
          sx={{
            color: "rgb(230, 101, 101)",
          }}
          size={60}
          thickness={4}
          {...props}
          value={100}
        />
        <CircularProgress
          variant="indeterminate"
          disableShrink
          sx={{
            position: "absolute",
            left: 0,
            backgroundImage:
              "linear-gradient(135deg, rgba(14, 26, 78, 0.8) 0%, rgba(183, 132, 235, 0.8) 100%)",
            backgroundClip: "padding-box",
            borderRadius: "50%",
            padding: "2px",
            "& .MuiCircularProgress-circle": {
              stroke: "url(#progress-gradient)",
              strokeLinecap: "round",
            },
          }}
          size={60}
          thickness={4}
          {...props}
        />
        <svg width={0} height={0}>
          <defs>
            <linearGradient
              id="progress-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#0e1a4e" />
              <stop offset="100%" stopColor="#b784eb" />
            </linearGradient>
          </defs>
        </svg>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, rgb(14, 26, 78) 0%, rgb(183, 132, 235) 100%)",
        }}
      >
        <GradientCircularProgress />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireVerified && !user.is_verified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
};

export default ProtectedRoute;
