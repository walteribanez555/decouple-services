// App-level configuration.
//
// Static constants for now; replace with flutter_dotenv for per-environment
// values (call AppConfig.load() before setupDependencies in main.dart).
abstract final class AppConfig {
  // ── Identification API ────────────────────────────────────────────────────
  // Base URL — no trailing slash.
  static const String identificationApiBaseUrl =
      'https://cm981m6ag1.execute-api.us-east-1.amazonaws.com';
}
