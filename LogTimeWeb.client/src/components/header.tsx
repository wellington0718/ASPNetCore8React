import { useState, MouseEvent } from 'react';
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
import { BusyDialogState, LogFile, MESSAGE, SessionLogOutData } from '../types';
import BusyDialog from './busyDialog';
import { useNavigate } from 'react-router-dom';
//import { saveAs } from 'file-saver';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import { useDialogs } from '@toolpad/core';
import { AxiosError } from 'axios';

const baseUrl = "http://intranet/SynergiesSystem/LogTime";
const resources: Array<{ [key: string]: string }> =
    [
        { "Reportes": baseUrl },
        { "Actividades": `${baseUrl}/Activities` },
        { "Sesiones activas": `${baseUrl}/UsersSessions` },
        { "Grupos": `${baseUrl}/SaveGroupInactivityTime` },
    ];

function Header() {

    const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
    const userSession = getUserSession();
    const [busyDialogState, setBusyDialogState] = useState<BusyDialogState>({ open: false, message: "" });
    const logTimeWebApi = new LogTimeWebApi();
    const navigate = useNavigate();
    const dialogs = useDialogs();
    const [logData, setLogData] = useState<{ title: string, content: string }>({ title: "", content: "" });

    const logFile: LogFile = {
        userId: userSession.user?.id,
        roleId: userSession.user?.roleId,
        component: "Header"
    };

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

    const handleError = async (error: unknown) => {

        if (error instanceof AxiosError) {
            if (error.response?.data.includes("network-related")) {

                logFile.message = MESSAGE.CONNECTION_ERROR;
                await dialogs.alert(MESSAGE.CONNECTION_ERROR, { title: "Error de conexión" });
            } else {
                logFile.message = error.message;
                await dialogs.alert(error.message, { title: error.response?.statusText });
            }
        } else if (error instanceof Error) {
            logFile.message = error.message;
            await dialogs.alert(error.message, { title: error.name });
        } else {
            logFile.message = MESSAGE.UNKNOWN_ERROR;
            await dialogs.alert(MESSAGE.UNKNOWN_ERROR, { title: "Error" });
        }

        await logTimeWebApi.writeLogToFileAsync(logFile);
    };

    const showBusyDialog = (open: boolean, message: string) => setBusyDialogState({ open, message });

    //const donwlodLogFile = () => {
    //    const file = new File([logData.content], `${logFile.userId}.log`, { type: "text/plain;charset=utf-8" });
    //    saveAs(file);
    //}

    const getLogFile = async () => {

        try {
            showBusyDialog(true, "Cargando, por favor espere");

            logFile.method = "getLogFile";

            if (logFile.roleId == 1 || logFile.roleId == 2) {

                const userId = await dialogs.prompt("UserId", { title: "" });

                if (userId == null)
                    return;

                logFile.managerId = userSession.user?.id;
                logFile.userId = userId.padStart(8, '0');

            }
            else {
                logFile.userId = userSession.user?.id;
            }

            const response = await logTimeWebApi.getLogFileAsync(logFile);

            if (response == "Unauthorized") {
                dialogs.alert(`Empleado con ID ${logFile.userId} no pertenece a los grupos departamentales que tienes asignados. Si esta información es incorrecta, por favor contacte al departamento de IT.`, { title: "No autorizado" });
                return;
            }

            setLogData({ title: `${logFile.userId}.log`, content: response });
            showBusyDialog(false, "");

        } catch (e) {
            handleError(e);
        }
        finally {
            showBusyDialog(false, "");
        }
    }

    const handleLogOut = async () => {

        if (userSession.user != null) {

            const logoutData: SessionLogOutData = {
                id: userSession.historyLogId,
                loggedOutBy: userSession.user.id,
                userIds: userSession.user.id
            }

            logFile.method = "handleLogOut";
            logFile.message = "User clicked logout button";
            await logTimeWebApi.writeLogToFileAsync(logFile);

            showBusyDialog(true, "Cerrando sesión, por favor espere");
            const response = await logTimeWebApi.closeSessionAsync(logoutData);

            if (response.isSessionAlreadyClose) {
                logFile.message = "Session closed";
                await logTimeWebApi.writeLogToFileAsync(logFile);

                logOut();
                showBusyDialog(false, "");
                navigate("/login")
            }
        }
    }

    return (
        <>
            <Dialog sx={{ '& .MuiDialog-paper': { width: '60%', maxWidth: '60%' } }} open={logData.content != ""} onClose={() => { setLogData({ title: "", content: "" }) }}>
                <DialogTitle>{`${logData.title}`}</DialogTitle>
                <DialogContent >
                    <Box
                        sx={{
                            fontFamily: 'Courier New, monospace', 
                            whiteSpace: 'pre',
                            overflowX: 'auto',
                            backgroundColor: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '4px',
                        }}
                    >
                        <pre>{logData.content}</pre>
                    </Box>
                   
                </DialogContent>
                <DialogActions>
                    {/*<Button variant="outlined" onClick={donwlodLogFile} color="success">*/}
                    {/*    Download*/}
                    {/*</Button>*/}

                    <Button variant="outlined" onClick={() => { setLogData({ title: "", content: "" }) }} color="error">
                        Close
                    </Button>


                </DialogActions>
            </Dialog>

            <AppBar sx={{ bgcolor: "#30445f" }}>

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

                                {userSession.user != null && (
                                    <MenuItem onClick={getLogFile}>
                                        <Typography color="white" sx={{ textAlign: 'center' }}>Log</Typography>
                                    </MenuItem>
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

                            {userSession.user != null && (
                                <MenuItem onClick={getLogFile}>
                                    <Typography color="white" sx={{ textAlign: 'center' }}>Log</Typography>
                                </MenuItem>
                            )}
                            
                        </Box>
                        {userSession.user != null && (
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
                                            {userSession.user.firstName + " " + userSession.user.lastName}
                                        </Typography>
                                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                            Proyecto: {userSession.user?.project.project_Desc}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" mb={3}>
                                            ID: {userSession.user.id}
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
                        )}
                    </Toolbar>
                </Container>
            </AppBar>
        </>
    );
}
export default Header;

