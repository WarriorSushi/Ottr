import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default Firebase configuration options for the Ottr app
/// 
/// These are the actual Firebase project configuration values for the Ottr app.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  // Firebase configuration for Web
  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyAobM0eAMGBn45KW3BtU-hSLNa4gRzCo-o',
    appId: '1:82977976208:web:3c6c3236d4a9cdea3b0d15',
    messagingSenderId: '82977976208',
    projectId: 'ottr-cht',
    authDomain: 'ottr-cht.firebaseapp.com',
    storageBucket: 'ottr-cht.firebasestorage.app',
    measurementId: 'G-9X75E9GX60'
  );

  // Firebase configuration for Android
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBmPoCOjdFwxuePS8iGfg48pjnvfY-4R1g',
    appId: '1:82977976208:android:b835f5439a0f44eb3b0d15',
    messagingSenderId: '82977976208',
    projectId: 'ottr-cht',
    storageBucket: 'ottr-cht.firebasestorage.app',
  );

  // Firebase configuration for iOS
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyAsJjad5L_LS7thmZf9rHBHEiwW1lDcKF8',
    appId: '1:82977976208:ios:209bf794c8fcfc6c3b0d15',
    messagingSenderId: '82977976208',
    projectId: 'ottr-cht',
    storageBucket: 'ottr-cht.firebasestorage.app',
    iosBundleId: 'com.ottr.ottrApp',
  );

  // Firebase configuration for macOS
  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyAsJjad5L_LS7thmZf9rHBHEiwW1lDcKF8',
    appId: '1:82977976208:ios:209bf794c8fcfc6c3b0d15',
    messagingSenderId: '82977976208',
    projectId: 'ottr-cht',
    storageBucket: 'ottr-cht.firebasestorage.app',
    iosBundleId: 'com.ottr.ottrApp',
  );

  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'AIzaSyAobM0eAMGBn45KW3BtU-hSLNa4gRzCo-o',
    appId: '1:82977976208:web:199f8e73b38f225f3b0d15',
    messagingSenderId: '82977976208',
    projectId: 'ottr-cht',
    authDomain: 'ottr-cht.firebaseapp.com',
    storageBucket: 'ottr-cht.firebasestorage.app',
    measurementId: 'G-7633L7BL72',
  );
}
