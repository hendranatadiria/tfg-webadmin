import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import AppBarMenu from "~/Components/AppBarMenu";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { useMemo } from "react";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  
  const prefersDarkMode = false //useMediaQuery('(prefers-color-scheme: dark)');

    const theme = useMemo(
      () =>
        createTheme({
          palette: {
            mode: prefersDarkMode ? 'dark' : 'light',
          },
        }),
      [prefersDarkMode],
    );

  return (
    <ThemeProvider theme={theme}>
          <CssBaseline />
    <SessionProvider session={session}>
      <AppBarMenu />
      <Component {...pageProps} />
    </SessionProvider>
    </ThemeProvider>
  );
};

export default api.withTRPC(MyApp);
