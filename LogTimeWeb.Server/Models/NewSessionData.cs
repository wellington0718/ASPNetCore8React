﻿namespace LogTimeWeb.Server.Models;

public class NewSessionData : BaseResponse
{
    public User User { get; set; }
    public ActiveSession ActiveSession { get; set; }
}
