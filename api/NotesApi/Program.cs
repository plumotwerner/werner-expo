using FluentMigrator.Runner;
using NotesApi.Images;
using NotesApi.Migrations;

const int NotesPerRequest = 50;

var builder = WebApplication.CreateBuilder(args);

// The database is a single SQLite file under App_Data. It is created and filled by
// the migrations at startup, and it is git-ignored: it can always be rebuilt.
var dataDirectory = Path.Combine(builder.Environment.ContentRootPath, "App_Data");
Directory.CreateDirectory(dataDirectory);
var connectionString = $"Data Source={Path.Combine(dataDirectory, "images.db")}";

builder.Services
    .AddFluentMigratorCore()
    .ConfigureRunner(runner => runner
        .AddSQLite()
        .WithGlobalConnectionString(connectionString)
        .ScanIn(typeof(CreateImageItemsTable).Assembly).For.Migrations())
    .AddLogging(logging => logging.AddFluentMigratorConsole());

builder.Services.AddSingleton(new ImageItemRepository(connectionString));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<IMigrationRunner>().MigrateUp();
}

// Every call returns fresh notes with new GUIDs, so the client never receives
// the same note twice and needs no de-duplication.
app.MapGet("/notes", () =>
    Enumerable.Range(0, NotesPerRequest)
        .Select(_ =>
        {
            var id = Guid.NewGuid();
            return new NoteDto(id, $"Server note {id}");
        })
        .ToList());

app.MapImageEndpoints();

app.Run();

internal sealed record NoteDto(Guid Id, string Text);
