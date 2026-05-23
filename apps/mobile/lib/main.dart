import 'package:flutter/material.dart';

import 'app.dart';
import 'core/dependency_injection/injection.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await setupDependencies();
  runApp(const App());
}
