using FluentMigrator;

namespace NotesApi.Migrations;

[Migration(2026101501, "Create the ImageItems table")]
public sealed class CreateImageItemsTable : Migration
{
    public override void Up()
    {
        Create.Table("ImageItems")
            .WithColumn("Id").AsString(36).NotNullable().PrimaryKey()
            .WithColumn("SortOrder").AsInt32().NotNullable().Unique("UX_ImageItems_SortOrder")
            .WithColumn("ImageUrl").AsString(512).NotNullable()
            .WithColumn("Description").AsString(512).NotNullable();
    }

    public override void Down()
    {
        Delete.Table("ImageItems");
    }
}
