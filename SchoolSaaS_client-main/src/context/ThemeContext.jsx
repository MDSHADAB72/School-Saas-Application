import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext();

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return context;
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                primary: { main: '#1976d2' },
                background: { default: '#f5f5f5', paper: '#ffffff' },
                text: { primary: '#333333', secondary: '#666666' },
                divider: '#e0e0e0'
              }
            : {
                primary: { main: '#90caf9' },
                background: { default: '#0a0a0a', paper: '#1a1a1a' },
                text: { primary: '#ffffff', secondary: '#b0b0b0' },
                divider: '#333333',
                action: {
                  selected: 'rgba(144, 202, 249, 0.16)',
                  hover: 'rgba(255, 255, 255, 0.08)'
                }
              })
        },
        typography: {
          fontFamily: 'Inter, sans-serif'
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none'
              }
            }
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderColor: mode === 'dark' ? '#333333' : '#e0e0e0'
              },
              head: {
                backgroundColor: mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                fontWeight: 600
              }
            }
          }
        }
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
