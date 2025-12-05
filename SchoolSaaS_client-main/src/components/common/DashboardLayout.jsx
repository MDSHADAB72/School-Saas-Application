import { useState } from "react";
import { Box, useMediaQuery, useTheme, Container } from "@mui/material";
import { Header } from "./Header";
import { Sidebar, DRAWER_WIDTH } from "./Sidebar";

export function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleMobileMenuToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  return (
    <Box
      sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}
    >
      <Sidebar mobileOpen={mobileOpen} onMobileClose={handleMobileClose} />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Header onMobileMenuToggle={handleMobileMenuToggle} />

        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
            maxWidth: "100%",
            width: "100%"
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              py: { xs: 2, sm: 3, md: 3, lg: 4 },
              px: { xs: 2, sm: 3, md: 3, lg: 4 },
              maxWidth: "100%",
              width: "100%"
            }}
          >
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
