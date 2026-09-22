import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    background: { default: '#f8fafc', paper: '#ffffff' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overline: { letterSpacing: '0.06em' },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: 'none' },
      },
    },
  },
});
