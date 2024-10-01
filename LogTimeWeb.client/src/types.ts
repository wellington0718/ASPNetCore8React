export type Group = {
    id?: number;
    projectId?: string;
    project?: string;
    name?: string;
    description?: string;
    logoutTime?: Date;
};

export type StatusLog = {
    id?: number;
    loginLogId?: number;
    statusStartTime?: Date;
    statusEndTime?: Date;
    statusId?: number;
};

export type LoginLog = {
    activeLogId?: number;
    loggedOutBy?: string;
    loginDate?: Date;
    logoutDate?: Date;
    host?: string;
    currentStatusLogEntry?: StatusLog;
    currentHistoryLogId?: number;
};

export type Activity = {
    id?: number;
    description?: string;
    message?: string;
    project?: string;
    idleTime?: number;
    enabled?: boolean;
};

export type UserSession = {
    user?: User;
    group?: Group;
    currentLogEntry?: LoginLog;
    loginTime?: string;
    sessionTime?: string;
    loggedOutBy?: string;
    activityTime?: string;
    serverLastContact?: string;
    connectionId?: string;
    selectedActivity?: Activity;
    activityTimeSpan?: string;
    idleTimeSpan?: string;
    sessionTimeSpan?: string;
    generalTimeSpan?: string;
    isClosedInactivity?: boolean;
    isSessionTimerEnabled?: boolean;
    isActivityTimerEnabled?: boolean;
};

export type Project = {
    id?: string;
    project_Ini?: string;
    project_Desc?: string;
    company?: string;
    activities?: Activity[];
};

export type ProjectGroup = {
    id?: number;
    projectId?: string;
    name?: string;
    groupDescription?: string;
    logOutTime?: Date | null;
};

export type User = {
    id?: string;
    firstName?: string;
    lastName?: string;
    projectName?: string;
    projectId?: string;
    projectIni?: string;
    companyId?: string;
    companyCode?: string;
    department?: string;
    roleId?: number;
    project?: Project;
    projectGroup?: ProjectGroup;
    group?: Group;
    permission?: number;
};
