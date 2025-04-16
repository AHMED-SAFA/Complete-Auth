/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/login/",
        { email, password }
      );

      const { access, refresh, user: userData } = response.data;

      // Verify the user is verified before storing tokens
      const decoded = jwtDecode(access);
      if (!decoded.is_verified) {
        throw new Error("Email not verified. Please verify your email first.");
      }

      localStorage.setItem("token", access);
      localStorage.setItem("refreshToken", refresh);
      setToken(access);

      // Store the complete user object from the response, including image URL
      setUser(userData || decoded);

      console.log("Login response:", response);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      console.log("Login error:", error);

      // Clear any partial authentication if verification failed
      if (error.message.includes("verified")) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setToken(null);
        setUser(null);
      }

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.message ||
          "Login failed. Please try again.",
      };
    }
  };
  const loginWithGoogle = async () => {
    try {
      // Configure popup settings to handle COOP issues
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      // Add these settings
      auth.settings.appVerificationDisabledForTesting = true;

      // Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider);

      // Get the Firebase ID token
      const idToken = await result.user.getIdToken();

      // Get user details including profile picture
      const photoURL = result.user.photoURL;
      const displayName = result.user.displayName;
      const email = result.user.email;

      console.log("Google user details:", {
        photoURL,
        displayName,
        email,
      });

      // Send the token and user details to your backend
      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/firebase-login/",
        {
          idToken,
          photoURL,
          displayName,
          email,
        }
      );

      const { access, refresh, user: userData } = response.data;

      localStorage.setItem("token", access);
      localStorage.setItem("refreshToken", refresh);
      setToken(access);
      setUser(userData);

      console.log("Google login response:", response.data);
      return { success: true };
    } catch (error) {
      console.error("Google login error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          "Google login failed. Please try again.",
      };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      // Attempt to logout with the backend
      try {
        await axios.post(
          "http://localhost:8000/api/auth/logout/",
          { refresh_token: refreshToken },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        // If the error is due to expired access token, try without it
        if (error.response?.data?.code === "token_not_valid") {
          await axios.post(
            "http://localhost:8000/api/auth/logout/",
            { refresh_token: refreshToken },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        } else {
          console.error("Logout error:", error);
        }
      }

      // Sign out from Firebase if needed
      try {
        await auth.signOut();
      } catch (fbError) {
        console.error("Firebase logout error:", fbError);
      }

      // Clear local storage and state regardless of backend response
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setToken(null);
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);

      // Ensure we always clear local storage and state
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setToken(null);
      setUser(null);
      navigate("/login");
    }
  };

  const register = async (formData) => {
    try {
      // Check if FormData is being used (for image upload)
      const isFormData = formData instanceof FormData;

      // Set up the appropriate content type
      const config = {
        headers: {
          "Content-Type": isFormData
            ? "multipart/form-data"
            : "application/json",
        },
      };

      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/register/",
        formData,
        config
      );

      console.log("Registration response:", response);
      return { success: true, data: response.data };
    } catch (error) {
      console.log("Registration error:", error);
      console.error("Registration error:", error);
      return { success: false, error: error.response?.data };
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/verify-email/",
        { email, code }
      );

      // Store user data and tokens if available in the verification response
      if (response.data.access && response.data.refresh) {
        setUser(response.data.user);
      }

      console.log("Email verification response:", response);
      return true;
    } catch (error) {
      console.error("Email verification error:", error);
      console.log("Email verification error:", error);
      return false;
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/request-reset-email/",
        {
          email,
        }
      );
      console.log("Password reset request response:", response);
      return true;
    } catch (error) {
      console.error("Password reset request error:", error);
      console.log("Password reset request error:", error);
      return false;
    }
  };

  const resetPassword = async (uidb64, token, password, password2) => {
    try {
      const response = await axios.patch(
        "http://127.0.0.1:8000/api/auth/password-reset-complete/",
        {
          uidb64,
          token,
          password,
          password2,
        }
      );
      console.log("Password reset response:", response);
      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      console.log("Password reset error:", error);
      return false;
    }
  };

  // const updateProfile = async (updateData) => {
  //   try {
  //     const isFormData = updateData instanceof FormData;

  //     const config = {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": isFormData
  //           ? "multipart/form-data"
  //           : "application/json",
  //       },
  //     };

  //     const response = await axios.patch(
  //       "http://127.0.0.1:8000/api/auth/profile/",
  //       updateData,
  //       config
  //     );

  //     console.log("Profile update response:", response);
  //     console.log("Profile update response.data:", response.data);
  //     setUser(response.data);

  //     return { success: true, data: response.data };
  //   } catch (error) {
  //     console.error("Profile update error:", error);
  //     return {
  //       success: false,
  //       error: error.response?.data || "Failed to update profile",
  //     };
  //   }
  // };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (token) {
          const decoded = jwtDecode(token);

          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            try {
              const refreshToken = localStorage.getItem("refreshToken");
              const response = await axios.post(
                "http://127.0.0.1:8000/api/token/refresh/",
                {
                  refresh: refreshToken,
                }
              );

              const newAccessToken = response.data.access;
              localStorage.setItem("token", newAccessToken);
              setToken(newAccessToken);

              // If there's user data in the response, use that instead of just the decoded token
              if (response.data.user) {
                setUser(response.data.user);
              } else {
                const newDecoded = jwtDecode(newAccessToken);
                setUser(newDecoded);
              }
            } catch (refreshError) {
              logout();
            }
          } else {
            // If we have user data in state, keep using it
            // Otherwise, try to get the full user profile
            if (!user) {
              try {
                const response = await axios.get(
                  "http://127.0.0.1:8000/api/auth/profile/",
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
                setUser(response.data);
              } catch (profileError) {
                // If profile fetch fails, fall back to decoded token data
                setUser(decoded);
              }
            }
          }
        }
      } catch (error) {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        register,
        verifyEmail,
        requestPasswordReset,
        resetPassword,
        loginWithGoogle,
        // updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
