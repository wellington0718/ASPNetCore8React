import { UserSession } from '../types';
import CryptoJS from 'crypto-js';

export const login = (userSession: UserSession) => {

    const cipherText = CryptoJS.AES.encrypt(JSON.stringify(userSession), "userSession").toString()
    sessionStorage.setItem("userSession", cipherText);
};

export const logout = () => {
    sessionStorage.removeItem("userSession");
};

export const getUserSession = (): UserSession | null => {

    const cipherUserSessionStr = sessionStorage.getItem("userSession");

    if (cipherUserSessionStr != null) {
        const userSessionStr = CryptoJS.AES.decrypt(cipherUserSessionStr, "userSession");
        return JSON.parse(userSessionStr.toString(CryptoJS.enc.Utf8)) as UserSession;
    }
    else {
        return null;
    }
};