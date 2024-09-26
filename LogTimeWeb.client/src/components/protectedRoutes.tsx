import { Navigate, useLocation, Outlet } from 'react-router-dom';


const ProtectedRoutes = () => {
    const userId: string | null = sessionStorage.getItem("UserId")
    const localtion = useLocation();

    return (userId ? (<Outlet />) : (<Navigate to="LogTimeWeb/login" state={localtion} />));

}

export default ProtectedRoutes