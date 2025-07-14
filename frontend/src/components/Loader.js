import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const Loader = ({ message = "Loading..." }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="50vh"
  >
    <CircularProgress size={60} />
    <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
      {message}
    </Typography>
  </Box>
);

export default Loader;
