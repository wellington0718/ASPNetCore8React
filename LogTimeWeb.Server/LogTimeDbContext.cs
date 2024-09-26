using LogTimeWeb.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace LogTimeWeb.Server;

public class LogTimeDbContext(DbContextOptions<LogTimeDbContext> options) : DbContext(options)
{
    public DbSet<Employee> Employees { get; set; }
}
