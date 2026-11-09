# Upload Feature Status

**Project:** Basha Vara
**Status:** Real file upload is not implemented yet
**Last reviewed:** 2026-11-08

## Scope

This document is the source of truth for property photo and profile photo upload work. Future agents must read it before implementing upload functionality.

## Current stack

- Frontend: Next.js, React, TypeScript, Capacitor
- Backend: NestJS, Prisma, PostgreSQL
- Deployment: Vercel frontend and Render backend
- Strategy: free-first services and local development before deployment

## Already implemented

### Property photo database model

`backend/prisma/schema.prisma` contains `PropertyPhoto` with:

- `url`
- optional `storageKey`
- optional `caption`
- `isPrimary`
- `sortOrder`
- cascade deletion with the property

`storageKey` exists for a future storage provider but is not currently populated by an upload workflow.

### Property API accepts URL strings

`backend/src/properties/dto/create-property.dto.ts` defines `PropertyPhotoInputDto`.

Current behavior:

- Accepts `url` validated with `@IsUrl()`.
- Accepts caption, primary flag, and sort order.
- Accepts JSON only; it does not accept `multipart/form-data` or binary files.

`backend/src/properties/properties.controller.ts` exposes JSON property create/update endpoints only. There is no upload endpoint.

`backend/src/properties/properties.service.ts` stores submitted URLs in `PropertyPhoto` and replaces existing photos when update data includes photos.

### Landlord property UI

`frontend/app/landlord/properties/page.tsx` currently:

- Uses a `photoUrl` text field.
- Sends the URL to the property API.
- Uses an Unsplash URL as the default value.
- Does not provide a file picker, local preview, upload progress, retry state, delete, or reorder controls.

### Profile photo UI

`frontend/app/settings/page.tsx` currently shows a profile preview and a `Change Photo` button. The button has no file input or upload handler. There is no confirmed backend persistence path for profile images.

## Not implemented

- Multipart upload endpoint
- Durable object storage integration
- Signed upload or backend provider credentials
- File type, size, count, and dimension validation
- Upload progress, cancellation, retry, and failure states
- Property photo delete, reorder, and primary-photo endpoints
- Profile photo persistence
- Orphan-file cleanup
- Image compression or responsive derivatives
- Upload authorization and ownership tests
- Abuse/rate limits and content validation

## Free-first recommendation

Do not store uploaded binaries in PostgreSQL or the Render filesystem. Render instances can restart or be replaced, so local files are not durable.

Evaluate a free-tier object-storage provider, preferably Supabase Storage or Cloudinary, against current account limits. Keep provider secrets only in the NestJS backend environment.

Recommended flow:

1. Backend authenticates the landlord/admin and validates the target property.
2. Backend creates a short-lived signed upload request, or receives and forwards a validated file.
3. Frontend uploads directly to the provider using the signed request.
4. Frontend calls the backend completion endpoint.
5. Backend saves the provider URL and `storageKey` in `PropertyPhoto`.
6. Delete operations remove the provider object and database row with retry/cleanup handling.

Never expose provider API secrets through `NEXT_PUBLIC_*` variables.

## Recommended API contract

### Create upload intent

```text
POST /api/v1/uploads/property-photo
Authorization: Bearer <access-token>
```

Validate role, property ownership, MIME type, file size, photo count, and generate the storage key on the server.

### Complete a property photo

```text
POST /api/v1/properties/:id/photos
Authorization: Bearer <access-token>
```

Example payload:

```json
{
  "url": "https://storage-provider.example/property-photo.webp",
  "storageKey": "properties/<property-id>/<generated-id>.webp",
  "caption": "Living room",
  "isPrimary": true,
  "sortOrder": 0
}
```

### Delete a property photo

```text
DELETE /api/v1/properties/:propertyId/photos/:photoId
Authorization: Bearer <access-token>
```

Verify ownership before deleting both the provider object and database row.

## Frontend requirements

- Accessible file input that works on desktop and mobile.
- Preview selected files before upload.
- Validate type and size before network requests.
- Per-file progress, retry, and error state.
- Remove selected files before submission.
- Select a primary image and persist ordering.
- Do not submit a listing while required uploads are incomplete.
- Keep URL input only as an explicit admin/import fallback, if needed.
- Use the normal file input for mobile camera/gallery selection before adding native camera plugins.

## Security requirements

- Do not trust filename extensions; validate MIME type and file signatures where practical.
- Generate storage keys on the server.
- Enforce authenticated role and property ownership on every mutation.
- Apply file size, count, and request-rate limits.
- Do not log file contents, tokens, signed URLs, or provider secrets.
- Use HTTPS-only upload and delivery URLs.
- Expire abandoned upload intents.

## Implementation phases

### Phase 1: Provider and backend

- Choose a free-tier provider after checking current limits.
- Add placeholders to backend `.env.example`, never real secrets.
- Implement upload intent, completion, and delete endpoints.
- Add validation, authorization, and cleanup tests.

### Phase 2: Property photos

- Replace `photoUrl` with a file picker.
- Add previews, progress, retry, remove, primary, and reorder behavior.
- Create the property as a draft while uploads complete, or submit only after all uploads succeed.

### Phase 3: Profile photos

- Add an authenticated profile-photo endpoint.
- Connect the existing `Change Photo` control.
- Return the persisted profile photo URL from the user API.

### Phase 4: Operations

- Add orphan cleanup and retry handling.
- Monitor free-tier storage and bandwidth usage.
- Add desktop and mobile end-to-end coverage.
- Document provider setup and production environment variables.

## Definition of done

The feature is complete when landlords can select photos on desktop and mobile, see recoverable upload progress, persist photos in durable storage, reorder and select a primary image, and delete photos safely. Only authorized users may mutate photos, and tests cover validation, authorization, success, failure, and cleanup.
