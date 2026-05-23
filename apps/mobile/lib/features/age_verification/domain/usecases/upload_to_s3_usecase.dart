import 'package:fpdart/fpdart.dart';
import 'package:mobile/core/errors/failures.dart';

import '../repositories/age_verification_repository.dart';

class UploadToS3UseCase {
  const UploadToS3UseCase(this._repository);

  final AgeVerificationRepository _repository;

  Future<Either<Failure, void>> call({
    required String uploadUrl,
    required String filePath,
    required String mimeType,
    void Function(int sent, int total)? onProgress,
  }) =>
      _repository.uploadToS3(
        uploadUrl: uploadUrl,
        filePath: filePath,
        mimeType: mimeType,
        onProgress: onProgress,
      );
}
