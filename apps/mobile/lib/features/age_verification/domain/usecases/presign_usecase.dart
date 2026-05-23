import 'package:fpdart/fpdart.dart';
import 'package:mobile/core/errors/failures.dart';

import '../entities/presign_response.dart';
import '../repositories/age_verification_repository.dart';

class PresignUseCase {
  const PresignUseCase(this._repository);

  final AgeVerificationRepository _repository;

  Future<Either<Failure, PresignResponse>> call(String mimeType) =>
      _repository.presign(mimeType);
}
