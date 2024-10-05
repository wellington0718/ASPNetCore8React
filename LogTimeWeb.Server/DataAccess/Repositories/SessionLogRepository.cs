using LogTimeWeb.Server.Models;

namespace LogTimeWeb.Server.DataAccess.Repositories;

public class SessionLogRepository
{
    private readonly DataBaseAccess dataBaseAccess;

    public SessionLogRepository(DataBaseAccess dataBaseAccess)
    {
        this.dataBaseAccess = dataBaseAccess;
    }

    public async Task<SessionLog> GetAsync(int id)
    {
        const string sql =
            @"SELECT *
                FROM LogHistory
                WHERE Id = @Id";
        var parameters = new { Id = id };

        return await dataBaseAccess.LoadFirstOrDefaultAsync<SessionLog, dynamic>(sql, parameters);
    }

    public async Task<int> AddAsync(SessionLog entity)
    {
        const string sql =
            @"INSERT INTO LogHistory(IdUser, Hostname, LogedOutBy, LastTimeConnectionAlive, LoginDate, ClientVersion)
                VALUES(@IdUser, @Hostname, @LogedOutBy, @LastTimeConnectionAlive, @LoginDate, @ClientVersion);
                SELECT SCOPE_IDENTITY();";
        var parameters = new
        {
            entity.IdUser,
            entity.Hostname,
            entity.LogedOutBy,
            entity.LastTimeConnectionAlive,
            entity.LoginDate,
            entity.ClientVersion
        };

        return await dataBaseAccess.ExecuteScalarAsync<int, dynamic>(sql, parameters);
    }

    public async Task UpdateAsync(SessionLog entity)
    {
        const string sql =
        @"UPDATE LogHistory  
                    SET 
                        IdUser = @IdUser,  
                        Hostname = @Hostname,
                        LogedOutBy = @LogedOutBy,
                        LastTimeConnectionAlive = @LastTimeConnectionAlive,
                        LoginDate = @LoginDate,
                        LogoutDate = @LogoutDate,
                        ClientVersion = @ClientVersion
                    WHERE 
                        Id = @Id;";
        var parameters = new
        {
            entity.IdUser,
            entity.Hostname,
            entity.LogedOutBy,
            entity.LastTimeConnectionAlive,
            entity.LoginDate,
            entity.LogoutDate,
            entity.ClientVersion,
            entity.Id
        };

        await dataBaseAccess.SaveDataAsync(sql, parameters);
    }

    public async Task UpdateLogoutDataAsync(IEnumerable<SessionLog> entities)
    {
        var entitiesIds = string.Join(",", entities.Select(e => e.Id));
        var logoutDate = entities.FirstOrDefault().LogoutDate;
        var loggedOutBy = entities.FirstOrDefault().LogedOutBy;

        const string sql =
            @"UPDATE LogHistory  
                    SET
                        LogedOutBy = @loggedOutBy,                   
                        LogoutDate = @logoutDate
                    WHERE 
                        Id IN (SELECT arrValue FROM dbo.fnArray(@entitiesIds, ','))";
        var parameters = new
        {
            logoutDate,
            loggedOutBy,
            entitiesIds
        };

        await dataBaseAccess.SaveDataAsync(sql, parameters);
    }

    public async Task<IEnumerable<SessionLog>> GetActiveByUserIdAsync(string userId)
    {
        const string sql =
            @"SELECT *
                    FROM LogHistory
                    WHERE IdUser = @IdUser
                    AND LogoutDate IS NULL
                    ORDER BY LoginDate DESC";
        var parameters = new { IdUser = userId };

        return await dataBaseAccess.LoadDataAsync<SessionLog, dynamic>(sql, parameters);
    }
    public async Task<IEnumerable<SessionLog>> GetUsersActiveLogIdAsync(string userIds)
    {
        const string sql =
            @"	SELECT
                        LogHistory.Id Id
                        FROM  ActiveLog
                         INNER JOIN LogHistory
                          ON LogHistory.Id = ActiveLog.ActualLogHistoryId

                         INNER JOIN	SynergiesSystem.dbo.Employees Employee
                          ON Employee.UserId = ActiveLog.UserId

                        WHERE	(ActiveLog.UserId IN (SELECT arrValue FROM dbo.fnArray(@userIds, ',')))";
        var parameters = new { userIds };

        return await dataBaseAccess.LoadDataAsync<SessionLog, dynamic>(sql, parameters);
    }

    public async Task<IEnumerable<SessionLog>> GetActiveByUsersAsync(string usersIds)
    {
        const string sql =
            @"SELECT *
                    FROM LogHistory
                    WHERE LogoutDate IS NULL
                    AND IdUser IN (SELECT arrValue FROM dbo.fnArray(@Ids, ','))";
        var parameters = new { Ids = usersIds };

        return await dataBaseAccess.LoadDataAsync<SessionLog, dynamic>(sql, parameters);
    }
}