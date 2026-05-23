import 'package:fpdart/fpdart.dart';
import 'package:mobile/core/errors/failures.dart';

import '../entities/verification_result.dart';
import '../repositories/age_verification_repository.dart';

class VerifyAgeUseCase {
  const VerifyAgeUseCase(this._repository);

  final AgeVerificationRepository _repository;

  Future<Either<Failure, VerificationResult>> call(String sessionId) =>
      _repository.verify(sessionId);
}
