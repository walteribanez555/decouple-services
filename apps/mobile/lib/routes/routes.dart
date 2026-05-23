import 'package:go_router/go_router.dart';

import '../features/age_verification/presentation/age_verification_page.dart';

/// Route name constants — use these with [context.goNamed] to avoid
/// hard-coded strings scattered across the codebase.
abstract final class Routes {
  static const ageVerification = '/';
}

/// Root [GoRouter] instance.
///
/// Each feature owns its own [GoRoute] entries; collect them here.
/// The age-verification flow uses cubit-driven internal navigation,
/// so the whole feature maps to a single route.
final appRouter = GoRouter(
  initialLocation: Routes.ageVerification,
  routes: [
    GoRoute(
      path: Routes.ageVerification,
      builder: (context, state) => const AgeVerificationPage(),
    ),

    // ── Future routes ────────────────────────────────────────────────────
    // GoRoute(path: '/home', builder: (_, __) => const HomePage()),
  ],
);
