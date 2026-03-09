# Web Push Notifications - Setup & Troubleshooting

## Notifications When App Is Closed or in Background

### What we added
1. **Enable banner** – A banner appears at the bottom asking users to enable notifications. Tap "Enable" and allow when the browser prompts.
2. **iOS "Add to Home Screen"** – On iOS, after enabling, you'll see a hint: "Tap Share → Add to Home Screen". **This is required** for push when the app is closed.
3. **Auto-subscribe** – If you previously allowed notifications but didn't complete setup, we retry subscribing on next visit.

### Steps for users

**Android:**
1. Open the site in Chrome
2. Tap "Enable" when the banner appears
3. Tap "Allow" in the browser prompt
4. Close the app or put it in background
5. Admin sends a notification → it appears in the system tray

**iOS (16.4+):**
1. Open the site in Safari
2. Tap "Enable" when the banner appears
3. Tap "Allow" in the prompt
4. **Important:** Tap Share (□↑) → "Add to Home Screen"
5. Open the app from the home screen icon
6. Now notifications work when the app is closed

## iOS White Screen Fix
The app now guards against iOS issues:
- **Notification API** may not exist on iOS &lt; 16.4 or in some WebViews
- **Service worker** registration is wrapped in try-catch
- **Error boundary** shows a fallback UI instead of a blank screen if something fails

## Android - Notifications Not in System Tray

### Requirements for system tray notifications
1. **User must enable push** – Tap the notification bell → "Enable system notifications" → Allow
2. **HTTPS** – Web Push requires HTTPS (or localhost for dev)
3. **Chrome/Android browser** – Use Chrome, Firefox, or Edge (not in-app WebView from another app)
4. **Site notification permission** – In Chrome: Site settings → Notifications → Allow
5. **Device notification settings** – Do Not Disturb / battery optimization may block notifications

### Checklist
- [ ] User clicked "Enable system notifications" in the app
- [ ] Browser prompted for permission and user clicked "Allow"
- [ ] VAPID keys are set in backend `.env`
- [ ] Admin sees "(X to notification center)" when sending – if 0, no one has subscribed

### Testing
1. On Android Chrome, open the app
2. Tap the bell icon → "Enable system notifications" → Allow
3. Send a test notification from Admin → Notifications tab
4. Put the app in background or lock the phone
5. Notification should appear in the system tray within a few seconds

## iOS Web Push
- Web Push is supported in **Safari 16.4+** (iOS 16.4+)
- Older iOS shows in-app notifications only (bell dropdown)
- PWA must be "Add to Home Screen" for best iOS experience
