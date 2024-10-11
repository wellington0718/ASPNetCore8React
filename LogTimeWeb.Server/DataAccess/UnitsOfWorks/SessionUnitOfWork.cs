namespace LogTimeWeb.Server.DataAccess.UnitsOfWorks;

public interface ISessionUnitOfWork
{
    SessionLogRepository SessionLogRepository { get; }
    ActivityLogRepository ActivityLogRepository { get; }
    ActiveSessionRepository ActiveSessionRepository { get; }
    CredentialRepository CredentialRepository { get; }
    UserRepository UserRepository { get; }
    Task<ActiveSession> CreateSession(string userId);
    Task CloseExistingSessions(string paddedUserId, string loggedOutBy = "");
    void Commit();
}
public class SessionUnitOfWork(IConfiguration configuration) : 
    GenericUnitOfWork(new SqlConnection(configuration.GetConnectionString(nameof(ConnectionStringName.LogTimeWeb)))), ISessionUnitOfWork
{
    private SessionLogRepository sessionLogRepository;
    public SessionLogRepository SessionLogRepository =>
        sessionLogRepository ??= new SessionLogRepository(dataBaseAccess);

    private ActivityLogRepository activityLogRepository;
    public ActivityLogRepository ActivityLogRepository =>
        activityLogRepository ??= new ActivityLogRepository(dataBaseAccess);

    private ActiveSessionRepository activeSessionRepository;

    public ActiveSessionRepository ActiveSessionRepository =>
        activeSessionRepository ??= new ActiveSessionRepository(dataBaseAccess);

    private CredentialRepository credentialRepository;
    public CredentialRepository CredentialRepository =>
        credentialRepository ??= new CredentialRepository(dataBaseAccess);

    private UserRepository userRepository;
    public UserRepository UserRepository =>
        userRepository ??= new UserRepository(dataBaseAccess);

    protected override void ResetRepositories()
    {
        sessionLogRepository = null;
        activityLogRepository = null;
        activeSessionRepository = null;
        credentialRepository = null;
        userRepository = null;
    }

    public async Task<ActiveSession> CreateSession(string userId)
    {
        var newSessionLog =
            await CreateSessionLog(userId);

        var newActivityLog = await CreateActivityLog(newSessionLog);

        return await CreateActiveSession(newActivityLog, userId);
    }

    public async Task<IEnumerable<SessionLog>> GetActiveSessions(string usersIds)
    {
        var ids = usersIds.Split(',');

        if (ids.Length > 1)
        {
            return (await SessionLogRepository.GetActiveByUsersAsync(usersIds))
                .ToList();
        }
        else if (ids.Length == 1)
        {
            return (await SessionLogRepository.GetActiveByUserIdAsync(usersIds))
                .ToList();
        }

        return [];
    }

    public async Task CloseExistingSessions(string userId, string loggedOutBy = "")
    {
        var openedSessions = await GetActiveSessions(userId);

        if (!openedSessions.Any())
        {
            return;
        }

        var currentDate = DateTime.Now;

        var logOutDate = currentDate;

        foreach (var sessionLog in openedSessions)
        {
            if (sessionLog.LastTimeConnectionAlive.HasValue
                && RelevantTimeDifference(currentDate, sessionLog.LastTimeConnectionAlive.Value))
            {
                logOutDate = sessionLog.LastTimeConnectionAlive.Value;
            }

            sessionLog.LogoutDate = logOutDate;
            sessionLog.LogedOutBy = string.IsNullOrEmpty(loggedOutBy) ? "New session" : loggedOutBy;

            var activityLogs = await ActivityLogRepository.GetUnfinishedAsync(sessionLog.Id);

            foreach (var activityLog in activityLogs)
            {
                activityLog.StatusEndTime = sessionLog.LogoutDate;
            }
            await ActivityLogRepository.UpdateEndTimeAsync(activityLogs);
        }
        await SessionLogRepository.UpdateLogoutDataAsync(openedSessions);
        await ActiveSessionRepository.RemoveAsync(openedSessions);
    }

    private async Task<ActiveSession> CreateActiveSession(ActivityLog newActivityLog, string paddedUserId)
    {
        var activeSession = new ActiveSession
        {
            ActualLogHistoryId = newActivityLog.LogId,
            StatusId = 1,
            UserId = paddedUserId,
            ActualStatusHistoryId = newActivityLog.Id,
            StartDate = DateTime.Now,
            ClientVersion = "LogTimeWeb",
            MachineName = Environment.MachineName
        };
        activeSession.Id = await ActiveSessionRepository.AddAsync(activeSession);

        return activeSession;
    }

    private async Task<ActivityLog> CreateActivityLog(SessionLog newSessionLog)
    {
        var activityLog = new ActivityLog
        {
            StatusStartTime = newSessionLog.LoginDate,
            LogId = newSessionLog.Id,
            StatusId = 1
        };
        activityLog.Id = await ActivityLogRepository.AddAsync(activityLog);

        return activityLog;
    }

    private async Task<SessionLog> CreateSessionLog(string paddedUserId)
    {
        var startDate = DateTime.Now;
        var sessionLog = new SessionLog
        {
            LoginDate = startDate,
            LastTimeConnectionAlive = startDate,
            IdUser = paddedUserId,
            Hostname = Environment.MachineName,
            ClientVersion = "LogTimeWeb"
        };
        sessionLog.Id = await SessionLogRepository.AddAsync(sessionLog);

        return sessionLog;
    }

    private static bool RelevantTimeDifference(DateTime currentTime, DateTime lastConnectionAliveTime)
    {
        return (currentTime - lastConnectionAliveTime).TotalMinutes is > 2 or < 0;
    }
}
