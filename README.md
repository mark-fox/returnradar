# ReturnRadar

ReturnRadar is a mobile AI-powered application that helps users track purchases, receipts, return windows, warranties, manuals, and product support information.

Core value proposition:

> Scan receipts, track return windows, and never lose warranty info again.

---

# Current Project Status

ReturnRadar is currently a working MVP prototype.

The core product flows have been implemented and manually tested:

- Manual product creation and editing
- AI receipt image extraction
- Multi-item receipt review
- Receipt image storage and display
- Return and warranty deadline tracking
- Product search, filtering, sorting, archive, and restore
- Deadline dashboard and reminder candidate workflow
- Local notification workflow guarded for Expo Go limitations
- Backend API tests with pytest
- Mobile lint and TypeScript checks

The app is still in active development and is not production-ready yet. The next major project phase is demo/deployment readiness.

---

# Current Features

## AI Receipt Scanning

Users can upload or capture a receipt image and extract suggested purchase details through the backend AI pipeline.

The receipt scan flow currently supports:

- Receipt image upload
- AI-powered extraction through the backend
- Product name extraction
- Merchant extraction
- Purchase date extraction
- Return deadline extraction
- Warranty deadline extraction
- Price extraction
- Line item extraction
- Warranty provider suggestions
- User review before saving
- Saving one or more receipt line items as products
- Skipping irrelevant receipt line items
- Adding missing receipt line items manually
- Auto-loading the next unreviewed receipt item
- Persisting an active receipt review session
- Finishing/resetting a receipt session

AI-suggested data is treated as editable draft information. The user must review and confirm product details before saving.

---

## Product Management

Users can:

- Create products manually
- Edit existing products
- Archive products
- Restore archived products
- Bulk archive products
- Search products
- Sort products
- Filter products by deadline/urgency state
- Attach or replace a receipt image on an existing product

Products can store:

- Product name
- Merchant
- Purchase date
- Return deadline
- Warranty deadline
- Price
- Notes
- Receipt image path
- Source metadata
- AI provider/confidence metadata
- Archive status

---

## Receipt Image Handling

ReturnRadar supports receipt image storage and display.

Current receipt image functionality includes:

- Uploading receipt images for AI extraction
- Returning `receipt_image_path` as structured backend response data
- Saving receipt image paths to products
- Displaying saved receipt images on product detail pages
- Opening receipt images in a full-screen viewer
- Attaching a receipt image to an existing manually created product
- Replacing a saved receipt image
- Showing a fallback message if a saved receipt image cannot be loaded

Receipt images are currently stored in the backend `uploads/` directory for local/MVP development.

---

## Return and Warranty Deadline Tracking

ReturnRadar tracks return windows and warranty deadlines.

Current deadline functionality includes:

- Return deadline tracking
- Warranty deadline tracking
- Deadline urgency calculations
- Expired deadline detection
- Upcoming return window grouping
- Upcoming warranty deadline grouping
- Dedicated Deadlines tab
- Dashboard reminder preview on Home
- Deadline summary cards
- Deadline filtering by type/status

The current reminder windows are:

- Returns due within 7 days
- Warranties ending within 30 days
- Expired return/warranty deadlines

---

## Notifications and Reminders

ReturnRadar includes a local notification workflow for deadline reminders.

Current notification functionality includes:

- Notification permission helper
- Android notification channel setup
- Local deadline reminder scheduling helper
- Manual refresh/disable notification controls
- Notification preference persistence
- Notification tap navigation to product detail
- Launch-from-notification navigation handling

Important limitation:

- Expo Go does not fully support `expo-notifications` push notification functionality on Android in SDK 53+.
- Notification runtime is disabled/guarded in Expo Go to prevent runtime errors.
- Notification behavior should be tested in a development build, not plain Expo Go.

For MVP purposes, the in-app reminder and deadline flows are working, while full notification testing requires a development build.

---

## Warranty and Product Support Information

Products can store warranty and support metadata.

Warranty fields include:

- Warranty provider
- Warranty claim URL
- Warranty notes

Product support fields include:

- Model number
- Serial number
- Manual URL
- Support URL
- Support phone

Users can open warranty claim pages, manuals, support pages, and support phone links directly from the product detail screen.

Product search includes relevant support metadata such as model number, serial number, and support phone.

---

## Date Entry

Product forms support both manual date entry and native calendar selection.

Date fields currently using the date picker include:

- Purchase date
- Return deadline
- Warranty deadline

Users can still type dates manually in `YYYY-MM-DD` format.

---

# Technology Stack

## Mobile

- Expo
- React Native
- TypeScript
- Expo Router
- AsyncStorage
- Expo Image Picker
- Expo Notifications
- React Native DateTimePicker

## Backend

- FastAPI
- Python
- SQLAlchemy
- Pydantic
- PostgreSQL
- Alembic
- Docker / Docker Compose
- pytest

## AI

- OpenAI Vision API
- Backend-routed AI requests only
- User-reviewed AI extraction output

---

# Repository Structure

```text
returnradar/
  apps/
    api/
    mobile/
  docs/
  README.md
```

---

# Backend Overview

The backend provides APIs for:

- Health checks
- Product CRUD
- Product archive/restore
- Product search/sort/filter
- Deadline reminder candidates
- Receipt image attachment
- AI receipt text extraction
- AI receipt image extraction
- AI provider status

Backend persistence uses PostgreSQL with SQLAlchemy models and Alembic migrations.

Uploads are currently stored in a local `uploads/` directory and mounted through FastAPI static files.

---

# Mobile Overview

The mobile app includes:

- Home dashboard
- Products tab
- Deadlines tab
- AI status tab
- Product detail screen
- Add product screen
- Edit product screen
- Receipt scan/review screen
- Archived products screen

The mobile app talks to the backend through `EXPO_PUBLIC_API_BASE_URL`.

---

# Local Development

## Backend

Typical backend commands are run from:

```text
apps/api
```

Common commands:

```bash
pytest
alembic upgrade head
```

The backend requires environment variables such as:

```env
DATABASE_URL=
RECEIPT_EXTRACTOR_PROVIDER=mock
BACKEND_CORS_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:3000
OPENAI_API_KEY=
```

## Mobile

Typical mobile commands are run from:

```text
apps/mobile
```

Common commands:

```bash
npm run lint
npm run typecheck
npx expo start
```

---

# Testing Status

Current checks used during development:

## Backend

```bash
pytest
```

## Mobile

```bash
npm run lint
npm run typecheck
```

Recent status:

- Backend tests passing
- Mobile lint passing
- Mobile TypeScript check passing
- Manual product flow passing
- AI receipt scan flow passing
- Deadline/reminder flow passing
- Product management flow passing

---

# MVP Demo Path

A good MVP demo flow is:

1. Start the backend.
2. Start the mobile app.
3. Open the app on a test device.
4. Add a product manually.
5. Attach a receipt image to the product.
6. Confirm the product detail page shows the receipt image and support/warranty metadata.
7. Scan a receipt image with AI.
8. Review detected line items.
9. Save one or more receipt items as products.
10. Open the Products tab and search/filter products.
11. Open the Deadlines tab and review upcoming/expired deadlines.
12. Show Home dashboard reminders.

---

# Privacy and Safety Notes

Receipts may contain sensitive purchase information.

ReturnRadar should:

- Avoid logging sensitive receipt contents
- Avoid committing secrets or API keys
- Clearly distinguish AI-suggested information from user-confirmed information
- Require user review before saving AI-generated data

ReturnRadar does not guarantee:

- Warranty eligibility
- Return eligibility
- Legal rights
- Retailer/manufacturer policy accuracy
- AI extraction correctness

---

# Current MVP Limitations

ReturnRadar is not production-ready yet.

Known MVP limitations:

- No user accounts or authentication
- No per-user product isolation
- Receipt images are stored locally in the backend `uploads/` folder
- Notification testing requires a development build
- AI extraction depends on the configured backend provider and OpenAI API key
- Retailer return/warranty policies are estimates or AI-suggested data and must be verified by the user
- Upload storage is suitable for local/demo use, not production-scale storage

