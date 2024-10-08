import { useCallback, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import moment from 'moment';
import CryptoJS from 'crypto-js';
import { AxiosError } from 'axios';
import { INewSessionData, LogFile, MESSAGE, SessionData } from '../types';
import { useDialogs } from '@toolpad/core';
import LogTimeWebApi from '../repositories/logTimeWebApi';

const useSessionManager = () => {

    const dialogs = useDialogs();
    const logTimeWebApi = useMemo(() => new LogTimeWebApi(), []);
    const navigate = useNavigate();
    // Function to fill session data
    const fillSessionData = useCallback((newSessionData: INewSessionData): SessionData => {
        const loginTime = moment(newSessionData.activeSession.startDate).format("YYYY-MM-DD HH:mm:ss");

        const sessionData: SessionData = {
            user: newSessionData.user,
            activityLogId: newSessionData.activeSession.actualStatusHistoryId,
            historyLogId: newSessionData.activeSession.actualLogHistoryId,
            selectedActivityId: 1,
            loginTime: loginTime,
            serverLastContact: loginTime,
            activityTotalSecs: 0,
            sessionTotalSecs: 0,
            activityTime: "00:00:00",
            sessionTime: "00:00:00",
            generalTimeSpan: "",
            idleTimeSpan: "",
            loggedOutBy: "",
        }

        if (sessionData.user?.projectGroup != null) {
            sessionData.user.group = {
                id: sessionData.user.projectGroup.id,
                name: sessionData.user.projectGroup.name,
                description: sessionData.user.projectGroup.groupDescription,
                projectId: sessionData.user.projectGroup.projectId,
                logOutTime: sessionData.user.projectGroup.logOutTime
            };
        }

        return sessionData;
    }, []);

    // Function to handle user sign in
    const signIn = useCallback((userSession: INewSessionData) => {
        const sessionData = fillSessionData(userSession);
        const cipherText = CryptoJS.AES.encrypt(JSON.stringify(sessionData), "userSession").toString();
        sessionStorage.setItem("userSession", cipherText);
        navigate("/UserSession");
    }, [fillSessionData, navigate]);

    // Function to log out the user
    const logOut = useCallback(() => {
        sessionStorage.removeItem("userSession");
        navigate("/login");
    }, [navigate]);

    // Function to get the current user session
    const getUserSession = useCallback((): SessionData => {
        const cipherUserSessionStr = sessionStorage.getItem("userSession");

        if (cipherUserSessionStr != null) {
            const userSessionStr = CryptoJS.AES.decrypt(cipherUserSessionStr, "userSession");
            return userSessionStr ? JSON.parse(userSessionStr.toString(CryptoJS.enc.Utf8)) as SessionData : new SessionData();
        }

        return new SessionData();
    }, []);

    // Function to save the current user session
    const saveUserSession = useCallback((userSession: SessionData) => {
        const cipherText = CryptoJS.AES.encrypt(JSON.stringify(userSession), "userSession").toString();
        sessionStorage.setItem("userSession", cipherText);
    }, []);

    // Function to handle errors
    const handleError = useCallback(async (error: unknown, logFile: LogFile) => {
        logFile.method = "handleError";
        let isNetworkAvailable: boolean = true;

            if (error instanceof AxiosError) {
                if (error.response?.data.includes("network-related")) {
                    isNetworkAvailable = false;
                    logFile.message = MESSAGE.CONNECTION_ERROR;
                    await dialogs.alert(MESSAGE.CONNECTION_ERROR, { title: "Error de red" });
                } else {
                    logFile.message = error.message;
                    await dialogs.alert(error.message, { title: error.response?.statusText });
                }
            } else if (error instanceof Error) {
                logFile.message = error.message;
                await dialogs.alert(error.message, { title: error.name });
            } else {
                logFile.message = MESSAGE.UNKNOWN_ERROR;
                await dialogs.alert(MESSAGE.UNKNOWN_ERROR, { title: "Error" });
            }

            if (isNetworkAvailable)
                await logTimeWebApi.writeLogToFileAsync(logFile);

    }, [dialogs, logTimeWebApi]);

    return {
        signIn,
        logOut,
        getUserSession,
        saveUserSession,
        handleError
    };
};

export default useSessionManager;
