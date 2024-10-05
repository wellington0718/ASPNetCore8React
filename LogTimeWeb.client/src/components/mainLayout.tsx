import React from "react";
import Header from "./header";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div>
            <Header />
            {children}

            <footer className="bg-[#0065b1] fixed bottom-0 left-0 w-full p-4 text-white">© {new Date().getFullYear()} SYNERGIES CORP. All rights reserved</footer>
        </div>
    );
}
export default MainLayout;