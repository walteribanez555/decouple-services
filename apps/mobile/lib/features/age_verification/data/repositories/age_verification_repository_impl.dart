import 'package:fpdart/fpdart.dart';
import 'package:mobile/core/errors/error_mapper.dart';
import 'package:mobile/core/errors/exceptions.dart';
import 'package:mobile/core/errors/failures.dart';

import '../../domain/entities/presign_response.dart';
import '../../domain/entities/verification_result.dart';
import '../../domain/repositories/age_verification_repository.dart';
import '../datasources/age_verification_remote_datasource.dart';

class AgeVerificationRepositoryImpl implements AgeVerificationRepository {
  const AgeVerificationRepositoryImpl(this._datasource);

  final AgeVerificationRemoteDatasource _datasource;

  @override
  Future<Either<Failure, PresignResponse>> presign(String mimeType) async {
    try {
      final model = await _datasource.presign(mimeType);
      return Right(model.toDomain());
    } on ServerException catch (e) {
      return Left(ErrorMapper.fromException(e));
    }
  }

  @override
  Future<Either<Failure, void>> uploadToS3({
    required String uploadUrl,
    required String filePath,
    required String mimeType,
    void Function(int sent, int total)? onProgress,
  }) async {
    try {
      await _datasource.uploadToS3(
        uploadUrl: uploadUrl,
        filePath: filePath,
        mimeType: mimeType,
        onProgress: onProgress,
      );
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ErrorMapper.fromException(e));
    }
  }

  @override
  Future<Either<Failure, VerificationResult>> verify(String sessionId) async {
    try {
      final model = await _datasource.verify(sessionId);
      return Right(model.toDomain());
    } on ServerException catch (e) {
      return Left(ErrorMapper.fromException(e));
    }
  }
}
