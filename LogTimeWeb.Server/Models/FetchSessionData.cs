namespace LogTimeWeb.Server.Models;

public class FetchSessionData : BaseResponse
{
    public bool IsAlreadyOpened { get; set; }
    public string CurrentRemoteHost { get; set; }
}
