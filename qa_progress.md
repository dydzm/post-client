# QA Progress: OpenAPI & Variables Verification

## 1. Variable System Verification
- [x] **Variable Replacement**: Verified that `{baseUrl}` in URL is correctly replaced by the value defined in Collection Settings.
- [x] **Header Interpolation**: Confirmed variables work in Header keys/values (e.g., `Authorization: Bearer {token}`).
- [x] **Body Interpolation**: Confirmed variables work inside JSON bodies.
- [x] **Sidebar Gear Icon**: Settings icon correctly opens the `CollectionConfigModal`.

## 2. OpenAPI Import Verification
- [x] **Swagger 2.0 (JSON)**: Verified server URL construction from schemes/host/basePath.
- [x] **OpenAPI 3.0/3.1 (JSON)**: Verified server list extraction and selection.
- [x] **YAML Support**: Confirmed `.yaml` files are correctly parsed using `js-yaml`.
- [x] **Endpoint Mapping**: Verified that paths, methods, and summaries are imported correctly as saved requests.
- [x] **Server Selection**: Selected server URL is automatically set as the `{baseUrl}` variable in the new collection.

## 3. UI/UX Verification
- [x] **Import Flow**: `ImportTypeModal` -> File Selection -> `ImportOpenApiModal` (if OpenAPI) flow is smooth.
- [x] **Preview**: Endpoints list in the import modal correctly shows methods and paths.
- [x] **Variables Editor**: Dynamic Add/Remove variable rows work as expected.

## 4. Stability
- [x] **Persistence**: Collection variables are saved to `localStorage` and persist after reload.
- [x] **Error Handling**: Invalid JSON/YAML files show a descriptive error modal instead of crashing.
