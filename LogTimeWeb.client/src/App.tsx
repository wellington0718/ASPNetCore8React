import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './App.css';
import { DialogsProvider } from '@toolpad/core/useDialogs';
import Home from './pages/home';
import MainLayout from './components/mainLayout';
import Login from './pages/login';
import ProtectedRoutes from './components/protectedRoutes';

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
                            path: "/logtimeweb/",
                            element: <Home />,
                            // errorElement: <Error />,
                        }

                    ],
                },
                {
                    path: "/logtimeweb/login",
                    element: <Login />,
                }
            ],
        },
    ],
);


const App = () => {
    return <DialogsProvider><RouterProvider router={router} /></DialogsProvider>;
}
export default App;