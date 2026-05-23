import 'exceptions.dart';
import 'failures.dart';

/// Maps raw [Exception]s thrown by data sources to domain [Failure]s.
///
/// Call inside repository implementations:
///   } on ServerException catch (e) {
///     return Left(ErrorMapper.fromException(e));
///   }
abstract final class ErrorMapper {
  static Failure fromException(Exception e) {
    return switch (e) {
      ServerException()  => ServerFailure(message: e.message, statusCode: e.statusCode),
      CacheException()   => CacheFailure(message: e.message),
      NetworkException() => NetworkFailure(message: e.message),
      _                  => UnknownFailure(message: e.toString()),
    };
  }
}
