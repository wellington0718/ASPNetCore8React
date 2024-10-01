namespace LogTimeWeb.Server.Controllers;

[ApiController]
[Route("[controller]/[action]")]
public class SessionController(ISessionUnitOfWork unitOfWork) : ApiControllerBase
{
    private readonly ISessionUnitOfWork unitOfWork = unitOfWork;

    [HttpPost]
    public async Task<ActionResult> Open([FromBody] ClientData clientData)
    {
        clientData.Credential.User = PadUserId(clientData.Credential.User);

        try
        {
            if (!await ValidateCredential(clientData.Credential))
            {
                return CreateResponse(new BaseResponse
                {
                    HasError = true,
                    Code = StatusCodes.Status401Unauthorized,
                    Title = nameof(ResponseTitle.Unauthorized),
                    Message = "Invalid credential"
                });
            }

            await unitOfWork.CloseExistingSessions(clientData.Credential.User);

            var newSessionData = new NewSessionData
            {
                User =
                    await unitOfWork.UserRepository.GetInfo(clientData.Credential.User),
                ActiveSession = await unitOfWork.CreateSession(clientData)
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

            if (!openedSessions.Any())
            {
                return CreateResponse(new FetchSessionData { IsAlreadyOpened = false });
            }

            var lastOpenedSession = openedSessions.FirstOrDefault();

            unitOfWork.Commit();

            return CreateResponse(
                lastOpenedSession != null
                    ? new FetchSessionData { IsAlreadyOpened = true, CurrentRemoteHost = lastOpenedSession.Hostname }
                    : new FetchSessionData { IsAlreadyOpened = false });
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

    private async Task<bool> ValidateCredential(Credential credential)
    {
        return await unitOfWork.CredentialRepository.ValidateAsync(credential);
    }
}