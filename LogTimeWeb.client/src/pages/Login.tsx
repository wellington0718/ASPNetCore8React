import { Box, Card, Typography, TextField, InputAdornment, IconButton, Button, Avatar } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { signIn } from '../services/sessionService';
import { Credential, IFetchSessionData, SessionLogOutData, INewSessionData, BusyDialogState } from "../types";
import LogTimeWebApi from "../repositories/logTimeWebApi";
import { useDialogs } from '@toolpad/core';
import BusyDialog from "../components/busyDialog";
import { Person, Key, VisibilityOff, Visibility } from "@mui/icons-material";
import { AxiosError } from "axios";
import MainLayout from "../components/mainLayout";

const Login = () => {

    const MESSAGE = {
        VERIFY_CREDENTIALS: "Verificando credenciales, por favor espere",
        FETCH_SESSIONS: "Buscando sesiones abiertas, por favor espere",
        CREATE_SESSION: "Creando sesión, por favor espere",
        UNKNOWN_ERROR: "Error desconocido. Por favor comunicarse con el departamento de IT.",
        ACTIVE_SESSION: "Ya existe una sesión activa. Deseas cerrarla para continuar?",
        INVALID_CREDENTIAL: "Las credenciales no son validas.",
        Close_SESSION: "Cerrando sesión, por favor espere",
        CONNECTION_ERROR: "No se pudo establecer comunicación con el servidor. Por favor verifique su conexión a la red/internet.",
        NONE: ""
    };

    const [showPassword, setShowPassword] = useState(false);
    const [busyDialogState, setBusyDialogState] = useState<BusyDialogState>({ open: false, message: "" });
    const [credential, setCredential] = useState<Credential>({ userId: "", password: "" });
    const { register, handleSubmit, formState: { errors } } = useForm<Credential>({ mode: "onSubmit" });
    const navigate = useNavigate();
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

        const baseResponse = await logTimeWebApi.closeSession(logoutData);

        if (baseResponse.isSessionAlreadyClose) {
            await createNewSession(credential.userId);
        }
    };

    const createNewSession = async (userId: string) => {
        showBusyDialog(true, MESSAGE.CREATE_SESSION);
        const sessionData: INewSessionData = await logTimeWebApi.openSession(userId);
        signIn(sessionData);
        navigate("/LogTimeWeb/UserSession");
    };

    const handleError = async (error: unknown) => {
        if (error instanceof AxiosError) {
            if (error.response?.data.includes("network-related")) {
                await dialogs.alert(MESSAGE.CONNECTION_ERROR, { title: "Error de conexión" });
            } else {
                await dialogs.alert(error.message, { title: error.response?.statusText });
            }
        } else if (error instanceof Error) {
            await dialogs.alert(error.message, { title: error.name });
        } else {
            await dialogs.alert(MESSAGE.UNKNOWN_ERROR, { title: "Error" });
        }
    };

    const handleLogin = async (credential: Credential) => {
        try {

            showBusyDialog(true, MESSAGE.VERIFY_CREDENTIALS);
            const baseResponse = await logTimeWebApi.ValidateUser(credential);

            if (baseResponse.title == "Unauthorized") {
                await dialogs.alert(MESSAGE.INVALID_CREDENTIAL, { title: "No autorizado" });
                showBusyDialog(false, MESSAGE.NONE);
                return;
            }

            showBusyDialog(true, MESSAGE.FETCH_SESSIONS);
            const fetchedSession: IFetchSessionData = await logTimeWebApi.fetchSession(credential.userId);

            if (fetchedSession.isAlreadyOpened) {
                showBusyDialog(false, MESSAGE.NONE);
                const option = await dialogs.confirm(MESSAGE.ACTIVE_SESSION, { title: "Sesión activa" });

                if (option) {
                    await closeAndOpenSession(fetchedSession, credential);
                }
            }
            else {

                await createNewSession(credential.userId);
            }
        } catch (error) {

            handleError(error);
        }
        finally {
            showBusyDialog(false, MESSAGE.NONE);
        }
    };

    return (
        <MainLayout>
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
        </MainLayout>
    );
}

export default Login;
