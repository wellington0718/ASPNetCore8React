namespace LogTimeWeb.Server.Enums;

public enum StoreProcedure
{
    ValidateCredential,
    GetUserGroup,
    GetProjectActivities,
    GetUserPermision,
    GetUserProject,
    GetUserInfo
}

public enum ConnectionStringName
{
    LogTimeWeb
}

public enum ResponseTitle
{
    Ok,
    Unauthorized,
    Error,
    OnLeave
}

public enum ResponseMessage
{
    Success
}

public enum Role
{
    Admin = 1,
    Supervior = 2,
    Agent = 3
}