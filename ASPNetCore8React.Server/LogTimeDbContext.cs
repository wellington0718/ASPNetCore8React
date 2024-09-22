using ASPNetCore8React.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace ASPNetCore8React.Server;

public class LogTimeDbContext(DbContextOptions<LogTimeDbContext> options) : DbContext(options)
{
    public DbSet<Employee> Employees { get; set; }
}
