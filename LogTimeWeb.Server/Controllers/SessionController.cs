namespace LogTimeWeb.Server.Controllers;

[ApiController]
[Route("[controller]/[action]")]
public class SessionController(ISessionUnitOfWork unitOfWork, IConfiguration configuration) : ApiControllerBase
{
    private readonly string fileLogRootPath = configuration.GetSection("LogFile").GetValue<string>("RootPath");

    [HttpPost]
    public async Task<ActionResult> Open([FromBody] string userId)
    {
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
                .GetActiveByUserIdAsync(userId))
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
            var isValidUser = await unitOfWork.CredentialRepository.ValidateAsync(credential);
            var isUserOnLeave = await unitOfWork.UserRepository.IsUserLeaveReson(credential.UserId);

            if (isValidUser && !isUserOnLeave)
            {
                return CreateResponse(new BaseResponse
                {
                    HasError = false,
                    Code = StatusCodes.Status200OK,
                    Title = nameof(ResponseTitle.Ok),
                    Message = "Authorized"
                });
            }
            else if (isValidUser && isUserOnLeave)
            {
                return CreateResponse(new BaseResponse
                {
                    HasError = false,
                    Code = StatusCodes.Status200OK,
                    Title = nameof(ResponseTitle.OnLeave),
                    Message = "Unauthorized"
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
        var logFilePath = Path.Combine(fileLogRootPath, $"{logFile.UserId}.log");

        if (!System.IO.File.Exists(logFilePath))
        {
            return "NotFound";
        }

        if (logFile.RoleId != (int)Role.Supervior)
        {
            return await DownloadLogFile(logFilePath);
        }

        var isInDp = await unitOfWork.SessionLogRepository.IsUserInDepartmentGroupAsync(logFile.UserId, logFile.ManagerId);

        if (isInDp)
        {
            return await DownloadLogFile(logFilePath);
        }

        return "Unauthorized";
    }

    [HttpPost]
    public async Task<bool> WriteLogToFileAsync([FromBody] LogFile logFile)
    {
        var logFilePath = Path.Combine(fileLogRootPath, $"{logFile.UserId}.log");
        string logEntry;
        string separator;

        if (!System.IO.File.Exists(logFilePath))
        {
            string headers = $"{"Date",-22}{"|",-3}{"Page",-15}{"|",-3}{"Method",-20}{"|",-3}{"Message"}";
            separator = new('-', 100);
            logEntry = headers + Environment.NewLine + separator + Environment.NewLine;

            await System.IO.File.AppendAllTextAsync(logFilePath, logEntry);
        }

        logEntry = $"{DateTime.Now,-22:M/d/yyyy h:mm:ss tt}{"|",-3}{logFile.Component,-15}{"|",-3}{logFile.Method,-20}{"|",-3}{logFile.Message}";
        separator = new string('-', logEntry.Length);
        System.IO.File.AppendAllText(logFilePath, logEntry + Environment.NewLine + separator + Environment.NewLine);

        return await Task.FromResult(true);
    }

    private static async Task<string> DownloadLogFile(string logFilePath)
    {
        byte[] fileBytes = await System.IO.File.ReadAllBytesAsync(logFilePath);
        return Encoding.UTF8.GetString(fileBytes);
    }
}