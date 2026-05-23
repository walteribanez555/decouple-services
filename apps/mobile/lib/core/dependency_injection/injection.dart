import 'package:get_it/get_it.dart';

import '../../features/age_verification/injection.dart'
    as age_verification_di;

// Global service locator instance.
// Access anywhere in the app via sl<T>().
final GetIt sl = GetIt.instance;

/// Initialise all dependencies before [runApp] is called.
///
/// Execution order:
///   1. Core services (network, storage, …)
///   2. Feature modules
Future<void> setupDependencies() async {
  // ── Core ──────────────────────────────────────────────────────────────────
  // ApiClient is registered per-feature to allow different base URLs.
  // Add shared core services here as needed (e.g. local storage, auth).

  // ── Features ──────────────────────────────────────────────────────────────
  age_verification_di.registerAgeVerificationFeature(sl);
}
