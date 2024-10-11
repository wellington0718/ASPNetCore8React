namespace LogTimeWeb.Server.Controllers;

[ApiController]
[Route("[controller]/[action]")]
public class ActivityController(ISessionUnitOfWork unitOfWork) : ApiControllerBase
{
    private readonly ISessionUnitOfWork unitOfWork = unitOfWork;

    [HttpPost]
    public async Task<ActionResult> Change([FromBody] ActivityChange activityChange)
    {
        try
        {
            var currentActivityLog = await unitOfWork.ActivityLogRepository.GetAsync(activityChange.CurrentActivityLogId);

            var currentActiveSession =
                await unitOfWork.ActiveSessionRepository.GetByActivityLogIdAsync(currentActivityLog.Id);

            if (currentActiveSession == null)
            {
                return CreateResponse(new BaseResponse
                {
                    Code = StatusCodes.Status200OK,
                    Title = nameof(ResponseTitle.Ok),
                    IsSessionAlreadyClose = true
                });
            }

            var sessionLog = await unitOfWork.SessionLogRepository.GetAsync(currentActiveSession.ActualLogHistoryId);

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

            var currentDateTime = DateTime.Now;

            if (sessionLog.LogoutDate.HasValue
                && RelevantTimeDifference(currentDateTime, sessionLog.LastTimeConnectionAlive.Value))
            {
                return CreateResponse(new BaseResponse
                {
                    Code = StatusCodes.Status417ExpectationFailed,
                    HasError = true,
                    Title = nameof(ResponseTitle.Error),
                    Message = "The connection data has not been updated"
                });
            }

            currentActivityLog.StatusEndTime = currentDateTime;
            await unitOfWork.ActivityLogRepository.UpdateAsync(currentActivityLog);

            var newActivityLog = new ActivityLog
            {
                LogId = currentActivityLog.LogId,
                StatusId = activityChange.NewActivityId,
                StatusStartTime = currentDateTime
            };
            newActivityLog.Id =
                await unitOfWork.ActivityLogRepository.AddAsync(newActivityLog);

            currentActiveSession.ActualStatusHistoryId = newActivityLog.Id;

            await unitOfWork.ActiveSessionRepository.UpdateAsync(currentActiveSession);

            unitOfWork.Commit();

            return CreateResponse(newActivityLog);
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

    private static bool RelevantTimeDifference(DateTime currentTime, DateTime lastConnectionAliveTime)
    {
        return (currentTime - lastConnectionAliveTime).TotalMinutes is > 2 or < 0;
    }
}
