import moment from 'moment';
import { INewSessionData, UserSession } from '../types';
import CryptoJS from 'crypto-js';

const FillSessionData = (sessionData: INewSessionData): UserSession => {
    const currentUsersSession: UserSession = {
        user: sessionData.user,
        activityId: 1,
        activityLogId: sessionData.activeSession.actualStatusHistoryId,
        activityTotalSecs: 0,
        sessionTotalSecs: 0,
        historyLogId: sessionData.activeSession.actualLogHistoryId,
    }

    if (currentUsersSession.user.projectGroup != null) {
        currentUsersSession.user.group =
        {
            id: currentUsersSession.user.projectGroup.id,
            name: currentUsersSession.user.projectGroup.name,
            description: currentUsersSession.user.projectGroup.groupDescription,
            projectId: currentUsersSession.user.projectGroup.projectId,
            logOutTime: currentUsersSession.user.projectGroup.logOutTime
        };
    }

    const date = new Date();

    currentUsersSession.selectedActivity = currentUsersSession.user.project.availableActivities.find(activity => activity.id == 1);
    currentUsersSession.serverLastContact = moment(date).format("YYYY-MM-DD HH:mm:ss");
    currentUsersSession.loginTime = currentUsersSession.serverLastContact;
    currentUsersSession.sessionTime = "00:00:00";
    currentUsersSession.activityTime = "00:00:00";

    return currentUsersSession;

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

export const getUserSession = (): UserSession | null => {

    const cipherUserSessionStr = sessionStorage.getItem("userSession");

    if (cipherUserSessionStr != null) {
        const userSessionStr = CryptoJS.AES.decrypt(cipherUserSessionStr, "userSession");
        const res = JSON.parse(userSessionStr.toString(CryptoJS.enc.Utf8)) as UserSession;
       
        return res;
    }
    else {
        return null;
    }
};

export const saveUserSession = (userSession: UserSession) => {
    const cipherText = CryptoJS.AES.encrypt(JSON.stringify(userSession), "userSession").toString()
    sessionStorage.setItem("userSession", cipherText);
};