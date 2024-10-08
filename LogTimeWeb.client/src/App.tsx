import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import './App.css';
import Login from './pages/Login';
import ProtectedRoutes from './components/protectedRoutes';
import { DialogsProvider } from '@toolpad/core/useDialogs';
import Home from './pages/home';
import MainLayout from './components/mainLayout';

const router = createBrowserRouter(
    [
        {
            path: "/",
            element: <MainLayout />,
            children: [
                {
                    element: <ProtectedRoutes />,
                    children: [
                        {
                            path: "/",
                            element: <Home />,
                            // errorElement: <Error />,
                        },
                        {
                            path: "UserSession",
                            element: <Home />,
                            // errorElement: <Error />,
                        },
                    ],
                },
                {
                    path: "login",
                    element: <Login />,
                    // errorElement: <Error />,
                },
            ],
        },
    ],
    { basename: "/LogTimeWeb" }
);


const App = () => {
    return <DialogsProvider><RouterProvider router={router} /></DialogsProvider>;
}
export default App;