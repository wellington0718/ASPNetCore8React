import { experimentalStyled as styled, Box, Button, Stack, Typography, MenuItem, Select, Paper } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ExitToApp, Refresh } from '@mui/icons-material';
import { useStopwatch } from 'react-timer-hook';
import { useState, useRef } from 'react';
import { logout, } from '../services/sessionService';
import { useNavigate } from 'react-router-dom';

const SessionLayout = () => {
    const activities: string[] = ["No activity", "Lunch", "Break"];
    const [currentActivity, setCurrentActivity] = useState(activities[0]);

    const sessionTimer = useStopwatch({ autoStart: true });
    const activityTimer = useStopwatch({ autoStart: true });
    const date = new Date();
    const loginDate = useRef(`${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
    const serverContact = useRef(`${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
    const navigate = useNavigate();

    const formatTime = (hours: number, minutes: number, seconds: number) => {

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    };

    const changeActivity = (activity: string) => {
        setCurrentActivity(activity);
        serverContact.current = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        activityTimer.reset();
    }

    const Item = styled(Paper)(({ theme }) => ({
        backgroundColor: '#fff',
        textAlign: 'center',
        color: theme.palette.text.secondary,
        ...theme.applyStyles('dark', {
            backgroundColor: '#1A2027',
        }),
    }));

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
                <Button onClick={() => { logout(); navigate("/LogTimeWeb/login") } }
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
                            <Typography variant="body1">Inicio de sesión:</Typography>
                            <Typography variant="body1">
                                {/* {currentUsersSession?.LoginTime || '--:--'}*/}
                                {loginDate.current}
                            </Typography>
                        </Item>
                    </Grid>
                    <Grid size={{ xs: 2, sm: 4, md: 6 }}>
                        <Item>
                            <Typography variant="body2">Tiempo de sesión:</Typography>
                            <Typography>
                                {/*{currentUsersSession?.SessionTime || '--:--'}*/}
                                {formatTime(sessionTimer.hours, sessionTimer.minutes, sessionTimer.seconds)}
                            </Typography>
                        </Item>
                    </Grid>
                    <Grid size={{ xs: 2, sm: 4, md: 6 }}>
                        <Item>
                            <Typography variant="body2">Tiempo de actividad:</Typography>
                            <Typography>
                                {/*{currentUsersSession?.ActivityTime || '--:--'}*/}
                                {formatTime(activityTimer.hours, activityTimer.minutes, activityTimer.seconds)}
                            </Typography>
                        </Item>
                    </Grid>
                    <Grid size={{ xs: 2, sm: 4, md: 6 }}>
                        <Item>
                            <Typography variant="body2">Conexión servidor:</Typography>
                            <Typography>
                                {/*{currentUsersSession?.ServerLastContact || '--:--'}*/}
                                {serverContact.current}
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
                    {activities.map((activity: string, index: number) => (
                        <MenuItem key={index} value={activity}>
                            {activity}
                        </MenuItem>
                    ))}
                </Select>
            </Stack>

        </Stack>
    );
};

export default SessionLayout;
