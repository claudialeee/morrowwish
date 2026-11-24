# Cat Bond Save Manager

## Purpose

All three save slots are independent. The Save Manager stores a complete, versioned snapshot of the game state rather than a hand-maintained list of scene fields.

## Local data model

The canonical local record is the single catbond_save_slots_v1 localStorage key. Its book format is version 2:

    {
      version: 2,
      updatedAt: 0,
      slots: {
        slot1: {
          schemaVersion: 1,
          revision: 4,
          savedAt: 1795550000000,
          checksum: "fnv1a-hex",
          data: {
            snapshotVersion: 1,
            state: { /* complete State.S object, including unknown future fields */ },
            systems: {
              "module-key": { version: 1, data: { /* module-owned snapshot */ } }
            }
          }
        }
      }
    }

- The complete three-slot book is committed with one localStorage.setItem, so a failed write cannot partially update one slot.
- The previous valid book is retained as a recovery copy.
- catbond_save_v1 is only a compatibility mirror for older story helpers. It is not authoritative.
- Legacy single-save and version-1 slot books are migrated when read.
- Slot checksums are validated before loading. Corrupt slots are shown as damaged and cannot be loaded.
- The whole State.S object is cloned. New fields added by future chapters, NPCs, quests, cat systems, inventory, garden systems, or progression modules are retained without changing the save schema.

## Runtime API

The stable global interface is window.SaveManager. Existing game code can continue using window.State.

| API | Behavior |
| --- | --- |
| SaveManager.listSlots() | Returns metadata for all three slots, including empty/corrupt status, chapter, region, play time, and save timestamp |
| SaveManager.getSlot(id) | Returns a cloned versioned snapshot or null |
| SaveManager.startNew(id, { overwriteConfirmed }) | Starts a new adventure; refuses to replace an occupied slot unless explicitly confirmed |
| SaveManager.load(id) | Loads exactly the selected slot; refuses empty or corrupt slots |
| SaveManager.saveCurrent(id, { overwriteConfirmed }) | Manually copies the current run into the selected slot; does not switch the active slot |
| SaveManager.replaceSlots(entries, activeId) | Atomically replaces the local three-slot book, used by cloud restore |
| SaveManager.snapshot() | Returns the complete versioned snapshot |
| SaveManager.registerAdapter(key, adapter) | Registers versioned serialization for module-owned runtime data |

The corresponding compatibility methods are State.startNewGame, State.loadSlot, State.save, State.saveToSlot, State.listSaveSlots, State.getSaveSlot, State.replaceSaveSlots, and State.registerSaveAdapter.

### Registering a future system

A module with runtime data outside State.S should register one adapter. Do not add its fields to a scene-specific save switch.

    SaveManager.registerAdapter('npc-relationships', {
      version: 1,
      serialize() {
        return npcRuntime.exportState();
      },
      restore(data) {
        npcRuntime.importState(data);
      },
      migrate(oldData, fromVersion, toVersion) {
        return migrateNpcSave(oldData, fromVersion, toVersion);
      },
      reset() {
        npcRuntime.resetForNewAdventure();
      }
    });

Adapter data is JSON-cloned and versioned independently. Unrecognized adapter records are retained when a module is not loaded yet, so an unrelated save will not discard that module's future data.

## Cloud protocol

The existing Cloudflare Worker and D1 binding are reused. No paid service or server secret is shipped to the browser.

- The player-held CB1. recovery code is the cloud credential. It is a bearer code, not an email/password account.
- Save payloads are encrypted client-side with AES-GCM before upload.
- GET /api/cat-bond-cloud-save?slot=slot1 reads one slot.
- PUT /api/cat-bond-cloud-save accepts slotId, encrypted iv and ciphertext, and that slot's expectedRevision.
- D1 stores one independently revisioned row per slot. The row key is SHA-256 of the recovery code plus the slot suffix; the recovery code and plaintext game state are not stored in D1.
- A stale revision returns HTTP 409. Normal sync never silently overwrites a remote change.
- The cloud panel lets the player explicitly load cloud slots or confirm that this device should overwrite the cloud slots.
- The former unslotted cloud row remains readable for one-time migration.

Cloud sync is optional. Local saves work without network access, a recovery code, or a working D1 binding.

## Emergency reset

State.hardReset() is a safe recovery signal only. The caller reloads the page to clear transient input/scene state. It suppresses unload autosave during that reload and never deletes or rewrites any of the three save slots.

## Current engine boundaries

The current game state stores the active overworld region, region unlocks, exploration fractions, and collected map nodes. It does not currently store a live in-region player coordinate. The existing battle engine also has no stable mid-battle serializer; cat health, battle preferences, mastery records, rewards, and other battle progression already stored in State.S are saved, but an in-progress combat encounter cannot yet be resumed at the exact frame. Add a SaveManager.registerAdapter implementation when the map or battle engine exposes a stable serialization contract; do not serialize live class instances or canvas/VFX objects directly.
