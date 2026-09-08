import { useState } from "react";
import LandingPage from "./components/LandingPage.jsx";
import WorkspaceLayout from "./components/workspace/WorkspaceLayout.jsx";

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem("aurabuild_access") === "true";
    });

    const [themeMode, setThemeMode] = useState("light");

    const [userData, setUserData] = useState({
        name: "Developer",
        email: "",
        theme: "modern_glass"
    });

    const handleToggleTheme = () => {
        setThemeMode(prev => prev === "light" ? "dark" : "light");
    };

    const handleLogout = () => {
        localStorage.removeItem("aurabuild_access");
        setIsAuthenticated(false);
        setUserData({
            name: "Developer",
            email: "",
            theme: "modern_glass"
        });
    };

    if (!isAuthenticated) {
        return ( <
            LandingPage onEnterWorkspace = {
                (data) => {
                    setUserData(prev => ({...prev, ...data }));
                    localStorage.setItem("aurabuild_access", "true");
                    setIsAuthenticated(true);
                }
            }
            />
        );
    }

    return ( <
        div className = { `min-h-screen ${themeMode === 'light' ? 'bg-slate-50' : 'bg-[#05050A]'}` } >
        <
        WorkspaceLayout userData = { userData }
        setUserData = { setUserData }
        themeMode = { themeMode }
        onToggleTheme = { handleToggleTheme }
        onLogout = { handleLogout }
        /> < /
        div >
    );
}