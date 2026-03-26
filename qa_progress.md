# QA Progress: Feature Verification

## 1. UI/UX Verification
- [x] **Request Name Capitalization**: Verified that names can now include lowercase and mixed-case letters. No more forced uppercase.
- [x] **Custom Modals**: Confirmed that `Save`, `Duplicate`, `Delete`, and `Collection` actions use the new styled dialogs instead of browser native popups.
- [x] **Modal Layout**: Checked the layout on different screen sizes (Responsive design handled).
- [x] **Toasts**: Confirmed Toast messages appear correctly for "Saved", "Updated", and "Copied" actions.

## 2. Request Management Verification
- [x] **First-time Save**: New "Untitled" requests correctly trigger the `SaveRequestModal` to select a collection and name.
- [x] **Silent Save**: Requests with an existing `itemId` update immediately when clicking the Save button, with a Toast notification.
- [x] **Save As**: The "AS" button in the URL bar always opens the modal, allowing duplication into other collections.
- [x] **Duplication**: The Copy icon in the sidebar correctly creates a copy with a "(Copy)" suffix in the same collection.

## 3. Sidebar Functionality Verification
- [x] **Collection Creation**: `addNewCollection` correctly uses the new modal and persists the name.
- [x] **Collection Deletion**: `deleteCollection` correctly warns the user via `ConfirmModal`.
- [x] **Drag & Drop (Within Collection)**: Reordering items within a collection works and persists on page reload.
- [x] **Drag & Drop (Between Collections)**: Moving an item from one collection to another updates the item's `collectionId` and order correctly.

## 4. Stability & Regressions
- [x] **localStorage Sync**: All collection groups and items correctly sync to `localStorage` after modifications.
- [x] **Empty Collections**: Verified that empty collections are handled correctly.
- [x] **Duplicate Prevention**: Confirmed that saving with an existing name in the same collection updates the existing entry.
