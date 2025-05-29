# FCM Testing Guide for Android Emulator & Command Prompt

## 🎯 Testing FCM with Android Emulator from Command Prompt

### **Prerequisites Check**
Before testing, ensure you have:
- ✅ Android emulator running (with Google Play Services)
- ✅ FCM implementation completed in your Ottr app
- ✅ Firebase project set up with your app registered
- ✅ Internet connection on emulator

---

## 🚀 **STEP 1: Launch Your App for Testing**

### 1.1 Start Emulator (if not already running)
**Command Prompt Instructions:**
```bash
# List available emulators
emulator -list-avds

# Start your emulator (replace 'YOUR_AVD_NAME' with actual name)
emulator -avd YOUR_AVD_NAME

# OR if you know the emulator name
emulator @Pixel_3a_API_30
```

### 1.2 Build and Run Your App
**In Windsurf Terminal (or separate command prompt):**
```bash
# Navigate to your project directory
cd path/to/your/ottr_app

# Clean and get dependencies
flutter clean
flutter pub get

# Run in debug mode (recommended for testing)
flutter run --debug

# OR run in release mode for production testing
flutter run --release
```

**Expected Output:**
- App should launch without errors
- Should see "FCM Successfully Initialized!" message
- Console should show: "✅ FCM Service initialized successfully"

---

## 🔧 **STEP 2: Verify FCM Token Generation**

### 2.1 Get FCM Token from Your App
**In the running app:**
1. Look for the "Show FCM Token" button on the main screen
2. Tap it to display your FCM token
3. **Copy the entire token** (it's a long string)

**Alternative - Get Token from Console:**
```bash
# In your command prompt where flutter run is active
# Look for console output like:
# "✅ FCM Token: dxxxxxxxxxxxxxxxxxxxxx..."
```

### 2.2 Verify Token Format
**Your FCM token should:**
- Be 140+ characters long
- Start with letters like `d`, `f`, `c`, or `e`
- Contain alphanumeric characters and special symbols
- Look like: `dZ8x7Y6w5V4u3T2s1R0q...` (much longer)

**If token is null or empty:**
```bash
# Check these in command prompt:
adb shell settings get secure android_id
adb shell "pm list packages | grep google"

# Ensure Google Play Services is installed
```

---

## 📱 **STEP 3: Test Using Firebase Console (Easiest Method)**

### 3.1 Send Test Notification from Firebase Console
1. **Go to:** [Firebase Console](https://console.firebase.google.com)
2. **Select your project**
3. **Navigate to:** Cloud Messaging → Send your first message
4. **Fill in the form:**
   - **Notification title:** `Test from Firebase Console`
   - **Notification text:** `Your FCM is working perfectly!`
   - **Target:** Single device
   - **FCM registration token:** Paste your copied token
5. **Additional options (expand):**
   - **Custom data:** Add key `type` with value `test`
   - **Android options:** Keep defaults
6. **Click "Review"** then **"Publish"**

### 3.2 Expected Results
**On your emulator, you should see:**
- 🔔 Notification appears in notification bar
- 📱 Notification shows your title and message
- 🚀 Tapping notification opens your app (if closed)
- 📝 Console logs showing message received

---

## 🧪 **STEP 4: Test Different App States**

### 4.1 Test Foreground Notifications (App Open)
```bash
# Keep your app open and visible
# Send notification from Firebase Console
# Expected: Local notification appears even though app is open
```

### 4.2 Test Background Notifications (App Minimized)
```bash
# Press home button to minimize app (don't close it)
# Send notification from Firebase Console
# Expected: System notification appears, tapping opens app
```

### 4.3 Test Terminated Notifications (App Closed)
```bash
# Close app completely (swipe up and swipe away)
# Send notification from Firebase Console
# Expected: System notification appears, tapping launches app
```

### 4.4 Verify Console Logs
**In your command prompt, watch for:**
```
🔔 Initializing FCM Service...
✅ FCM Service initialized successfully
✅ FCM Token: dxxxxx...
📱 Foreground message received: projects/xxx/messages/xxx
🚀 Message opened app: projects/xxx/messages/xxx
```

---

## 🛠️ **STEP 5: Advanced Testing with ADB Commands**

### 5.1 Monitor Notification Logs
**Open new command prompt window:**
```bash
# Monitor all logs related to notifications
adb logcat | findstr /I "notification firebase fcm"

# Monitor Flutter-specific logs
adb logcat | findstr /I "flutter"

# Monitor your app specifically
adb logcat | findstr /I "ottr"
```

### 5.2 Test Notification Permissions
```bash
# Check if notification permissions are granted
adb shell cmd notification allowed_listeners

# Check app's notification settings
adb shell dumpsys notification | findstr /I "ottr"
```

### 5.3 Force Clear Notifications
```bash
# Clear all notifications
adb shell service call notification 1

# Or restart notification service
adb shell killall com.android.systemui
```

---

## 📋 **STEP 6: Test Notification Categories**

### 6.1 Test Message Notifications
**Firebase Console → Send message with:**
```json
{
  "title": "New Message Test",
  "body": "Testing message notifications",
  "data": {
    "type": "new_message",
    "senderId": "test123",
    "pairId": "test_pair"
  }
}
```

### 6.2 Test Connection Notifications
**Firebase Console → Send message with:**
```json
{
  "title": "Connection Test",
  "body": "Testing connection notifications",
  "data": {
    "type": "connection_request",
    "senderId": "test456"
  }
}
```

---

## 🔍 **STEP 7: Troubleshooting Common Issues**

### 7.1 "No FCM Token Generated"
**Command prompt solutions:**
```bash
# Check Google Play Services
adb shell pm list packages | findstr google

# Update Google Play Services in emulator
# Go to Play Store → Search "Google Play Services" → Update

# Restart emulator
adb reboot

# Clear app data and restart
flutter clean
flutter run
```

### 7.2 "Notifications Not Appearing"
**Debug steps:**
```bash
# Check notification permissions
adb shell dumpsys notification | findstr /I "ottr"

# Verify notification channels
adb logcat | findstr /I "channel"

# Check if Do Not Disturb is on
adb shell settings get global zen_mode
# Should return 0 (off) or 1 (on)
```

### 7.3 "App Crashes on Notification"
**Debug approach:**
```bash
# Get detailed crash logs
adb logcat | findstr /I "AndroidRuntime"

# Check for missing dependencies
flutter doctor

# Rebuild with verbose output
flutter run --verbose
```

---

## 🎮 **STEP 8: Interactive Testing Commands**

### 8.1 Send Test Notification via Command Line
**Install Firebase CLI:**
```bash
# Install (if not already installed)
npm install -g firebase-tools

# Login
firebase login

# Send test message (create test script)
```

### 8.2 Create Test Script
**Create file `test_fcm.js`:**
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const message = {
  notification: {
    title: 'Command Line Test',
    body: 'Testing from command line!'
  },
  data: {
    type: 'test',
    source: 'command_line'
  },
  token: 'YOUR_FCM_TOKEN_HERE'
};

admin.messaging().send(message)
  .then((response) => {
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });
```

**Run the script:**
```bash
node test_fcm.js
```

---

## ✅ **STEP 9: Testing Checklist**

**Mark each item as you test:**

### Basic Functionality
- [ ] ✅ App launches without FCM errors
- [ ] ✅ FCM token is generated and displayed
- [ ] ✅ Can copy FCM token from app
- [ ] ✅ Console shows "FCM Service initialized successfully"

### Notification Delivery
- [ ] ✅ Foreground notifications work (app open)
- [ ] ✅ Background notifications work (app minimized)
- [ ] ✅ Terminated notifications work (app closed)
- [ ] ✅ Notification appears in notification bar

### Notification Interaction
- [ ] ✅ Tapping notification opens app
- [ ] ✅ Notification navigation works (goes to correct screen)
- [ ] ✅ Notification data is received correctly
- [ ] ✅ Multiple notifications can be received

### Console Verification
- [ ] ✅ Console shows message received logs
- [ ] ✅ Console shows notification handling logs
- [ ] ✅ No error messages in console
- [ ] ✅ Token refresh works (if tested)

---

## 🚨 **Quick Test Commands Summary**

**Essential testing commands to run in command prompt:**

```bash
# 1. Launch app
flutter run --debug

# 2. Monitor logs (new window)
adb logcat | findstr /I "flutter fcm notification"

# 3. Check app status
adb shell am stack list

# 4. Clear notifications (if needed)
adb shell service call notification 1

# 5. Restart if issues
adb reboot
```

---

## 🎯 **Success Indicators**

**Your FCM is working correctly if you see:**

### ✅ In Console Logs:
```
🔔 Initializing FCM Service...
✅ FCM Service initialized successfully
✅ FCM Token: dZ8x7Y6w5V4u3T2s1R0q...
📱 Foreground message received: projects/xxx/messages/xxx
✅ Local notification shown
```

### ✅ On Emulator Screen:
- Notification appears in notification bar
- Notification has correct title and message
- Tapping notification opens your app
- App shows "FCM Successfully Initialized!" message

### ✅ In Firebase Console:
- Message status shows "Sent"
- Delivery reports show successful delivery
- No error messages

---

## 🔧 **Pro Tips for Emulator Testing**

1. **Use Google Play Emulator**: Ensure your AVD has Google Play Services
2. **Enable Internet**: Check emulator has internet access
3. **Extended Controls**: Use emulator extended controls to simulate scenarios
4. **Multiple Windows**: Keep multiple command prompt windows open for logs
5. **Save Token**: Save your FCM token for repeated testing
6. **Test Timing**: Send notifications at different intervals
7. **Battery Optimization**: Disable battery optimization for your app in emulator settings

This comprehensive testing approach will ensure your FCM implementation works flawlessly!