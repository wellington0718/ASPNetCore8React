import axios, { AxiosInstance } from "axios";
import { IFetchSessionData, IBaseResponse, INewSessionData, SessionLogOutData, ISessionAliveDate, ActivityChange, IActivityLog, Credential, LogFile } from "../types";

class LogTimeWebApi {
    private httpClient: AxiosInstance;
    private apiBaseUrl = import.meta.env.DEV ? import.meta.env.VITE_API_URL_Dev : import.meta.env.VITE_API_URL_Prod

    constructor() {
        this.httpClient = axios.create({
            baseURL: this.apiBaseUrl,
            timeout: 30000,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
    }

    async fetchSessionAsync(userId: string): Promise<IFetchSessionData> {
        const response = await this.httpClient.post<IFetchSessionData>('session/fetch', JSON.stringify(userId));
        return response.data;
    }

    async openSessionAsync(userId: string): Promise<INewSessionData> {
        const response = await this.httpClient.post<INewSessionData>('session/open', JSON.stringify(userId));
        return response.data;
    }

    async closeSessionAsync(sessionLogOutData: SessionLogOutData): Promise<IBaseResponse> {
        const response = await this.httpClient.post<IBaseResponse>('session/close', sessionLogOutData);
        return response.data;
    }

    async updateSessionAliveDateAsync(sessionLogId: number): Promise<ISessionAliveDate> {
        const response = await this.httpClient.post<ISessionAliveDate>('session/update', sessionLogId);
        return response.data;
    }

    async validateUserAsync(credential: Credential): Promise<IBaseResponse> {
        const response = await this.httpClient.post<IBaseResponse>('session/validateUser', credential);
        return response.data;
    }

    async writeLogToFileAsync(logFile: LogFile) {
        await this.httpClient.post('session/writeLogToFile', logFile);
    }

    async getLogFileAsync(logFile: LogFile): Promise<string> {
        const response = await this.httpClient.post<string>('session/getlogfile', logFile);
        return response.data;
    }

    async changeActivityAsync(activityChange: ActivityChange): Promise<IActivityLog> {
        const response = await this.httpClient.post<IActivityLog>('activity/change', activityChange);
        return response.data;
    }
}

export default LogTimeWebApi;