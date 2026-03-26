# Task Progress: Request Management & UI Enhancement

## 1. Environment & State Management
- [x] **Installed Dependencies**: `sortablejs`, `@vueuse/integrations`.
- [x] **Modal Store (`ui/src/stores/modal.ts`)**: 
    - Created a centralized Pinia store to manage modal visibility, types ('save', 'collection', 'confirm'), and context data.
    - Implemented a Promise-based `open()` method for easy handling of user input in components.

## 2. Custom UI Components (System Popup Replacement)
- [x] **BaseModal (`ui/src/components/BaseModal.vue`)**: Reusable backdrop and frame with Tailwind CSS animations.
- [x] **SaveRequestModal (`ui/src/components/SaveRequestModal.vue`)**: Allows users to set a name and select a collection when saving.
- [x] **CollectionModal (`ui/src/components/CollectionModal.vue`)**: Custom dialog for creating and renaming collections.
- [x] **ConfirmModal (`ui/src/components/ConfirmModal.vue`)**: Custom dialog for deletion and other confirmation actions.

## 3. Feature Enhancements
- [x] **Capitalization Fix**: Removed `uppercase` class from `GuiBuilder.vue`'s request name input to allow mixed-case names.
- [x] **Request Saving Logic**:
    - **Save**: New requests trigger a modal; existing requests update silently with a Toast notification.
    - [x] **Save As Fix**: Resolved a critical bug where `modalStore` was not imported in `GuiBuilder.vue`, preventing the "Save As" modal from opening. Added `forceNew` support to ensure "Save As" can create new entries even with identical names.

- [x] **Drag & Drop Reordering**:
    - Integrated **VueUse `useSortable`** in the sidebar.
    - Supported reordering within collections and moving items between collections.
    - Implemented `updateItemOrder` in `collections.ts` to persist the new sequence to `localStorage`.
- [x] **Duplication**: Added a "Duplicate" button (Copy icon) in the sidebar and a `duplicateRequest` method in the store.

## 4. Code Cleanup
- [x] Replaced all occurrences of `window.alert`, `window.prompt`, and `window.confirm`.
- [x] Optimized sidebar layout and added scrollbar styling for better UX.
