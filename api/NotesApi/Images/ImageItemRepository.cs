using Microsoft.Data.Sqlite;

namespace NotesApi.Images;

public sealed record ImageItemDto(Guid Id, int Order, string ImageUrl, string Description);

public sealed record ImagePageDto(int Total, int Page, int PageSize, IReadOnlyList<ImageItemDto> Items);

public sealed class ImageItemRepository(string connectionString)
{
    public int Count()
    {
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM ImageItems";
        return Convert.ToInt32(command.ExecuteScalar());
    }

    public IReadOnlyList<ImageItemDto> GetPage(int page, int pageSize)
    {
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText =
            "SELECT Id, SortOrder, ImageUrl, Description FROM ImageItems " +
            "ORDER BY SortOrder LIMIT @take OFFSET @skip";
        command.Parameters.AddWithValue("@take", pageSize);
        command.Parameters.AddWithValue("@skip", page * pageSize);

        var items = new List<ImageItemDto>(pageSize);
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            items.Add(new ImageItemDto(
                Guid.Parse(reader.GetString(0)),
                reader.GetInt32(1),
                reader.GetString(2),
                reader.GetString(3)));
        }

        return items;
    }
}
