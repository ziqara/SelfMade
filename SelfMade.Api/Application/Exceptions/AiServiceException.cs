namespace SelfMade.Api.Application.Exceptions;

public class AiServiceException : Exception
{
    public AiServiceException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
