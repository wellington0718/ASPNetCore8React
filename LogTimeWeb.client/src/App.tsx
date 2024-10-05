import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import './App.css';
import Login from './pages/Login';
import ProtectedRoutes from './components/protectedRoutes';
import UserSession from './pages/home';
import { DialogsProvider } from '@toolpad/core/useDialogs';

const router = createBrowserRouter([
    {
        element: <ProtectedRoutes />,
        children: [
            {
                path: "LogTimeWeb/UserSession",
                element: <UserSession />,
                //errorElement: <Error />
            },
            {
                path: "/LogTimeWeb",
                element: <Navigate to="/LogTimeWeb/UserSession"/>,
            },
        ]
    },
    {
        path: "LogTimeWeb/login",
        element: <Login />,
       // errorElement: <Error />
    },
]);

const App = () => {
    return <DialogsProvider><RouterProvider router={router} /></DialogsProvider>;
}
    export default App;