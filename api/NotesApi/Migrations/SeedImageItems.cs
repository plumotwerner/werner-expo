using FluentMigrator;
using NotesApi.Images;

namespace NotesApi.Migrations;

[Migration(2026101502, "Insert 2000 generated image items")]
public sealed class SeedImageItems : Migration
{
    public const int ItemCount = 2000;

    public override void Up()
    {
        var items = ImageItemGenerator.Generate(ItemCount);

        // One parameterised command reused for every row, inside the migration's
        // transaction: all 2000 rows are inserted, or none.
        Execute.WithConnection((connection, transaction) =>
        {
            using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText =
                "INSERT INTO ImageItems (Id, SortOrder, ImageUrl, Description) " +
                "VALUES (@id, @sortOrder, @imageUrl, @description)";

            var id = AddParameter(command, "@id");
            var sortOrder = AddParameter(command, "@sortOrder");
            var imageUrl = AddParameter(command, "@imageUrl");
            var description = AddParameter(command, "@description");

            foreach (var item in items)
            {
                id.Value = item.Id.ToString();
                sortOrder.Value = item.SortOrder;
                imageUrl.Value = item.ImageUrl;
                description.Value = item.Description;
                command.ExecuteNonQuery();
            }
        });
    }

    public override void Down()
    {
        Execute.Sql("DELETE FROM ImageItems");
    }

    private static System.Data.IDbDataParameter AddParameter(System.Data.IDbCommand command, string name)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        command.Parameters.Add(parameter);
        return parameter;
    }
}
