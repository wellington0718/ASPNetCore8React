import moment from 'moment';
import { INewSessionData, SessionData } from '../types';
import CryptoJS from 'crypto-js';
//import { AxiosError } from 'axios';
//import logTimeWebApi from '../repositories/logTimeWebApi';
//import { useDialogs } from '@toolpad/core';

const FillSessionData = (newSessionData: INewSessionData): SessionData => {

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
        sessionData.user.group =
        {
            id: sessionData.user.projectGroup.id,
            name: sessionData.user.projectGroup.name,
            description: sessionData.user.projectGroup.groupDescription,
            projectId: sessionData.user.projectGroup.projectId,
            logOutTime: sessionData.user.projectGroup.logOutTime
        };
    }

    return sessionData;

    //logFileItem.Message = "Activity changed to: No Activity.";
    //logFileItem.Method = "FillSessionData";
    //LogManager.Log(logFileItem);
}

export const signIn = (userSession: INewSessionData) => {

    const sessionData = FillSessionData(userSession);
    const cipherText = CryptoJS.AES.encrypt(JSON.stringify(sessionData), "userSession").toString()
    sessionStorage.setItem("userSession", cipherText);
};

export const logOut = () => {
    sessionStorage.removeItem("userSession");
};

export const getUserSession = (): SessionData => {

    const cipherUserSessionStr = sessionStorage.getItem("userSession");

    if (cipherUserSessionStr != null) {
        const userSessionStr = CryptoJS.AES.decrypt(cipherUserSessionStr, "userSession");
        return userSessionStr ? JSON.parse(userSessionStr.toString(CryptoJS.enc.Utf8)) as SessionData : new SessionData();
    }

    return new SessionData();
};

export const saveUserSession = (userSession: SessionData) => {
    const cipherText = CryptoJS.AES.encrypt(JSON.stringify(userSession), "userSession").toString()
    sessionStorage.setItem("userSession", cipherText);
};

//export const handleError = async (error: unknown, logFile: LogFile) => {
//    logFile.method = "handleError";
//    const dialogs = useDialogs();

//    if (error instanceof AxiosError) {
//        if (error.response?.data.includes("network-related")) {

//            logFile.message = MESSAGE.CONNECTION_ERROR;
//            await dialogs.alert(MESSAGE.CONNECTION_ERROR, { title: "Error de conexión" });
//        } else {
//            logFile.message = error.message;
//            await dialogs.alert(error.message, { title: error.response?.statusText });
//        }
//    } else if (error instanceof Error) {
//        logFile.message = error.message;
//        await dialogs.alert(error.message, { title: error.name });
//    } else {
//        logFile.message = MESSAGE.UNKNOWN_ERROR;
//        await dialogs.alert(MESSAGE.UNKNOWN_ERROR, { title: "Error" });
//    }

//    await logTimeWebApi.writeLogToFileAsync(logFile);
//};