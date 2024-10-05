export interface IBaseResponse {
    hasError: boolean;
    code: number;
    title: string;
    message: string;
    isSessionAlreadyClose: boolean;
}
export type Credential = {
    userId: string
    password: string
}

export type SessionLogOutData = {
    id: number
    userIds: string
    loggedOutBy: string
}

export interface IActivityLog extends IBaseResponse {
    id: number
    logId: number
    statusStartTime: Date
    statusEndTime?: Date
    statusId: number
}

export interface ISessionAliveDate extends IBaseResponse {
    lastDate: Date
}

export type ActivityChange = {
    currentActivityLogId: number
    newActivityId: number
}

export interface IFetchSessionData extends IBaseResponse {
    id: number
    isAlreadyOpened: boolean
    currentRemoteHost: string
}

export interface INewSessionData extends IBaseResponse {
    user: User;
    activeSession: ActiveSession;
}

export type User = {
    id: string;
    firstName: string;
    lastName: string;
    roleId: number;
    project: Project;
    projectGroup?: ProjectGroup;
    group?: Group 
}

export type Project = {
    projectIni: string;
    projectDesc: string;
    company: string;
    availableActivities: Status[];
}

export type ProjectGroup = {
    id: number;
    projectId: string;
    name: string;
    groupDescription: string;
    logOutTime?: Date ;
}

export type Status = {
    id: number;
    description: string;
    message: string;
    project: string;
    idleTime?: number;
    enabled: boolean;
}

export type Group = {
    id: number;
    projectId: string;
    name: string;
    description?: string;
    logOutTime?: Date;
}

type StatusLog = {
    id?: number;
    loginLogId?: number;
    statusStartTime: Date;
    statusEndTime?: Date;
    statusId: number;
}

export type ActiveSession = {
    id: number;
    userId: string;
    actualLogHistoryId: number;
    actualStatusHistoryId: number;
    statusId: number;
    startDate: Date;
    clientVersion: string;
    machineName: string;
}

type LoginLog = {
    activeLogId?: number;
    loggedOutBy?: string;
    loginDate?: Date;
    logoutDate?: Date;
    host?: string;
    currentStatusLogEntry?: StatusLog;
    currentHistoryLogId?: number;
}

export type UserSession = {
    user: User;
    //currentLogEntry: LoginLog;
    loginTime?: string;
    sessionTime?: string;
    loggedOutBy?: string;
    activityTime?: string;
    serverLastContact?: string;

    selectedActivity?: Status;
    activityTotalSecs: number;
    idleTimeSpan?: string;
    sessionTotalSecs: number;
    generalTimeSpan?: string;
    historyLogId: number;
    activityId: number;
    isClosedInactivity?: boolean;
    isSessionTimerEnabled?: boolean;
    isActivityTimerEnabled?: boolean;
};

