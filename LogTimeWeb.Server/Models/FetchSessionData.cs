namespace LogTimeWeb.Server.Models;

public class FetchSessionData : BaseResponse
{
    public int Id { get; set; }
    public bool IsAlreadyOpened { get; set; }
    public string CurrentRemoteHost { get; set; }
}
