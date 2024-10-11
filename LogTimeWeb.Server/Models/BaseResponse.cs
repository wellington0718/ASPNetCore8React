namespace LogTimeWeb.Server.Models;

public class BaseResponse
{
    public bool HasError { get; set; } = false;
    public int Code { get; set; }
    public string Title { get; set; }
    public string Message { get; set; }
    public bool IsSessionAlreadyClose { get; set; } = false;
    public string ReturnDate { get; set; }
    public string Reason { get; set; }
}
