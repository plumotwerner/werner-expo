import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { fetchServerNotes } from "@/api/notes-api";
import {
  SampleNotesDialog,
  type SampleNotesSource,
} from "@/components/sample-notes-dialog";
import {
  addNote,
  addNotes,
  deleteAllNotes,
  deleteNote,
  listNotes,
  migrateNotesDatabase,
  seedSampleNotes,
  updateNote,
  type Note,
} from "@/db/notes-database";

export default function NotesScreen() {
  return (
    <SQLiteProvider databaseName="notes.db" onInit={migrateNotesDatabase}>
      <NotesList />
    </SQLiteProvider>
  );
}

function NotesList() {
  const db = useSQLiteContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const isEditing = editingId !== null;
  const canSave = draft.trim() !== "";

  useEffect(() => {
    let isCurrent = true;
    listNotes(db).then((rows) => {
      if (isCurrent) setNotes(rows);
    });
    return () => {
      isCurrent = false;
    };
  }, [db]);

  async function reload() {
    setNotes(await listNotes(db));
  }

  function startEditing(note: Note) {
    setEditingId(note.id);
    setDraft(note.text);
  }

  function stopEditing() {
    setEditingId(null);
    setDraft("");
  }

  async function handleSave() {
    if (!canSave) return;

    if (editingId === null) {
      await addNote(db, draft.trim());
    } else {
      await updateNote(db, editingId, draft.trim());
    }
    stopEditing();
    await reload();
  }

  async function handleDelete(id: number) {
    if (id === editingId) stopEditing();
    await deleteNote(db, id);
    await reload();
  }

  function openSampleDialog() {
    setSeedError(null);
    setIsDialogVisible(true);
  }

  function closeSampleDialog() {
    if (!isSeeding) setIsDialogVisible(false);
  }

  async function handleAddSamples(source: SampleNotesSource) {
    setIsSeeding(true);
    setSeedError(null);
    try {
      if (source === "faker") {
        await seedSampleNotes(db);
      } else {
        const serverNotes = await fetchServerNotes();
        await addNotes(
          db,
          serverNotes.map((note) => note.text),
        );
      }
      await reload();
      setIsDialogVisible(false);
    } catch (error) {
      setSeedError(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsSeeding(false);
    }
  }

  async function handleDeleteAll() {
    stopEditing();
    await deleteAllNotes(db);
    await reload();
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={isEditing ? "Edit note" : "Write a note"}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleSave}
          returnKeyType="done"
        />
        <Pressable
          style={[styles.button, !canSave && styles.buttonDisabled]}
          disabled={!canSave}
          onPress={handleSave}
        >
          <Text style={styles.buttonLabel}>{isEditing ? "Save" : "Add"}</Text>
        </Pressable>
        {isEditing && (
          <Pressable style={styles.cancelButton} onPress={stopEditing}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.toolsRow}>
        <Pressable style={styles.toolButton} onPress={openSampleDialog}>
          <Text style={styles.toolLabel}>Add sample notes</Text>
        </Pressable>
        <Pressable style={styles.toolButton} onPress={handleDeleteAll}>
          <Text style={styles.toolLabel}>Delete all</Text>
        </Pressable>
      </View>

      <Text style={styles.count}>
        {notes.length} {notes.length === 1 ? "note" : "notes"} stored on this
        device. Swipe a note to delete it, long press to edit it.
      </Text>

      <FlatList
        data={notes}
        keyExtractor={(note) => String(note.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No notes yet</Text>}
        renderItem={({ item }) => (
          <ReanimatedSwipeable
            overshootRight={false}
            renderRightActions={() => (
              <View style={styles.deleteAction}>
                <SymbolView
                  name={{ ios: "trash", android: "delete", web: "delete" }}
                  tintColor="white"
                  size={22}
                />
              </View>
            )}
            onSwipeableOpen={() => handleDelete(item.id)}
          >
            <Pressable
              style={[
                styles.noteRow,
                item.id === editingId && styles.noteRowEditing,
              ]}
              onLongPress={() => startEditing(item)}
            >
              <Text style={styles.noteText}>{item.text}</Text>
              <View style={styles.rowActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit note"
                  hitSlop={8}
                  onPress={() => startEditing(item)}
                >
                  <SymbolView
                    name={{ ios: "pencil", android: "edit", web: "edit" }}
                    tintColor="royalblue"
                    size={22}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete note"
                  hitSlop={8}
                  onPress={() => handleDelete(item.id)}
                >
                  <SymbolView
                    name={{ ios: "trash", android: "delete", web: "delete" }}
                    tintColor="tomato"
                    size={22}
                  />
                </Pressable>
              </View>
            </Pressable>
          </ReanimatedSwipeable>
        )}
      />

      <SampleNotesDialog
        visible={isDialogVisible}
        isBusy={isSeeding}
        errorMessage={seedError}
        onCancel={closeSampleDialog}
        onConfirm={handleAddSamples}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
    backgroundColor: "white",
  },
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "royalblue",
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 8,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: { color: "white", fontSize: 16 },
  cancelButton: { justifyContent: "center", paddingHorizontal: 4 },
  cancelLabel: { color: "gray", fontSize: 16 },
  toolsRow: { flexDirection: "row", gap: 8 },
  toolButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "royalblue",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  toolLabel: { color: "royalblue" },
  count: { color: "gray" },
  list: { gap: 8 },
  empty: { color: "gray", textAlign: "center", marginTop: 24 },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "white",
  },
  noteRowEditing: { borderColor: "royalblue", backgroundColor: "#eef2ff" },
  noteText: { flex: 1, fontSize: 16 },
  rowActions: { flexDirection: "row", gap: 16, flexShrink: 0 },
  deleteAction: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "tomato",
  },
});
