import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { getUserSession } from '../services/sessionService';

const ProtectedRoutes = () => {
    const userSession = getUserSession();
    const localtion = useLocation();

    return (userSession ? (<Outlet />) : (<Navigate to="LogTimeWeb/login" state={localtion} />));

}

export default ProtectedRoutes