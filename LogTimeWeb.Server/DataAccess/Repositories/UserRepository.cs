using Dapper;
using MySql.Data.MySqlClient;

namespace LogTimeWeb.Server.DataAccess.Repositories;

public class UserRepository(DataBaseAccess dataBaseAccess)
{
    private readonly DataBaseAccess dataBaseAccess = dataBaseAccess;

    public async Task<User> GetInfo(string userId)
    {
        var parameters = new
        {
            id = userId
        };

        var user = await dataBaseAccess.LoadFirstOrDefaultAsync<User, dynamic>(nameof(StoreProcedure.GetUserInfo), parameters, CommandType.StoredProcedure);

        user.ProjectGroup = await GetProjectGroup(userId);

        user.Project = user.ProjectGroup == null
            ? await GetProject(userId)
            : await GetProject(userId, user.ProjectGroup.Id);

        user.RoleId = await GetRoleId(userId);

        return user;
    }

    public async Task<int> GetRoleId(string userId)
    {
        var parameters = new
        {
            userId
        };

        return await dataBaseAccess.ExecuteScalarAsync<int, dynamic>(nameof(StoreProcedure.GetUserPermision), parameters, CommandType.StoredProcedure);
    }

    public async Task<Project> GetProject(string userId, int? groupId = null)
    {
        var parameters = new
        {
            userId
        };

        var project = await dataBaseAccess.LoadFirstOrDefaultAsync<Project, dynamic>(nameof(StoreProcedure.GetUserProject), parameters, CommandType.StoredProcedure);

        if (project == null
            || string.IsNullOrEmpty(project.Project_Ini))
        {
            project = new Project(await GetActivities("ALL"));
        }
        else
        {
            project.AvailableActivities = await GetActivities(project.Project_Ini, groupId);
        }

        return project;
    }

    public async Task<IEnumerable<Status>> GetActivities(string projectId, int? projectGroupId = null)
    {
        var parameters = new
        {
            GroupId = projectGroupId,
            Project = projectId
        };

        return await dataBaseAccess.LoadDataAsync<Status, dynamic>(nameof(StoreProcedure.GetProjectActivities), parameters, CommandType.StoredProcedure);
    }

    public async Task<ProjectGroup> GetProjectGroup(string userId)
    {
        var parameters = new
        {
            userId
        };

        return await dataBaseAccess.LoadFirstOrDefaultAsync<ProjectGroup, dynamic>(nameof(StoreProcedure.GetUserGroup), parameters, CommandType.StoredProcedure);
    }

    public async Task<bool> IsUserLeaveReson(string userId)
    {
        var connectionStringMySql = "Server=thor;Database=syn_erp;Uid=syn_system;Pwd=ScaZfHJJQV82sD7G; Connect Timeout=1000;";
        using var connectionMsql = new MySqlConnection(connectionStringMySql);

        const string sql = @"SELECT 
                                  1
                                FROM 
                                  (
                                    SELECT 
                                      emp_id AS EmployeeId, 
                                      fecha_inicio AS StartTime, 
                                      fecha_termino AS EndTime, 
                                      fecha_regreso AS ReturnDate, 
                                      'vacaciones' AS Reason 
                                    FROM 
                                      erm_emps_vacaciones 
                                    WHERE 
                                      estado NOT IN ('Cancelado', 'Completado') 
                                    UNION ALL 
                                    SELECT 
                                      emp_id AS EmployeeId, 
                                      fecha AS StartTime, 
                                      fecha_hasta AS EndTime, 
                                      '' AS ReturnDate, 
                                      'permisos' AS Reason 
                                    FROM 
                                      erm_emps_permisos 
                                    WHERE 
                                      estado NOT IN ('Cancelado', 'Completado') 
                                    UNION ALL 
                                    SELECT 
                                      emp_id AS EmployeeId, 
                                      fecha_desde AS StartTime, 
                                      fecha_hasta AS EndTime, 
                                      '' AS ReturnDate, 
                                      'licencias' AS Reason 
                                    FROM 
                                      erm_emps_licencias 
                                    WHERE 
                                      estado NOT IN ('Cancelado', 'Completado') 
                                    UNION ALL 
                                    SELECT 
                                      emp_id AS EmployeeId, 
                                      DATE_ADD(fecha_salida, INTERVAL 1 DAY) AS StartTime, 
                                      CURDATE() AS EndTime, 
                                      '' AS ReturnDate, 
                                      'salida' AS Reason 
                                    FROM 
                                      erm_emps_salidas 
                                    WHERE 
                                      estado NOT IN ('Cancelado', 'Procesado')
                                  ) AS fuera 
                                WHERE 
                                  EndTime >= curdate() 
                                  and StartTime <= curdate() AND EmployeeId = @userId;";

        var parameters = new { userId };

        return await connectionMsql.QueryFirstOrDefaultAsync<bool>(sql, parameters);
    }
}
