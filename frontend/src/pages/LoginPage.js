import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  Alert,
  Avatar,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Lock,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Form states
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [activeTab, setActiveTab] = useState("login");

  const handleInputChange = (field, value) => {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegisterInputChange = (field, value) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Frontend validation - email or username required
    if (!loginForm.email?.trim()) {
      setError("Email or username is required");
      return;
    }
    if (!loginForm.password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    try {
      const result = await login(
        loginForm.email.trim(),
        loginForm.password?.trim() || loginForm.password,
      );
      if (result.success) {
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const username = registerForm.username.trim();
    const email = registerForm.email.trim();
    const password = registerForm.password;
    const confirmPassword = registerForm.confirmPassword;

    if (!username) {
      setError("Username is required");
      return;
    }

    if (!email) {
      setError("Email is required");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        username,
        email,
        password,
      });
      if (result.success) {
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        setError(result.message || "Registration failed");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            width: "100%",
            borderRadius: 3,
            background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
          }}
        >
          <Box textAlign="center" mb={3}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: "auto",
                mb: 2,
                background: "linear-gradient(135deg, #52b788 0%, #40916c 100%)",
              }}
            >
              <Person sx={{ fontSize: 40 }} />
            </Avatar>
            {/* <Typography variant="h4" component="h1" gutterBottom>
              {t("Welcome Back")}
            </Typography> */}
            {/* <Typography variant="body1" color="text.secondary">
              {t("Sign in to your account or create a new one")}
            </Typography> */}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() =>
              navigate(location.state?.from?.pathname || "/", { replace: true })
            }
            sx={{
              mb: 3,
              py: 1.5,
              borderWidth: 2,
              "&:hover": {
                borderWidth: 2,
              },
            }}
          >
            {t("Continue as Guest")}
          </Button>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {activeTab === "login"
              ? t("Sign in to sync across devices")
              : t("Create an account to save your favourites")}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, value) => {
                setActiveTab(value);
                setError("");
              }}
              variant="fullWidth"
            >
              <Tab label={t("Sign In")} value="login" />
              <Tab label={t("Register")} value="register" />
            </Tabs>
          </Box>

          {activeTab === "login" ? (
            <Box component="form" onSubmit={handleLoginSubmit}>
              <TextField
                fullWidth
                margin="normal"
                label={t("Email")}
                type="email"
                autoComplete="email"
                value={loginForm.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                margin="normal"
                label={t("Password")}
                type={showPassword ? "text" : "password"}
                value={loginForm.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  background:
                    "linear-gradient(135deg, #52b788 0%, #40916c 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #40916c 0%, #2d5a3d 100%)",
                  },
                }}
              >
                {loading ? t("Signing In...") : t("Sign In")}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleRegisterSubmit}>
              <TextField
                fullWidth
                margin="normal"
                label={t("Username")}
                type="text"
                value={registerForm.username}
                onChange={(e) =>
                  handleRegisterInputChange("username", e.target.value)
                }
                required
              />
              <TextField
                fullWidth
                margin="normal"
                label={t("Email")}
                type="email"
                autoComplete="email"
                value={registerForm.email}
                onChange={(e) =>
                  handleRegisterInputChange("email", e.target.value)
                }
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                margin="normal"
                label={t("Password")}
                type={showPassword ? "text" : "password"}
                value={registerForm.password}
                onChange={(e) =>
                  handleRegisterInputChange("password", e.target.value)
                }
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                margin="normal"
                label={t("Confirm Password")}
                type={showPassword ? "text" : "password"}
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  handleRegisterInputChange("confirmPassword", e.target.value)
                }
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  background:
                    "linear-gradient(135deg, #52b788 0%, #40916c 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #40916c 0%, #2d5a3d 100%)",
                  },
                }}
              >
                {loading ? t("Creating Account...") : t("Create Account")}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
