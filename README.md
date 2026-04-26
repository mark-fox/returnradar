# ReturnRadar

ReturnRadar is a mobile AI application that helps users track purchases, receipts, return windows, warranties, manuals, and product support information.

Core value proposition:

> Scan receipts, track return windows, and never lose warranty info again.

## Project Status

Early development. The initial focus is local development, clean architecture, backend foundation, and mobile app setup.

## Planned Stack

### Mobile
- Expo
- React Native
- TypeScript
- Expo Router

### Backend
- FastAPI
- Python
- SQLAlchemy
- Pydantic
- PostgreSQL
- Docker / Docker Compose

### AI
- Mocked AI extraction first
- Real receipt extraction later
- AI calls routed through backend only
- User confirmation required before saving AI-suggested data

## Repository Structure

```text
returnradar/
  apps/
    api/
    mobile/
  docs/
  README.md
  ```

## Privacy and Safety Notes

Receipts may contain sensitive purchase information. ReturnRadar should avoid logging sensitive receipt contents, should not commit secrets, and should clearly distinguish AI-suggested information from user-confirmed information.

ReturnRadar does not guarantee warranty eligibility, return eligibility, legal rights, or retailer/manufacturer policy accuracy.