import { Box, Card, Typography, TextField, InputAdornment, IconButton, Button, Avatar } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { signIn } from '../services/sessionService';
import { Credential, IFetchSessionData, SessionLogOutData, INewSessionData } from "../types";
import LogTimeWebApi from "../repositories/logTimeWebApi";
import React from "react";
import { useDialogs } from '@toolpad/core';
import BusyDialog from "../components/busyDialog";
import { Person, Key, VisibilityOff, Visibility } from "@mui/icons-material";
import { AxiosError } from "axios";

 const Login = () => {

    type BusyDialogState = {
        open: boolean,
        message: string
    }

    const [showPassword, setShowPassword] = useState(false);
    const [busyDialogState, setBusyDialogState] = useState<BusyDialogState>({ open: false, message: "" });
    const [credential, setCredential] = useState<Credential>({ userId: "", password: "" });
    const { register, handleSubmit, formState: { errors } } = useForm<Credential>({ mode: "onSubmit" });
    const navigate = useNavigate();
    const dialogs = useDialogs();
    const logTimeWebApi = new LogTimeWebApi();

    const handleShowHidePassword = () => setShowPassword(!showPassword);

    const handleLogin = async (credential: Credential) => {
        try {
            setBusyDialogState(prev => ({ ...prev, open: true, message: "Verificando credenciales, por favor espere" }));

            let baseResponse = await logTimeWebApi.ValidateUser(credential);

            if (baseResponse.title == "Unauthorized") {
                await dialogs.alert("Las credenciales no son validas", { title: "No autorizado" });
                return;
            }

            setBusyDialogState(prev => ({ ...prev, open: true, message: "Buscando sesiones abiertas, por favor espere" }));
            const fetchedSession: IFetchSessionData = await logTimeWebApi.fetchSession(credential.userId);

            if (fetchedSession.isAlreadyOpened) {
                setBusyDialogState(prev => ({ ...prev, open: false, message: "Buscando sesiones abiertas, por favor espere" }));
                const option = await dialogs.confirm("Ya existe una sesión activa. Deseas cerrarla para continuar?", { title: "sesión activa" });

                if (option) {
                    const logoutData: SessionLogOutData = {
                        id: fetchedSession.id,
                        loggedOutBy: credential.userId,
                        userIds: credential.userId
                    }

                    baseResponse = await logTimeWebApi.closeSession(logoutData);

                    if (baseResponse.isSessionAlreadyClose) {

                        setBusyDialogState(prev => ({ ...prev, open: false, message: "Creando nueva sesión, por favor espere" }));
                        const sessionData: INewSessionData = await logTimeWebApi.openSession(credential.userId);
                        signIn(sessionData);
                        navigate("/LogTimeWeb/UserSession")
                    }
                }
            }
            else {

                setBusyDialogState(prev => ({ ...prev, open: false, message: "Creando sesión, por favor espere" }));
                const sessionData: INewSessionData = await logTimeWebApi.openSession(credential.userId);
                signIn(sessionData);
                navigate("/LogTimeWeb/UserSession")
            }
        } catch (error) {

            if (error instanceof AxiosError) {

                setBusyDialogState(prev => ({ ...prev, open: false, message: "" }));

                if (error.response?.data.includes("network-related")) {
                    await dialogs.alert("No se pudo establecer comunicación con el servidor. Por favor verificar su conexión a la red/internet.", { title: "Error de conexión" });
                } else {
                    await dialogs.alert(error.message, { title: error.response?.statusText });
                }
                
            } else if (error instanceof Error) {
                await dialogs.alert(error.message, { title: error.name });
            } else {

                await dialogs.alert("Error desconocido. Por fovaror cominicarse con el departament de IT", { title: "Error" });
            }
        }
    };

    return (
        <React.Fragment>
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
        </React.Fragment>
    );
}

export default Login;
