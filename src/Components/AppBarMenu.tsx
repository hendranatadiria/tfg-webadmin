import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Link from 'next/link';
import useFirebaseAuth from '~/hooks/useFirebaseAuth';
import { TextField } from '@mui/material';

const pageData = [
    {
        name: 'Dashboard',
        url: '/dashboard'
    },
    {
        name: 'Level Logs',
        url: '/logs/level'
    },
    {
        name: 'Temperature Logs',
        url: '/logs/temperature'
    },
    {
        name: 'Manage Log Backup Data',
        url: '/manage-data',
        isAuthed: true
    }
];
function AppBarMenu() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const authFirebase = useFirebaseAuth();

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {pageData.map((page) => page.isAuthed == undefined || (page?.isAuthed && authFirebase.authUser !== null && !authFirebase.loading) ?  (
                <MenuItem key={page.url} onClick={handleCloseNavMenu}>
                    <Link href={page.url} passHref>
                        <Typography textAlign="center">{page.name}</Typography>
                    </Link>
                </MenuItem>
              ) : (<div key={page.url}></div>))}
            </Menu>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems:'center'}}>
            <Box display="flex">
              {pageData.map((page) => page.isAuthed == undefined || (page?.isAuthed && authFirebase.authUser !== null && !authFirebase.loading) ? (
                  <Link href={page.url} passHref key={page.url}
                  >
                <Button
                  onClick={handleCloseNavMenu}
                  sx={{ my: 2, mr: 4, color: 'white', display: 'block' }}
                >
                  {page.name}
                </Button>
                </Link>
              ) : (<div key={page.url}></div>))}
            </Box>
            <Box sx={{my:2}}>
                {authFirebase.authUser == null ? (<Link href="/login"><Button sx={{color: '#ffffff', borderColor: '#ffffff'}}>Log In</Button></Link>) : (<Box gap={2} sx={{display: 'flex', justifyContent:'center', alignItems: 'center'}}> <Typography variant='body1' color="white">{authFirebase.authUser.email}</Typography>
                <Button variant='outlined' size="small" sx={{color: '#ffffff', borderColor: '#ffffff'}} onClick={() => {
                  void authFirebase.signOut()
                }}>Log Out</Button></Box>) }
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default AppBarMenu;
