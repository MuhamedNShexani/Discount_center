import React from "react";
import { Box, Typography, Avatar, Paper } from "@mui/material";
import { Link } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { useTranslation } from "react-i18next";

const BrandShowcase = ({ brands }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  if (!brands || brands.length === 0) {
    return null;
  }

  const settings = {
    dots: false,
    infinite: true,
    speed: 5000,
    autoplay: true,
    autoplaySpeed: 1000,
    cssEase: "linear",
    slidesToShow: 5,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
        },
      },
    ],
  };

  return (
    <Paper
      elevation={4}
      sx={{
        my: 2,
        p: 2,
        borderRadius: 4,
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(145deg, #2c3e50, #34495e)"
            : "linear-gradient(145deg, #e6e6e6, #ffffff)",
        boxShadow:
          theme.palette.mode === "dark"
            ? "10px 10px 20px #253444, -10px -10px 20px #3d4a60"
            : "10px 10px 20px #d4d4d4, -10px -10px 20px #ffffff",
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        textAlign="left"
        sx={{
          fontWeight: 700,
          color: theme.palette.text.primary,
          textTransform: "uppercase",
          letterSpacing: "1px",
          mb: 3,
        }}
      >
        {t("Featured Brands")}
      </Typography>
      <Slider {...settings}>
        {brands.map((brand) => (
          <Box
            key={brand._id}
            component={Link}
            to={`/brands/${brand._id}`}
            sx={{
              textAlign: "center",
              textDecoration: "none",
              "&:hover .brand-avatar": {
                transform: "scale(1.1)",
                boxShadow: `0 0 15px ${theme.palette.primary.main}`,
              },
            }}
          >
            <Avatar
              src={`${process.env.REACT_APP_BACKEND_URL}${brand.logo}`}
              alt={brand.name}
              className="brand-avatar"
              sx={{
                width: 80,
                height: 80,
                m: "auto",
                bgcolor: "background.paper",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition:
                  "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                border: `2px solid ${theme.palette.divider}`,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                display: "block",
                fontWeight: 500,
                color: theme.palette.text.secondary,
              }}
            >
              {brand.name}
            </Typography>
          </Box>
        ))}
      </Slider>
    </Paper>
  );
};

export default BrandShowcase;
