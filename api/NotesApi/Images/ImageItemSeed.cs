using Bogus;

namespace NotesApi.Images;

public sealed record ImageItemSeed(Guid Id, int SortOrder, string ImageUrl, string Description);

/// <summary>
/// Generates the sample items with Bogus. A fixed seed makes the data identical on
/// every machine, so the app and the API tests can rely on item 1 being item 1.
/// </summary>
public static class ImageItemGenerator
{
    public const int DefaultSeed = 2026;

    public static IReadOnlyList<ImageItemSeed> Generate(int count, int seed = DefaultSeed)
    {
        var faker = new Faker("en") { Random = new Randomizer(seed) };
        var items = new List<ImageItemSeed>(count);

        for (var order = 1; order <= count; order++)
        {
            var id = faker.Random.Guid();
            items.Add(new ImageItemSeed(
                Id: id,
                SortOrder: order,
                // picsum.photos/seed/<text> returns the same picture for the same text,
                // and every id exists. A random numeric id can point to a missing image.
                ImageUrl: $"https://picsum.photos/seed/{id:N}/96/96",
                // 10 to 18 words: always longer than one line on a phone.
                Description: faker.Lorem.Sentence(10, 8)));
        }

        return items;
    }
}
