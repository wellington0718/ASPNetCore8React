namespace LogTimeWeb.Server.Controllers;

public class ApiControllerBase : ControllerBase
{
    protected static string PadUserId(string userId)
    {
        return userId.Trim().PadLeft(8, '0');
    }

    protected ObjectResult CreateResponse<T>(T objectData)
    {
        return StatusCode(StatusCodes.Status200OK, objectData);
    }
}
