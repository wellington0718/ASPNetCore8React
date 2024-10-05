using System.Text.RegularExpressions;

namespace LogTimeWeb.Server.Models;

public class User : BaseResponse
{
    public string Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public int RoleId { get; set; }
    public Project Project { get; set; }
    public Group Group { get; set; }
    public ProjectGroup ProjectGroup { get; set; }
}
