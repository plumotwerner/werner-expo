namespace NotesApi.Images;

public static class ImageEndpoints
{
    public const int DefaultPageSize = 50;
    public const int MaxPageSize = 100;
    private const int MaxDelayMilliseconds = 3000;

    public static void MapImageEndpoints(this WebApplication app)
    {
        // GET /images?page=0&pageSize=50  ->  { total, page, pageSize, items: [...] }
        // Items are ordered by `order`. A page past the end returns an empty list.
        app.MapGet("/images", async (
            ImageItemRepository repository,
            ILogger<ImageItemRepository> logger,
            int? page,
            int? pageSize,
            int? delayMs) =>
        {
            var pageIndex = page ?? 0;
            var size = pageSize ?? DefaultPageSize;

            if (pageIndex < 0 || size < 1 || size > MaxPageSize)
            {
                return Results.BadRequest(new
                {
                    error = $"page must be >= 0 and pageSize between 1 and {MaxPageSize}."
                });
            }

            // A test hook so that a loading indicator can be seen on a fast local API.
            if (app.Environment.IsDevelopment() && delayMs is > 0)
            {
                await Task.Delay(Math.Min(delayMs.Value, MaxDelayMilliseconds));
            }

            var items = repository.GetPage(pageIndex, size);

            logger.LogInformation(
                "GET /images page {Page} (size {PageSize}): {Count} items",
                pageIndex, size, items.Count);
            foreach (var item in items)
            {
                logger.LogInformation(
                    "  #{Order} {Id} {ImageUrl}", item.Order, item.Id, item.ImageUrl);
            }

            return Results.Ok(new ImagePageDto(repository.Count(), pageIndex, size, items));
        });
    }
}
