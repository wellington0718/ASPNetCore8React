using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace ASPNetCore8React.Server.Models;

public class Employee
{
    [Key]
    public string UserId { get; set; }
    public string UserName { get; set; }
    public string UserLastName { get; set; }
    public string ProjectName { get; set; }
    public string ProjectId { get; set; }
}
