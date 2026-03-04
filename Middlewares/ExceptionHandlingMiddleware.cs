using System.Net;
using System.Text.Json;

namespace ClinicBooking.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IWebHostEnvironment _env;

    public ExceptionHandlingMiddleware(RequestDelegate next, IWebHostEnvironment env)
    {
        _next = next;
        _env = env;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            // We return a safe error response (ProblemDetails-like)
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var traceId = context.TraceIdentifier;

            var response = new
            {
                type = "https://httpstatuses.com/500",
                title = "Unexpected server error",
                status = 500,
                traceId,
                // In Development we can include a helpful message.
                // In Production, keep details minimal to avoid leaking internals.
                detail = _env.IsDevelopment()
                    ? ex.Message
                    : "Something went wrong. Please contact support with the traceId."
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}