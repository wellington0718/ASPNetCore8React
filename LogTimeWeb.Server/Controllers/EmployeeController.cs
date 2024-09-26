using LogTimeWeb.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LogTimeWeb.Server.Controllers;

[ApiController]
[Route("[controller]/[action]")]
public class EmployeeController(LogTimeDbContext context) : ControllerBase
{
    private readonly LogTimeDbContext context = context;

    [HttpPost]
    public async Task<Employee> GetEmployeeById([FromBody] string id)
    {
        try
        {
            //var emp = await  context.Database.SqlQuery<Employee>($"SELECT * FROM Employees where UserId = {id}").FirstOrDefaultAsync();
            var emp = await context.Employees.FirstOrDefaultAsync(emp => emp.UserId.Equals(id.PadLeft(8, '0')));
            return emp;
        }
        catch (Exception ex)
        {
            return null;
        }
    }

    [HttpGet]
    public async Task<Employee> GetEmployeeById2(string id)
    {
        try
        {
            //var emp = await  context.Database.SqlQuery<Employee>($"SELECT * FROM Employees where UserId = {id}").FirstOrDefaultAsync();
            var emp = await context.Employees.FirstOrDefaultAsync(emp => emp.UserId.Equals(id.PadLeft(8, '0')));
            return emp;
        }
        catch (Exception ex)
        {
            return null;
        }
    }
}
