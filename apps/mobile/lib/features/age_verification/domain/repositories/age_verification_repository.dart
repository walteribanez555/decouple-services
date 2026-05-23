import 'package:fpdart/fpdart.dart';
import 'package:mobile/core/errors/failures.dart';

import '../entities/presign_response.dart';
import '../entities/verification_result.dart';

abstract class AgeVerificationRepository {
  Future<Either<Failure, PresignResponse>> presign(String mimeType);

  Future<Either<Failure, void>> uploadToS3({
    required String uploadUrl,
    required String filePath,
    required String mimeType,
    void Function(int sent, int total)? onProgress,
  });

  Future<Either<Failure, VerificationResult>> verify(String sessionId);
}
