namespace LogTimeWeb.Server.DataAccess.Repositories;

public class ActiveSessionRepository(DataBaseAccess dataBaseAccess)
{
    private readonly DataBaseAccess dataBaseAccess = dataBaseAccess;

    public async Task<ActiveSession> GetByActivityLogIdAsync(int activityLogId)
    {
        const string sql =
            @"SELECT *
                FROM ActiveLog
                WHERE ActualStatusHistoryId = @ActualStatusHistoryId";
        var parameters = new { ActualStatusHistoryId = activityLogId };

        return await dataBaseAccess.LoadFirstOrDefaultAsync<ActiveSession, dynamic>(sql, parameters);
    }

    public async Task UpdateAsync(ActiveSession entity)
    {
        const string sql =
            @"UPDATE ActiveLog
                SET 
                UserId = @UserId,
                ActualLogHistoryId = @ActualLogHistoryId,
                ActualStatusHistoryId = @ActualStatusHistoryId,
                StatusId = @StatusId,
                ClientVersion = @ClientVersion
                WHERE Id = @Id";
        var parameters = new
        {
            entity.Id,
            entity.UserId,
            entity.ActualLogHistoryId,
            entity.ActualStatusHistoryId,
            entity.StatusId,
            entity.ClientVersion
        };

        await dataBaseAccess.SaveDataAsync(sql, parameters);
    }

    public async Task<int> AddAsync(ActiveSession entity)
    {
        const string sql =
            @"INSERT INTO ActiveLog(UserId, ActualLogHistoryId, ActualStatusHistoryId, StatusId, ClientVersion)
                VALUES(@UserId, @ActualLogHistoryId, @ActualStatusHistoryId, @StatusId, @ClientVersion);
                SELECT SCOPE_IDENTITY();";
        var parameters = new
        {
            entity.UserId,
            entity.ActualLogHistoryId,
            entity.ActualStatusHistoryId,
            entity.StatusId,
            entity.ClientVersion
        };

        return await dataBaseAccess.ExecuteScalarAsync<int, dynamic>(sql, parameters);
    }

    public async Task RemoveAsync(string userId)
    {
        const string sql =
            @"DELETE ActiveLog
                WHERE UserId = @userId;";
        var parameters = new { userId };

        await dataBaseAccess.SaveDataAsync(sql, parameters);
    }

    public async Task RemoveAsync(IEnumerable<SessionLog> entities)
    {
        var userIds = string.Join(",", entities.Select(e => e.IdUser));

        const string sql =
            @"DELETE ActiveLog
                WHERE UserId IN (SELECT arrValue FROM dbo.fnArray(@userIds, ','))";
        var parameters = new { userIds };

        await dataBaseAccess.SaveDataAsync(sql, parameters);
    }
}
