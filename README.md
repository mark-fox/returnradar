# ReturnRadar

ReturnRadar is a mobile AI-powered application that helps users track purchases, receipts, return windows, warranties, manuals, and product support information.

Core value proposition:

> Scan receipts, track return windows, and never lose warranty info again.

---

# Current Project Status

Active development.

ReturnRadar currently includes:

- Mobile app built with Expo + React Native
- FastAPI backend with PostgreSQL persistence
- AI-powered receipt extraction workflow
- Product management system
- Return and warranty deadline tracking
- Deadline dashboard and urgency grouping
- Product archive / restore workflow
- Warranty claim information support
- Receipt image upload and storage
- AI-assisted warranty provider suggestions
- Search, sorting, filtering, and bulk archive actions
- Automated backend tests with pytest

---

# Current Features

## AI Receipt Scanning

Users can:

- Upload receipt images
- Extract:
  - Product name
  - Merchant
  - Purchase date
  - Return deadline
  - Warranty deadline
  - Price
  - Line items
  - Warranty provider suggestions
- Review and edit AI-generated fields before saving
- Save extracted products directly into the system

The AI pipeline currently routes through the backend only.

---

## Product Management

Users can:

- Create products manually
- Edit existing products
- Delete products
- Archive products
- Restore archived products
- Bulk archive products
- Search products
- Sort products
- Filter products by urgency/deadline state

---

## Return + Warranty Tracking

ReturnRadar currently supports:

- Return deadline tracking
- Warranty deadline tracking
- Deadline urgency calculations
- Expired / urgent / upcoming groupings
- Dedicated Deadlines dashboard
- Interactive dashboard filtering
- Warranty protection detail sections
- Return window detail sections

---

## Warranty Support Features

Products can now store:

- Warranty provider
- Warranty claim URL
- Warranty notes

Users can:

- Open claim websites directly from the app
- Use AI-suggested warranty providers from receipt scans

---

# Planned Features

## Notifications and Reminders

Planned functionality includes:

- Local push notifications
- Upcoming deadline reminders
- Warranty expiration reminders
- Configurable reminder timing

## Future AI Enhancements

Potential future improvements include:

- Better OCR extraction
- Warranty/manual detection
- Smarter retailer policy understanding
- AI-generated support guidance
- Product manual extraction
- Receipt categorization

---

# Planned Stack

## Mobile

- Expo
- React Native
- TypeScript
- Expo Router

## Backend

- FastAPI
- Python
- SQLAlchemy
- Pydantic
- PostgreSQL
- Docker / Docker Compose
- Alembic

## AI

- OpenAI Vision API
- Backend-routed AI requests only
- AI-assisted extraction with mandatory user confirmation

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
