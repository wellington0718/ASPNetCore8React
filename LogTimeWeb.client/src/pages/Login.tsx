import { Box, Card, Typography, TextField, InputAdornment, IconButton, Button, Avatar } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Credential, IFetchSessionData, SessionLogOutData, INewSessionData, BusyDialogState, LogFile, MESSAGE } from "../types";
import LogTimeWebApi from "../repositories/logTimeWebApi";
import { useDialogs } from '@toolpad/core';
import BusyDialog from "../components/busyDialog";
import { Person, Key, VisibilityOff, Visibility } from "@mui/icons-material";
import useSessionManager from "../hooks/useSessionManager";

const Login = () => {

    const logFile: LogFile = { component: "Login" };
    const [showPassword, setShowPassword] = useState(false);
    const [busyDialogState, setBusyDialogState] = useState<BusyDialogState>({ open: false, message: "" });
    const [credential, setCredential] = useState<Credential>({ userId: "", password: "" });
    const { register, handleSubmit, formState: { errors } } = useForm<Credential>({ mode: "onSubmit" });
    const sessionManager = useSessionManager();
    const dialogs = useDialogs();
    const logTimeWebApi = new LogTimeWebApi();

    const showBusyDialog = (open: boolean, message: string) => setBusyDialogState({ open, message });
    const handleShowHidePassword = () => setShowPassword(!showPassword);

    const closeAndOpenSession = async (fetchedSession: IFetchSessionData, credential: Credential) => {
        const logoutData: SessionLogOutData = {
            id: fetchedSession.id,
            loggedOutBy: credential.userId,
            userIds: credential.userId
        };

        showBusyDialog(true, MESSAGE.CLOSE_SESSION);
        logFile.method = "closeAndOpenSession";
        logFile.message = "Closing opened session.";
        await logTimeWebApi.writeLogToFileAsync(logFile);

        const baseResponse = await logTimeWebApi.closeSessionAsync(logoutData);

        showBusyDialog(false, MESSAGE.NONE);

        logFile.message = "Opened session Closed.";
        await logTimeWebApi.writeLogToFileAsync(logFile);

        if (baseResponse.isSessionAlreadyClose) {
            await createNewSession(credential.userId);
        }
    };

    const createNewSession = async (userId: string) => {
        showBusyDialog(true, MESSAGE.CREATE_SESSION);

        logFile.method = "createNewSession";
        logFile.message = "Creating new session.";

        await logTimeWebApi.writeLogToFileAsync(logFile);

        const sessionData: INewSessionData = await logTimeWebApi.openSessionAsync(userId);

        logFile.message = "New session created";
        await logTimeWebApi.writeLogToFileAsync(logFile);
        sessionManager.signIn(sessionData);
    };

    const handleLogin = async (credential: Credential) => {
        try {

            showBusyDialog(true, MESSAGE.VERIFY_CREDENTIALS);

            logFile.method = "handleLogin";
            logFile.message = "User submitted login form";
            logFile.userId = credential.userId

            await logTimeWebApi.writeLogToFileAsync(logFile);

            const baseResponse = await logTimeWebApi.validateUserAsync(credential);
            showBusyDialog(false, MESSAGE.NONE);

            if (baseResponse.title == "Unauthorized") {
                await dialogs.alert(MESSAGE.INVALID_CREDENTIAL, { title: "No autorizado" });
                return;
            }

            showBusyDialog(true, MESSAGE.FETCH_SESSIONS);
            const fetchedSession: IFetchSessionData = await logTimeWebApi.fetchSessionAsync(credential.userId);
            showBusyDialog(false, MESSAGE.NONE);

            if (fetchedSession.isAlreadyOpened) {
                const option = await dialogs.confirm(MESSAGE.ACTIVE_SESSION, { title: "Sesión activa" });

                if (option) {
                    await closeAndOpenSession(fetchedSession, credential);
                }
            }
            else {

                await createNewSession(credential.userId);
            }

        } catch (error) {

            sessionManager.handleError(error, logFile);
        }
        finally {
            showBusyDialog(false, MESSAGE.NONE);
        }
    };

    return (
        <>
            <BusyDialog {...busyDialogState} />
            <Box className="bg-[#1F2226]"
                component="form"
                onSubmit={handleSubmit(handleLogin)}
                sx={{
                    width: { xs: "80%", md: "65%" },
                    mx: "auto",
                    borderRadius: 2,
                    boxShadow: 5,
                    p: 2,
                }}
            >

                <Box textAlign="center">
                    <Avatar
                        src="images/icon.png"
                        alt="quasar logo"
                        sx={{ width: 80, height: 80, margin: "0 auto" }}
                    />

                    <Typography variant="h4" noWrap mb={4}
                        sx={{
                            mr: 2, fontFamily: 'monospace',
                            fontWeight: 700, letterSpacing: '.3rem', color: 'white'
                        }}>
                        LOGTIMEWEB
                    </Typography>

                </Box>

                <Card sx={{ p: 2 }} className="bg-[#1F2226]">
                    <TextField
                        label="Id de usuario"
                        variant="outlined"
                        autoComplete='off'
                        fullWidth
                        {...register("userId", { required: "User id is required" })}
                        error={!!errors.userId}
                        margin="normal"
                        helperText={errors.userId ? errors.userId.message : ""}
                        slotProps={{
                            input: {
                                startAdornment: (<InputAdornment position="start"> <Person sx={{ color: "#0065b1" }} /> </InputAdornment>)
                            }
                        }}
                        value={credential.userId}
                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => setCredential({ ...credential, userId: e.target.value })}
                    />

                    <TextField
                        label="Contraseña"
                        type={showPassword ? "text" : "password"}
                        variant="outlined"
                        fullWidth
                        autoComplete='off'
                        {...register("password", { required: "Password is required" })}
                        error={!!errors.password}
                        margin="normal"
                        helperText={errors.password ? errors.password.message : ""}
                        slotProps={{

                            input: {
                                startAdornment: (<InputAdornment position="start">  <Key sx={{ color: "#0065b1" }} /></InputAdornment>),

                                endAdornment: (<InputAdornment position="end">
                                    <IconButton onClick={handleShowHidePassword} edge="end">
                                        {showPassword ? (
                                            <VisibilityOff sx={{ color: "#0065b1" }} />
                                        ) : (
                                            <Visibility sx={{ color: "#0065b1" }} />
                                        )}
                                    </IconButton>
                                </InputAdornment>
                                )

                            }
                        }}
                        value={credential.password}
                        onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCredential({ ...credential, password: e.target.value })
                        }
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{
                            backgroundColor: "#0065b1",
                            padding: "12px 0",
                            borderRadius: "10px",
                            mt: 2,
                        }}
                    >
                        INICIAR SESIÓN
                    </Button>
                </Card>
            </Box>
        </>
    );
}

export default Login;
