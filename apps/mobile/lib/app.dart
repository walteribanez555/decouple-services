import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';
import 'routes/routes.dart';

/// Root application widget.
///
/// Wires together:
///   - Theme       → [AppTheme]
///   - Router      → [appRouter] (go_router, defined in routes/routes.dart)
///   - DI          → service locator is initialised before [App] is created
///
/// No business logic lives here; features are added as router destinations
/// in routes/routes.dart.
class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      routerConfig: appRouter,
    );
  }
}
