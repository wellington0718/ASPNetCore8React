import { experimentalStyled as styled, Box, Button, Stack, Typography, MenuItem, Select, Paper } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ExitToApp, Refresh } from '@mui/icons-material';
import { useMemo, useRef, useState } from 'react';
import LogTimeWebApi from '../repositories/logTimeWebApi';
import { SessionLogOutData, BusyDialogState, ActivityChange, SessionData, LogFile, MESSAGE } from '../types';
import moment from 'moment';
import useSessionTimer from '../hooks/useSessionTimer';
import BusyDialog from '../components/busyDialog';
import { useDialogs } from '@toolpad/core';
import useSessionManager from '../hooks/useSessionManager';
import { getUserSession, saveUserSession } from '../services/sessionService';

const Home = () => {
    const sessionManager = useSessionManager();
    const logTimeWebApi = useMemo(() => new LogTimeWebApi(), []);
    const userSessionRef = useRef<SessionData>(getUserSession());
    const [busyDialogState, setBusyDialogState] = useState<BusyDialogState>({ open: false, message: "" });
    const [serverLastContact, setServerLastContact] = useState(userSessionRef.current.serverLastContact);
    const { sessionTime, activityTime } = useSessionTimer(logTimeWebApi, userSessionRef, setServerLastContact);
    const [currentActivity, setCurrentActivity] = useState(userSessionRef.current.selectedActivityId);
    const dialogs = useDialogs();
    const showBusyDialog = (open: boolean, message: string) => setBusyDialogState({ open, message });

    const logFile: LogFile = {
        userId: userSessionRef.current.user?.id,
        roleId: userSessionRef.current.user?.roleId,
        component: "Home"
    }

    const changeActivity = async (newActivityId: number) => {

        try {

            const isRefreshing = userSessionRef.current.selectedActivityId == newActivityId;

            const activityChange: ActivityChange = {
                currentActivityLogId: userSessionRef.current.activityLogId,
                newActivityId
            }

            const activityName = userSessionRef.current.user?.project.availableActivities.find(activity => activity.id == newActivityId)?.description;

            logFile.method = "changeActivity";


            if (!isRefreshing && (userSessionRef.current.selectedActivityId == 3 && (userSessionRef.current.activityTotalSecs / 60 < 2))) {
                const confirmMessage = "Terminar la actividad de Break antes de que hayan transcurrido 2 minutos puede causar inconsistencias al registrar la actividad. ¿Deseas continuar?";

                const option = await dialogs.confirm(confirmMessage, { title: "Advertencia", severity:"warning" });

                if (!option) {
                    return;
                }
            }
            else if (isRefreshing) {

                logFile.message = "Updating session.";
                showBusyDialog(true, "Updating sesión, por favor expere.");
                await logTimeWebApi.writeLogToFileAsync(logFile);
            }
            else {

                logFile.message = `Switching to ${activityName} activity`;
                showBusyDialog(true, `Cambiando a la actividad de ${activityName}, por favor espere.`);
                await logTimeWebApi.writeLogToFileAsync(logFile);
            }

            const activityLog = await logTimeWebApi.changeActivityAsync(activityChange);

            if (activityLog.isSessionAlreadyClose) {

                logFile.message = MESSAGE.SESSION_CLOSED;
                await logTimeWebApi.writeLogToFileAsync(logFile);
                await dialogs.alert(MESSAGE.SESSION_CLOSED, { title: "Sesión terminada" });
                sessionManager.logOut();
                return;
            }

            if (!activityLog.hasError) {
                logFile.message = isRefreshing ? "Session updated" : `Activity switched to ${activityName}`;
                await logTimeWebApi.writeLogToFileAsync(logFile);
                userSessionRef.current.selectedActivityId = newActivityId;

                if (newActivityId == 2) {
                    handleLogOut();
                    return;
                }

                userSessionRef.current.activityLogId = activityLog.id;
                setCurrentActivity(newActivityId);
                const sessionAlive = await logTimeWebApi.updateSessionAliveDateAsync(userSessionRef.current.historyLogId);

                userSessionRef.current.serverLastContact = moment(sessionAlive.lastDate).format("YYYY-MM-DD HH:mm:ss");
                userSessionRef.current.activityTotalSecs = 0;
                setServerLastContact(userSessionRef.current.serverLastContact);
                saveUserSession(userSessionRef.current);
                showBusyDialog(false, "");
            }
            else {
                await dialogs.alert(activityLog.message, { title: "Error" });
            }

        } catch (e) {
            sessionManager.handleError(e, logFile);
        }
    }

    const Item = styled(Paper)(({ theme }) => ({
        backgroundColor: '#fff',
        textAlign: 'center',
        color: theme.palette.text.secondary,
        ...theme.applyStyles('dark', {
            backgroundColor: '#1A2027',
        }),
    }));

    const handleLogOut = async () => {
        logFile.method = "handleLogOut";

        if (userSessionRef.current.user != null) {
            const logoutData: SessionLogOutData = {
                id: userSessionRef.current.historyLogId,
                loggedOutBy: userSessionRef.current.user.id,
                userIds: userSessionRef.current.user.id
            }

            const isLunch = userSessionRef.current.selectedActivityId == 2;

            logFile.message = isLunch ? "Cerrando sessión por tiempo de Lunch." : "User clicked logout button";
            const logOutMessage = isLunch
                ? "Cerrando sessión por tiempo de Lunch, por favor espere."
                : "Cerrando sesión, por favor espere";

            showBusyDialog(true, logOutMessage);
            await logTimeWebApi.writeLogToFileAsync(logFile);

            const response = await logTimeWebApi.closeSessionAsync(logoutData);

            if (!response.hasError) {
                logFile.message = "Session closed";
                await logTimeWebApi.writeLogToFileAsync(logFile);
                sessionManager.logOut();
            }
        }
    }

    return (
        <>
            <BusyDialog {...busyDialogState} />
            <Stack style={{ background: '#0d3b70', borderRadius: '0.375rem' }} >

                <Stack direction="row" spacing={2} justifyContent="flex-end" className="my-3 px-2">

                    <Button onClick={() => changeActivity(currentActivity)}
                        variant="contained"
                        startIcon={<Refresh />}
                        style={{ background: '#1F2226' }}
                    >
                        Actualizar
                    </Button>
                    <Button onClick={handleLogOut}
                        variant="contained"
                        startIcon={<ExitToApp />}
                        style={{ background: '#1F2226' }}
                    >
                        Salir
                    </Button>
                </Stack>

                <Box sx={{ flexGrow: 1 }} className="p-2">
                    <Grid container spacing={{ xs: 2 }} columns={{ xs: 4, sm: 8, md: 12 }}>

                        <Grid size={{ xs: 2, sm: 4, md: 6 }} >
                            <Item>
                                <Typography variant="body2">Inicio de sesión:</Typography>
                                <Typography variant="body1">
                                    {userSessionRef.current?.loginTime}
                                </Typography>
                            </Item>
                        </Grid>
                        <Grid size={{ xs: 2, sm: 4, md: 6 }}>
                            <Item>
                                <Typography variant="body2">Tiempo de sesión:</Typography>
                                <Typography variant="body1">
                                    {sessionTime}
                                </Typography>
                            </Item>
                        </Grid>

                        <Grid size={{ xs: 2, sm: 4, md: 6 }}>
                            <Item>
                                <Typography variant="body2">Tiempo de actividad:</Typography>
                                <Typography variant="body1">
                                    {activityTime}
                                </Typography>
                            </Item>
                        </Grid>
                        <Grid size={{ xs: 2, sm: 4, md: 6 }}>
                            <Item>
                                <Typography variant="body2">Conexión servidor:</Typography>
                                <Typography variant="body1">
                                    {serverLastContact}
                                </Typography>
                            </Item>
                        </Grid>
                    </Grid>
                </Box>

                <Stack direction="row" spacing={2} justifyContent="center" className="my-3" alignItems="center">
                    <Typography variant="body1" className="text-white mt-2">
                        Actividad:
                    </Typography>
                    <Select variant="outlined"
                        sx={{ color: "white" }}
                        value={currentActivity}
                        onChange={(e) => changeActivity(Number(e.target.value))}
                        style={{ width: '300px', borderRadius: '0.375rem' }} >
                        {userSessionRef.current.user?.project.availableActivities.map(activity => (
                            <MenuItem key={activity.id} value={activity.id}>
                                {activity.description}
                            </MenuItem>
                        ))}
                    </Select>
                </Stack>

            </Stack>
        </>
    );
};

export default Home;
