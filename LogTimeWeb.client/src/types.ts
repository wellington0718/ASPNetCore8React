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
    project_Ini: string;
    project_Desc: string;
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

export class SessionData {
    user?: User;
    loginTime: string = "";  
    sessionTime: string = "";
    loggedOutBy: string = "";
    activityTime: string = "";
    serverLastContact: string = "";
    selectedActivityId: number = 1;
    activityTotalSecs: number = 0;
    sessionTotalSecs: number = 0;
    idleTimeSpan: string = "";
    generalTimeSpan: string = "";
    historyLogId: number = 0;
    activityLogId: number = 0;
}


export type BusyDialogState = {
    open: boolean,
    message: string
}

export type LogFile = {
    userId?: string;
    managerId?: string;
    roleId?: number;
    method?: string;
    component?: string;
    message?: string;
};

export const MESSAGE = {
    VERIFY_CREDENTIALS: "Verificando credenciales, por favor espere",
    FETCH_SESSIONS: "Buscando sesiones activas, por favor espere",
    CREATE_SESSION: "Iniciando sesión, por favor espere",
    UNKNOWN_ERROR: "Error desconocido. Por favor contactar con el departamento de IT.",
    ACTIVE_SESSION: "Actualmente hay una sesión activa. ¿Deseas cerrarla para continuar?",
    INVALID_CREDENTIAL: "Las credenciales no son validas.",
    CLOSE_SESSION: "Cerrando sesión, por favor espere",
    CONNECTION_ERROR: "No se pudo establecer comunicación con el servidor. Por favor verifique su conexión a la red/internet.",
    SESSION_CLOSED: "Al intentar actualizar los datos de la sesión, esta ya había sido finalizada de forma externa.",
    NO_ACCESS: "Actualmente, tu acceso está restringido debido a que te encuentras en un período de ausencia. Para cualquier consulta adicional, te recomendamos ponerte en contacto con tu supervisor o líder de equipo.",
    NONE: ""
};