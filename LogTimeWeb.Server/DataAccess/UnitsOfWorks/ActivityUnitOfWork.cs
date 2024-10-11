namespace LogTimeWeb.Server.DataAccess.UnitsOfWorks;

public interface IActivityUnitOfWork
{
    ActivityLogRepository ActivityLogRepository { get; }
    ActiveSessionRepository ActiveSessionRepository { get; }

    void Commit();
}

public class ActivityUnitOfWork(IConfiguration configuration) : 
    GenericUnitOfWork(new SqlConnection(configuration.GetConnectionString(nameof(ConnectionStringName.LogTimeWeb)))), IActivityUnitOfWork
{
    private ActivityLogRepository activityLogRepository;
    public ActivityLogRepository ActivityLogRepository =>
        activityLogRepository ??= new ActivityLogRepository(dataBaseAccess);

    private ActiveSessionRepository activeSessionRepository;

    public ActiveSessionRepository ActiveSessionRepository =>
        activeSessionRepository ??= new ActiveSessionRepository(dataBaseAccess);

    protected override void ResetRepositories()
    {
        activityLogRepository = null;
        activeSessionRepository = null;
    }
}
