namespace LogTimeWeb.Server.Models;

public class LogFile
{
    public string UserId { get; set; }
    public string ManagerId { get; set; }
    public int RoleId { get; set; }
    public string Method { get; set; }
    public string Component { get; set; }
    public string Message { get; set; }
}
