import { experimentalStyled as styled, Box, Button, Stack, Typography, MenuItem, Select, Paper } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ExitToApp, Refresh } from '@mui/icons-material';
import { useMemo, useRef, useState } from 'react';
import LogTimeWebApi from '../repositories/logTimeWebApi';
import { SessionLogOutData, BusyDialogState, ActivityChange, SessionData, LogFile } from '../types';
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
    const { sessionTime, activityTime } = useSessionTimer(logTimeWebApi, userSessionRef, setServerLastContact, sessionManager.handleError);
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
            const activityChange: ActivityChange = {
                currentActivityLogId: userSessionRef.current.activityLogId,
                newActivityId
            }

            let refreshChangeActivityMessage: string;
            const activityName = userSessionRef.current.user?.project.availableActivities.find(activity => activity.id == newActivityId)?.description;

            if (userSessionRef.current.selectedActivityId == newActivityId)
                refreshChangeActivityMessage = "Actualizando datos de sesión, por favor expere.";
            else
                refreshChangeActivityMessage = `Cambiando a la actividad ${activityName}, por favor espere.`;
            showBusyDialog(true, refreshChangeActivityMessage);


            logFile.method = "changeActivity";

            const confirmMessage = "Has decidido cambiar tu estado a Break. Sin embargo, llevas menos de 2 minutos en este estado, lo que podría causar que no se registre correctamente. ¿Deseas continuar?";

            if (userSessionRef.current.selectedActivityId == 3 && (userSessionRef.current.activityTotalSecs / 60 < 2)) {
                const option = await dialogs.confirm(confirmMessage, { title: "Cambio de actividad" });
                logFile.message = `The user switched to from Break '${activityName}' and was informed that with less than 2 minutes elapsed, the break activity might not log correctly and decided to `;

                if (!option) {
                    logFile.message += "cancel the change."
                    await logTimeWebApi.writeLogToFileAsync(logFile);
                    return;
                } else {

                    logFile.message += "proceed with the change."
                }

                await logTimeWebApi.writeLogToFileAsync(logFile);
            }

            const activeLog = await logTimeWebApi.changeActivityAsync(activityChange);

            if (!activeLog.hasError) {

                userSessionRef.current.activityLogId = activeLog.id;
                if (newActivityId == 2) {
                    //const option = await dialogs.confirm("La sesión será finalizada debido al estado de Lunch. ¿Deseas continuar?", { title: "Cambio de actividad" });

                    //if (!option)
                    //    return;
                    logFile.message = "Session was closed due to user switched to Lunch activity"
                    await logTimeWebApi.writeLogToFileAsync(logFile);
                    handleLogOut();
                }
                else {
                    setCurrentActivity(newActivityId);
                    userSessionRef.current.selectedActivityId = newActivityId;
                    const sessionAlive = await logTimeWebApi.updateSessionAliveDateAsync(userSessionRef.current.historyLogId);

                    userSessionRef.current.serverLastContact = moment(sessionAlive.lastDate).format("YYYY-MM-DD HH:mm:ss");
                    userSessionRef.current.activityTotalSecs = 0;
                    setServerLastContact(userSessionRef.current.serverLastContact);
                    saveUserSession(userSessionRef.current);

                    logFile.message = `activity changed to ${activityName}`
                    await logTimeWebApi.writeLogToFileAsync(logFile);
                }

            }
        } catch (e) {
            sessionManager.handleError(e, logFile);
        }
        finally {
            showBusyDialog(false, "");
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

        try {
            if (userSessionRef.current.user != null) {
                const logoutData: SessionLogOutData = {
                    id: userSessionRef.current.historyLogId,
                    loggedOutBy: userSessionRef.current.user.id,
                    userIds: userSessionRef.current.user.id
                }

                showBusyDialog(true, "Cerrando sesión, por favor espere");

                logFile.method = "handleLogOut";
                logFile.message = "User clicked logout button";
                await logTimeWebApi.writeLogToFileAsync(logFile);

                const response = await logTimeWebApi.closeSessionAsync(logoutData);

                if (response.isSessionAlreadyClose) {
                    logFile.message = "Session closed";
                    await logTimeWebApi.writeLogToFileAsync(logFile);
                    sessionManager.logOut();
                    showBusyDialog(false, "");

                }
            }
        } catch (e) {
            sessionManager.handleError(e, logFile);
        }
    }

    return (
        <>
            <BusyDialog {...busyDialogState} />
            <Stack style={{ background: '#30445F', borderRadius: '0.375rem' }} >

                <Stack direction="row" spacing={2} justifyContent="flex-end" className="my-3 px-2">

                    <Button onClick={() => changeActivity(currentActivity)}
                        variant="contained"
                        startIcon={<Refresh />}
                        style={{ background: '#1F2226', borderRadius: '0.375rem' }}
                    >
                        Refrescar
                    </Button>
                    <Button onClick={handleLogOut}
                        variant="contained"
                        startIcon={<ExitToApp />}
                        style={{ background: '#1F2226', borderRadius: '0.375rem' }}
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
