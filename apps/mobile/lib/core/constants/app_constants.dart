/// Shared compile-time constants.
///
/// Avoid magic values scattered across the codebase — declare them here.
abstract final class AppConstants {
  /// Default HTTP request timeout in milliseconds.
  static const int connectTimeoutMs = 10000;
  static const int receiveTimeoutMs = 15000;

  /// Pagination default page size.
  static const int defaultPageSize = 20;
}
