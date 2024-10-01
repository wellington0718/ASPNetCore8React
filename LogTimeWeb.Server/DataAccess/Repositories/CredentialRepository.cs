﻿namespace LogTimeWeb.Server.DataAccess.Repositories;

public class CredentialRepository(DataBaseAccess dataBaseAccess)
{
    private readonly DataBaseAccess dataBaseAccess = dataBaseAccess;

    public async Task<bool> ValidateAsync(Credential credential)
    {
        var parameters = new
        {
            credential.User,
            credential.Password
        };

        return await dataBaseAccess.ValidateAsync<dynamic>(nameof(StoreProcedure.ValidateCredential), parameters, CommandType.StoredProcedure);
    }
}
