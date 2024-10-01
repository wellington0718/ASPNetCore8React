import { Box, Card, Typography, TextField, InputAdornment, IconButton, Button, Avatar } from "@mui/material";
import { Person, Key, Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { login,  } from '../services/sessionService';
import { UserSession } from "../types";
export default function LoginForm() {
    interface IFormInput {
        userId: string
        password: string
    }

    const [showPassword, setShowPassword] = useState(false);
    const [credential, setCredential] = useState<IFormInput>({ userId: "", password: "" });
    const { register, handleSubmit, formState: { errors } } = useForm<IFormInput>();
    const navigate = useNavigate();

    const handleShowHidePassword = () => setShowPassword(!showPassword);

    const handleLogin = (data: IFormInput) => {
        const userSession: UserSession = {
            user: {
                id: data.userId
            }
        }

        login(userSession);
        console.log(data)
        navigate("/LogTimeWeb/UserSession")
    };

    return (
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
                <Typography variant="h4" color="white" mb={4}>
                    LogtimeWeb
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
                    onChange={(e) => setCredential({ ...credential, userId: e.target.value })}
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
                    onChange={(e) =>
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
    );
}
