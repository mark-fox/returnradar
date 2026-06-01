# ReturnRadar MVP Demo Script

## Demo Goal

Show that ReturnRadar can scan or manually track purchases, save receipt information, track return/warranty deadlines, and help users avoid missing important purchase-related dates.

---

## 1. Start with the Home Screen

ReturnRadar is a mobile AI app for tracking purchases, receipts, return windows, warranties, manuals, and product support information.

The Home screen gives a quick overview of tracked products, upcoming return windows, warranty deadlines, expired deadlines, and reminder candidates.

---

## 2. Manual Product Flow

Open the Products tab and add a new product manually.

Enter:

- Product name
- Merchant
- Price
- Purchase date
- Return deadline
- Warranty deadline
- Warranty provider
- Warranty claim URL
- Model number
- Serial number
- Manual URL
- Support URL
- Support phone
- Notes

Use the calendar selector to choose dates.

Save the product.

Open the product detail page and show that the saved product information is displayed, including warranty and support metadata.

Attach a receipt image to the product and show that it appears on the detail page.

---

## 3. AI Receipt Scan Flow

Open the Scan Receipt screen.

Select or capture a receipt image.

Show that the backend AI extraction returns suggested product information and detected line items.

Review the AI-generated fields before saving.

Show the receipt item workflow:

- Current item marked as reviewing
- Save one item
- Next item auto-loads
- Skip an irrelevant item
- Add a missing receipt item manually
- Save the missing item

Finish the receipt session.

Open the saved product and show that the receipt image and extracted product details were saved.

---

## 4. Product Management Flow

Open the Products tab.

Show:

- Search
- Sorting
- Status filtering
- Product detail navigation
- Bulk archive
- Archived products
- Restore archived product

Explain that products can be managed whether they were created manually or from AI receipt extraction.

---

## 5. Deadline Tracking Flow

Open the Deadlines tab.

Show:

- Returns due soon
- Warranties ending soon
- Expired returns
- Expired warranties

Open a deadline item and show that it leads back to the product detail page.

Explain that Home shows quick reminder candidates, while the Deadlines tab gives the full deadline view.

---

## 6. Notifications Note

ReturnRadar includes local notification scheduling logic for deadline reminders.

For Expo Go testing, notification runtime is guarded because Android push notification functionality is not fully supported in Expo Go on SDK 53+.

Full notification testing should be done in a development build.

---

## 7. Technical Summary

ReturnRadar uses:

- Expo + React Native + TypeScript for the mobile app
- FastAPI + SQLAlchemy + PostgreSQL for the backend
- Alembic for database migrations
- OpenAI Vision API through the backend for receipt extraction
- Backend-routed AI requests so provider keys are not exposed in the mobile app
- pytest for backend tests
- TypeScript and lint checks for the mobile app

---

## Closing Summary

ReturnRadar demonstrates a working AI-powered mobile product tracker.

The MVP supports:

- Manual product tracking
- AI receipt extraction
- Multi-item receipt review
- Receipt image storage
- Return/warranty deadline tracking
- Product search/filter/archive workflows
- Warranty and support metadata
- In-app reminder candidates