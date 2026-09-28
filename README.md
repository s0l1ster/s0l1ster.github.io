# Gym Together 🏋️

A tiny real-time weekly gym planner for Vasyl and Oleg.

## 1. Firebase setup

1. Open Firebase Console: https://console.firebase.google.com/
2. Create a project called `gym-together`.
3. Open **Build → Realtime Database**.
4. Create the database. Choose a nearby location and start in **locked mode**.
5. Open **Build → Authentication → Sign-in method**.
6. Enable **Anonymous** sign-in.
7. Open **Realtime Database → Rules** and replace the rules with:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

8. Go to **Project settings → Your apps → Web app**.
9. Register a Web app (no hosting needed).
10. Copy the Firebase config into `firebase-config.js`.
11. Make sure `databaseURL` exactly matches the URL shown in Realtime Database.

## 2. GitHub Pages

Upload these 4 files to the root of a GitHub repository:

- `index.html`
- `style.css`
- `app.js`
- `firebase-config.js`

Then GitHub:
**Settings → Pages → Deploy from a branch → main → / (root) → Save**

Wait for deployment, open the generated `github.io` address on both phones, and select Vasyl/Oleg.

## 3. Important

The Firebase Web config is intended to be included in frontend code. The database rules are what protect the data from unauthenticated access.

The app automatically creates a separate schedule for each Monday-based week. No manual Sunday reset is needed.
