import 'package:flutter/material.dart';

/// Global navigation key for FCM and other services that need to navigate
/// outside of the context of a widget
class NavigatorKey {
  static final GlobalKey<NavigatorState> key = GlobalKey<NavigatorState>();
}
