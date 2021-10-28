import { useState } from 'react';
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import { ResourcesTable } from './ResourcesTable';

function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Secure Static Site
          </Typography>
        </Toolbar>
      </AppBar>
      <Grid container justifyContent="center" alignItems="center" p="2em">
        <Grid item xs={12} sx={{ my: "1rem" }}>
          <Typography variant="h1" sx={{ fontSize: "3rem", textAlign: "center" }}>
            Validate Content-Security-Policy
          </Typography>
        </Grid>
        <Grid item md={11} lg={8}>
          <ResourcesTable />
        </Grid>
      </Grid>
    </Box>

  )
}

export default App
