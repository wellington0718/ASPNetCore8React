using LogTimeWeb.Server.DataAccess;

namespace LogTimeWeb.Server.Controllers;

[ApiController]
[Route("[controller]/[action]")]
public class SessionController(ISessionUnitOfWork unitOfWork) : ApiControllerBase
{
    private readonly ISessionUnitOfWork unitOfWork = unitOfWork;

    [HttpPost]
    public async Task<ActionResult> Open([FromBody] string userId)
    {
        userId = PadUserId(userId);

        try
        {
            await unitOfWork.CloseExistingSessions(userId);

            var newSessionData = new NewSessionData
            {
                User =
                    await unitOfWork.UserRepository.GetInfo(userId),
                ActiveSession = await unitOfWork.CreateSession(userId)
            };

            unitOfWork.Commit();

            return CreateResponse(newSessionData);
        }
        catch (Exception exception)
        {
            return CreateResponse(new BaseResponse
            {
                HasError = true,
                Code = StatusCodes.Status500InternalServerError,
                Title = nameof(ResponseTitle.Error),
                Message = exception.GetBaseException().Message
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult> Close([FromBody] SessionLogOutData sessionLogOutData)
    {
        try
        {
            SessionLog sessionLog = new();
            if (sessionLogOutData.LoggedOutBy.Contains("External Logout"))
            {
                sessionLog.IdUser = sessionLogOutData.UserIds;
                sessionLog.LogedOutBy = sessionLogOutData.LoggedOutBy;
                var sessionLogs = (await unitOfWork.SessionLogRepository.GetUsersActiveLogIdAsync(sessionLogOutData.UserIds)).ToList();

                if (sessionLogs.Any(l => l.LogoutDate.HasValue))
                {
                    foreach (var log in sessionLogs)
                    {
                        if (log.LogoutDate.HasValue)
                        {
                            await unitOfWork.ActiveSessionRepository.RemoveAsync(log.IdUser);
                        }
                    }

                    unitOfWork.Commit();
                    return CreateResponse(new BaseResponse
                    {
                        Code = StatusCodes.Status200OK,
                        Title = nameof(ResponseTitle.Ok),
                        IsSessionAlreadyClose = true
                    });
                }
            }
            else
            {
                sessionLog = await unitOfWork.SessionLogRepository.GetAsync(sessionLogOutData.Id);

                if (sessionLog.LogoutDate.HasValue)
                {
                    await unitOfWork.ActiveSessionRepository.RemoveAsync(sessionLog.IdUser);
                    unitOfWork.Commit();
                    return CreateResponse(new BaseResponse
                    {
                        Code = StatusCodes.Status200OK,
                        Title = nameof(ResponseTitle.Ok),
                        IsSessionAlreadyClose = true
                    });
                }
            }

            await unitOfWork.CloseExistingSessions(
                sessionLog.IdUser, sessionLogOutData.LoggedOutBy);

            unitOfWork.Commit();

            return CreateResponse(new BaseResponse
            {
                Code = StatusCodes.Status200OK,
                Title = nameof(ResponseTitle.Ok),
                IsSessionAlreadyClose = true,
                Message = nameof(ResponseMessage.Success)
            });
        }
        catch (Exception exception)
        {
            return CreateResponse(new BaseResponse
            {
                HasError = true,
                Code = StatusCodes.Status500InternalServerError,
                Title = nameof(ResponseTitle.Error),
                Message = exception.GetBaseException().Message
            });
        }
    }
    [HttpPost]
    public async Task<ActionResult> Update([FromBody] int id)
    {
        try
        {
            var sessionLog = await unitOfWork.SessionLogRepository.GetAsync(id);

            if (sessionLog.LogoutDate.HasValue)
            {
                await unitOfWork.ActiveSessionRepository.RemoveAsync(sessionLog.IdUser);
                unitOfWork.Commit();
                return CreateResponse(new BaseResponse
                {
                    Code = StatusCodes.Status200OK,
                    Title = nameof(ResponseTitle.Ok),
                    IsSessionAlreadyClose = true
                });
            }

            sessionLog.LastTimeConnectionAlive = DateTime.Now;

            await unitOfWork.SessionLogRepository.UpdateAsync(sessionLog);

            unitOfWork.Commit();

            return CreateResponse(new SessionAliveDate { LastDate = sessionLog.LastTimeConnectionAlive });
        }
        catch (Exception exception)
        {
            return CreateResponse(new BaseResponse
            {
                HasError = true,
                Code = StatusCodes.Status500InternalServerError,
                Title = nameof(ResponseTitle.Error),
                Message = exception.GetBaseException().Message
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult> Fetch([FromBody] string userId)
    {
        try
        {
            var openedSessions = (
                await unitOfWork.SessionLogRepository
                .GetActiveByUserIdAsync(PadUserId(userId)))
                .ToList();

            if (openedSessions.Count == 0)
            {
                return CreateResponse(new BaseResponse { IsSessionAlreadyClose = true });
            }

            var lastOpenedSession = openedSessions.FirstOrDefault();

            unitOfWork.Commit();

            return CreateResponse(new FetchSessionData
            {
                Id = lastOpenedSession.Id,
                IsAlreadyOpened = true,
                CurrentRemoteHost = lastOpenedSession.Hostname,
                Code = StatusCodes.Status200OK,
                Title = nameof(ResponseTitle.Ok)
            });

        }
        catch (Exception exception)
        {
            return CreateResponse(new BaseResponse
            {
                HasError = true,
                Code = StatusCodes.Status500InternalServerError,
                Title = nameof(ResponseTitle.Error),
                Message = exception.GetBaseException().Message
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult> ValidateUser([FromBody] Credential credential)
    {
        try
        {
            credential.UserId = PadUserId(credential.UserId);
            var isValidUser = await unitOfWork.CredentialRepository.ValidateAsync(credential);

            if (isValidUser)
            {
                return CreateResponse(new BaseResponse
                {
                    HasError = false,
                    Code = StatusCodes.Status200OK,
                    Title = nameof(ResponseTitle.Ok),
                    Message = "Authorized"
                });
            }
            else
            {
                return CreateResponse(new BaseResponse
                {
                    HasError = true,
                    Code = StatusCodes.Status401Unauthorized,
                    Title = nameof(ResponseTitle.Unauthorized),
                    Message = "Invalid credential"
                });
            }
        }
        catch (Exception ex)
        {
            return CreateResponse(new BaseResponse
            {
                HasError = true,
                Code = StatusCodes.Status500InternalServerError,
                Title = nameof(ResponseTitle.Error),
                Message = ex.Message
            });
        }
    }

    [HttpPost]
    public async Task<string> GetLogFile([FromBody] LogFile logFile)
    {
        var logFilePath = $"\\\\AFRODITA\\LogtimeWebLogs\\{PadUserId(logFile.UserId)}.log";
        byte[] fileBytes;
        string fileContent;

        if (logFile.RoleId == 1 || logFile.RoleId == 3)
        {
            if (!System.IO.File.Exists(logFilePath))
            {
                fileContent = "Not Found";
            }
            else
            {
                fileBytes = await System.IO.File.ReadAllBytesAsync(logFilePath);
                fileContent = Encoding.UTF8.GetString(fileBytes);
            }


            return fileContent;
        }

        var userId = await GetUserInDepartmentGroupAsync(logFile.UserId, logFile.ManagerId);

        if (!string.IsNullOrEmpty(userId))
        {
            fileBytes = await System.IO.File.ReadAllBytesAsync(logFilePath);
            fileContent = Encoding.UTF8.GetString(fileBytes);
        }
        else
        {
            fileContent = "Unauthorized";
        }

        return fileContent;
    }

    [HttpPost]
    public async Task WriteLogToFileAsync([FromBody] LogFile logFile)
    {
        string logFilePath = $@"C:\LogtimeWebLogs\{PadUserId(logFile.UserId)}.log";
        string logEntry;

        if (!System.IO.File.Exists(logFilePath))
        {
            string headers = $"{"Date",-22}{"|",-3}{"Page",-25}{"|",-3}{"Method",-20}{"|",-3}{"Message"}";
            string separator = new('-', 100);
            logEntry = headers + Environment.NewLine + separator + Environment.NewLine;

           await System.IO.File.AppendAllTextAsync(logFilePath, logEntry);
        }

        logEntry = $"{DateTime.Now,-22:M/d/yyyy h:mm:ss tt}{"|",-3}{logFile.Component,-25}{"|",-3}{logFile.Method,-20}{"|",-3}{logFile.Message}";
        await System.IO.File.AppendAllTextAsync(logFilePath, logEntry + Environment.NewLine);
    }

    private async Task<string> GetUserInDepartmentGroupAsync(string userId, string managerId)
    {
        return await unitOfWork.SessionLogRepository.GetUserInDepartmentGroupAsync(PadUserId(userId), PadUserId(managerId));
    }
}