/// Domain-level failure types.
///
/// Use cases return [Either<Failure, T>] — the left side is always a [Failure].
/// The presentation layer maps failures to user-facing messages.
sealed class Failure {
  const Failure({this.message});
  final String? message;
}

class ServerFailure extends Failure {
  const ServerFailure({super.message, this.statusCode});
  final int? statusCode;
}

class CacheFailure extends Failure {
  const CacheFailure({super.message});
}

class NetworkFailure extends Failure {
  const NetworkFailure({super.message});
}

class UnknownFailure extends Failure {
  const UnknownFailure({super.message});
}
