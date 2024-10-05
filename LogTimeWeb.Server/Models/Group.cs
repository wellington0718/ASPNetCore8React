namespace LogTimeWeb.Server.Models;

public class Group
{
    public int Id { get; set; }
    public string ProjectId { get; set; }
    public string Project { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public DateTime? LogoutTime { get; set; }
}

