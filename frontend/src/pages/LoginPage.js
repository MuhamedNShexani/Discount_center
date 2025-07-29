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
  Tabs,
  Tab,
  Avatar,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Lock,
  Phone,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    firstName: "",
    lastName: "",
    phone: "",
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(loginForm.email, loginForm.password);
      if (result.success) {
        // Redirect to the page they were trying to access, or home
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (registerForm.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const userData = {
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        phone: registerForm.phone,
      };

      const result = await register(userData);
      if (result.success) {
        // Redirect to the page they were trying to access, or home
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (formType, field, value) => {
    if (formType === "login") {
      setLoginForm((prev) => ({ ...prev, [field]: value }));
    } else {
      setRegisterForm((prev) => ({ ...prev, [field]: value }));
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
            <Typography variant="h4" component="h1" gutterBottom>
              {t("Welcome Back")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t("Sign in to your account or create a new one")}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label={t("Login")} />
            <Tab label={t("Register")} />
          </Tabs>

          {activeTab === 0 && (
            <Box component="form" onSubmit={handleLoginSubmit}>
              <TextField
                fullWidth
                margin="normal"
                label={t("Email")}
                type="email"
                value={loginForm.email}
                onChange={(e) =>
                  handleInputChange("login", "email", e.target.value)
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
                value={loginForm.password}
                onChange={(e) =>
                  handleInputChange("login", "password", e.target.value)
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
          )}

          {activeTab === 1 && (
            <Box component="form" onSubmit={handleRegisterSubmit}>
              <TextField
                fullWidth
                margin="normal"
                label={t("Username")}
                value={registerForm.username}
                onChange={(e) =>
                  handleInputChange("register", "username", e.target.value)
                }
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                margin="normal"
                label={t("Email")}
                type="email"
                value={registerForm.email}
                onChange={(e) =>
                  handleInputChange("register", "email", e.target.value)
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
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  margin="normal"
                  label={t("First Name")}
                  value={registerForm.firstName}
                  onChange={(e) =>
                    handleInputChange("register", "firstName", e.target.value)
                  }
                  required
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label={t("Last Name")}
                  value={registerForm.lastName}
                  onChange={(e) =>
                    handleInputChange("register", "lastName", e.target.value)
                  }
                  required
                />
              </Box>
              <TextField
                fullWidth
                margin="normal"
                label={t("Phone")}
                value={registerForm.phone}
                onChange={(e) =>
                  handleInputChange("register", "phone", e.target.value)
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
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
                  handleInputChange("register", "password", e.target.value)
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
                type={showConfirmPassword ? "text" : "password"}
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  handleInputChange(
                    "register",
                    "confirmPassword",
                    e.target.value
                  )
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
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
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
