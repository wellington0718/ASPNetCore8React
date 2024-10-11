import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { getUserSession } from '../services/sessionService';

const ProtectedRoutes = () => {
    const user = getUserSession().user;
    const localtion = useLocation();

    return (user ? (<Outlet />) : (<Navigate to="/logtimeweb/login" state={localtion} />));

}

export default ProtectedRoutes