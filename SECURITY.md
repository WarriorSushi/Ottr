# Security Guidelines for Ottr App

## API Keys and Sensitive Information

This document provides guidelines for handling sensitive information in the Ottr app codebase.

### 🚨 Important: Never Commit API Keys to GitHub

API keys, secrets, and other sensitive credentials should never be committed to version control. This includes:

- Firebase API keys
- Service account credentials
- Database passwords
- OAuth tokens
- Any other private keys or secrets

### How to Set Up Firebase Configuration Securely

1. Copy the template file to create your own configuration:
   ```bash
   cp lib/firebase_options_template.dart lib/firebase_options.dart
   ```

2. Edit `lib/firebase_options.dart` and replace the placeholder values with your actual Firebase project configuration values.

3. Make sure `lib/firebase_options.dart` is listed in `.gitignore` to prevent it from being committed to the repository.

### Environment Variables (Alternative Approach)

For additional security, you can use environment variables to store sensitive information:

1. Create a `.env` file in the project root (this file should also be in `.gitignore`)
2. Add your environment variables:
   ```
   FIREBASE_WEB_API_KEY=your_web_api_key
   FIREBASE_ANDROID_API_KEY=your_android_api_key
   # Add other keys as needed
   ```

3. Use a package like `flutter_dotenv` to load these variables in your app.

### Best Practices

- Use different API keys for development and production environments
- Implement proper Firebase Security Rules to restrict access to your database
- Regularly rotate API keys and secrets
- Use Firebase App Check to prevent unauthorized API usage
- Implement proper authentication and authorization in your app

### What to Do If You've Accidentally Committed API Keys

If you've accidentally committed API keys or other sensitive information to the repository:

1. Rotate the exposed keys immediately
2. Remove the keys from the repository history using tools like BFG Repo-Cleaner or git-filter-branch
3. Force push the cleaned history to overwrite the exposed keys

Remember: Security is everyone's responsibility. Always be vigilant about protecting sensitive information.
