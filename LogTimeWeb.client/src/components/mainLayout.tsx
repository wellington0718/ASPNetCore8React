import Header from "./header";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
    return (
        <div>
            <Header />
            <Outlet />

            <footer className="bg-[#0d3b70] fixed bottom-0 left-0 w-full p-4 text-white">© {new Date().getFullYear()} SYNERGIES CORP. All rights reserved</footer>
        </div>
    );
}
export default MainLayout;