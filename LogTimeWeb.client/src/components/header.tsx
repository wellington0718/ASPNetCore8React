﻿import { useState, MouseEvent } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import LogoutIcon from '@mui/icons-material/Logout';
import { getUserSession, logOut } from '../services/sessionService';
import { Popover } from '@mui/material';
import LogTimeWebApi from '../repositories/logTimeWebApi';
import { BusyDialogState, SessionLogOutData } from '../types';
import BusyDialog from './busyDialog';
import { useNavigate } from 'react-router-dom';

const baseUrl = "http://intranet/SynergiesSystem/LogTime";
const resources: Array<{ [key: string]: string }> =
    [
        { "Reportes": baseUrl },
        { "Actividades": `${baseUrl}/Activities` },
        { "Sesiones activas": `${baseUrl}/UsersSessions` },
        { "Grupos": `${baseUrl}/SaveGroupInactivityTime` }
    ];

function Header() {
    const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
    const userSession = getUserSession();
    const [busyDialogState, setBusyDialogState] = useState<BusyDialogState>({ open: false, message: "" });
    const logTimeWebApi = new LogTimeWebApi();
    const navigate = useNavigate();

    const handleOpenNavMenu = (event: MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };
    const handleOpenUserMenu = (event: MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const showBusyDialog = (open: boolean, message: string) => setBusyDialogState({ open, message });

    const handleLogOut = async () => {

        if (userSession != null) {

            const logoutData: SessionLogOutData = {
                id: userSession.historyLogId,
                loggedOutBy: userSession.user.id,
                userIds: userSession.user.id
            }

            showBusyDialog(true, "Cerrando sesión, por favor espere");
            const response = await logTimeWebApi.closeSession(logoutData);

            if (response.isSessionAlreadyClose) {
                logOut();
                navigate("/LogTimeWeb/login")
            }
        }
    }

    return (
        <AppBar position="fixed" sx={{ bgcolor: "#0065B1" }}>
            <BusyDialog {...busyDialogState} />
            <Container sx={{ minWidth: "100%" }} >
                <Toolbar className="flex justify-between">


                    <Button variant="text" className="border-0 bg-transparent"
                        onClick={() => { console.info("I'm a button."); }}>

                        <Box className="flex items-center gap-4">
                            <Avatar
                                src="images/icon.png"
                                alt="quasar logo"
                                sx={{ width: 50, height: 50, margin: "0 auto" }}
                            />


                            <Typography
                                variant="h6"
                                noWrap
                                sx={{
                                    mr: 2,
                                    display: { xs: 'none', md: 'flex' },
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    letterSpacing: '.3rem',
                                    color: 'white',
                                }}
                            >
                                LOGTIMEWEB
                            </Typography>
                        </Box>
                    </Button>



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
                            sx={{ display: { xs: 'block', md: 'none' } }}
                        >
                            {resources.flatMap((page) =>
                                Object.entries(page).map(([name, value]) => (
                                    <MenuItem component="a" key={name} href={value} target="_blank">
                                        <Typography color="white" sx={{ textAlign: 'center' }}>{name}</Typography>
                                    </MenuItem>
                                ))
                            )}

                        </Menu>
                    </Box>

                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>

                        {resources.flatMap((page) =>
                            Object.entries(page).map(([name, value]) => (
                                <MenuItem component="a" key={name} href={value} target="_blank">
                                    <Typography color="white" sx={{ textAlign: 'center' }}>{name}</Typography>
                                </MenuItem>
                            ))
                        )}
                    </Box>
                    <Box sx={{ flexGrow: 0 }}>
                        <Tooltip title="Open settings">
                            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                <Avatar alt="WM" src="/static/images/avatar/2.jpg" />
                            </IconButton>
                        </Tooltip>
                        <Popover
                            sx={{ mt: '45px' }}
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                        >

                            <Box minWidth="200px"
                                sx={{
                                    margin: 'auto',
                                    p: 3,
                                    textAlign: 'center',
                                }}
                            >
                                <Typography variant="h6" component="div">
                                    {userSession?.user.firstName + " " + userSession?.user.lastName}
                                </Typography>
                                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                    Proyecto: {userSession?.user.project.project_Desc}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mb={3}>
                                    ID: {userSession?.user.id}
                                </Typography>
                                <Button onClick={handleLogOut}
                                    variant="contained"
                                    color="primary"
                                    startIcon={<LogoutIcon />}
                                >
                                    Logout
                                </Button>
                            </Box>
                        </Popover>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
export default Header;

