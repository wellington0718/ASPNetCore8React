import { experimentalStyled as styled, Box, Button, Stack, Typography, MenuItem, Select, Paper } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ExitToApp, Refresh } from '@mui/icons-material';
import { useMemo, useRef, useState } from 'react';
import { logOut, getUserSession, saveUserSession } from '../services/sessionService';
import { useNavigate } from 'react-router-dom';
import LogTimeWebApi from '../repositories/logTimeWebApi';
import { SessionLogOutData } from '../types';
import moment from 'moment';
import useSessionTimer from '../hooks/useSessionTimer';

const Home = () => {

    const logTimeWebApi = useMemo(() => new LogTimeWebApi(), []);
    const userSessionRef = useRef(getUserSession());
    const [currentActivity, setCurrentActivity] = useState("1");
    const [serverLastContact, setServerLastContact] = useState(userSessionRef.current?.serverLastContact);
    const { sessionTime, activityTime } = useSessionTimer(logTimeWebApi, userSessionRef, setServerLastContact);
    const navigate = useNavigate();

    const changeActivity = async (activity: string) => {
        setCurrentActivity(activity);

        if (userSessionRef.current != null) {
            const response = await logTimeWebApi.updateSessionAliveDate(userSessionRef.current.historyLogId);
            userSessionRef.current.serverLastContact = moment(response.lastDate).format("YYYY-MM-DD HH:mm:ss");
            userSessionRef.current.activityTotalSecs = 0;
            setServerLastContact(userSessionRef.current.serverLastContact);
            saveUserSession(userSessionRef.current);
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

        if (userSessionRef.current != null) {
            const logoutData: SessionLogOutData = {
                id: userSessionRef.current.historyLogId,
                loggedOutBy: userSessionRef.current.user.id,
                userIds: userSessionRef.current.user.id
            }

            const response = await logTimeWebApi.closeSession(logoutData);

            if (response.isSessionAlreadyClose) {
                logOut();
                navigate("/LogTimeWeb/login")
            }
        }
    }

    return (
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
                    onChange={(e) => changeActivity(e.target.value)}
                    style={{ width: '300px', borderRadius: '0.375rem' }} >
                    {userSessionRef.current?.user.project.availableActivities.map(activity => (
                        <MenuItem key={activity.id} value={activity.id}>
                            {activity.description}
                        </MenuItem>
                    ))}
                </Select>
            </Stack>

        </Stack>
    );
};

export default Home;
