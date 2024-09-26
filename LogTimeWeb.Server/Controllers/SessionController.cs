using LogTimeWeb.Server.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Text;

namespace LogTimeWeb.Server.Controllers;

[Route("[controller]/[action]")]
[ApiController]
public class SessionController : ControllerBase
{
    public IActionResult SetUserSession([FromBody] Employee user)
    {
        try
        {
            return Ok(user);
        }
        catch (Exception ex)
        {

            return BadRequest();
        }
    }


    public IActionResult GetUserSession()
    {
        // Retrieve and deserialize the JSON back into the object
     
        var userJson = HttpContext.Session.GetString("UserSession");
        if (userJson != null)
        {
            var user = JsonConvert.DeserializeObject<Employee>(userJson);
            return Ok(user);
        }
        return Ok("No user in session.");
    }
}
