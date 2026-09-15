# Firebase Setup for Bakery POS

To complete the Phase 2 database integration, follow these steps to secure and enable the Firebase Realtime Database.

## 1. Authentication
Because the database rules require an authenticated user, you must enable authentication:
1. Go to the Firebase Console -> Build -> **Authentication**
2. Click **Get Started**
3. Select **Email/Password** under Native Providers
4. Enable Email/Password and click **Save**
5. Go to the **Users** tab and click **Add User** to create an account for testing the POS.

## 2. Realtime Database Deployment
The Bakery POS expects three specific root nodes: `categories`, `menuItems`, and `shelfInventory`. The rules strictly validate the schema to prevent corruption.

Phase 2 treats every authenticated account as a trusted bakery staff account. Root-level authenticated access is required because safe category deletion uses one atomic root transaction to verify that no menu item references the category before removing it. Child schema validation still rejects malformed records and unknown fields.

1. Go to Firebase Console -> Build -> **Realtime Database**
2. Ensure you have created a Realtime Database instance (Start in test mode or locked mode, it doesn't matter, we will replace the rules).
3. Navigate to the **Rules** tab in the Realtime Database interface.
4. Copy the entire contents of `database.rules.json` from this repository.
5. Paste it into the Rules editor, replacing what is there.
6. Click **Publish**.

Your Bakery POS is now synced with your Firebase project. Only create accounts for trusted bakery staff. If you later need separate cashier and manager permissions, add Firebase custom claims and update these rules before inviting less-trusted users.