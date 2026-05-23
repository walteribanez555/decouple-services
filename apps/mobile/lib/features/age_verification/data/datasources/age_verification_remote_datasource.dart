import 'dart:io';

import 'package:dio/dio.dart';
import 'package:mobile/core/errors/exceptions.dart';
import 'package:mobile/core/network/api_client.dart';

import '../models/presign_response_model.dart';
import '../models/verification_result_model.dart';

abstract class AgeVerificationRemoteDatasource {
  Future<PresignResponseModel> presign(String mimeType);

  Future<void> uploadToS3({
    required String uploadUrl,
    required String filePath,
    required String mimeType,
    void Function(int sent, int total)? onProgress,
  });

  Future<VerificationResultModel> verify(String sessionId);
}

class AgeVerificationRemoteDatasourceImpl
    implements AgeVerificationRemoteDatasource {
  const AgeVerificationRemoteDatasourceImpl(this._client);

  final ApiClient _client;

  // ── Step 1: presign ───────────────────────────────────────────────────────

  @override
  Future<PresignResponseModel> presign(String mimeType) async {
    try {
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/api/v1/identification/presign',
        data: {'mimeType': mimeType},
      );
      final data = response.data!['data'] as Map<String, dynamic>;
      return PresignResponseModel.fromJson(data);
    } on DioException catch (e) {
      throw ServerException(
        message: e.message,
        statusCode: e.response?.statusCode,
      );
    }
  }

  // ── Step 2: upload directly to S3 (no API base URL) ──────────────────────

  @override
  Future<void> uploadToS3({
    required String uploadUrl,
    required String filePath,
    required String mimeType,
    void Function(int sent, int total)? onProgress,
  }) async {
    final file = File(filePath);
    final fileLength = await file.length();

    try {
      // Use a fresh Dio without the API base URL — S3 needs the full presigned URL.
      await Dio().put<void>(
        uploadUrl,
        data: file.openRead(),
        options: Options(
          headers: {
            'Content-Type': mimeType,
            'Content-Length': fileLength,
          },
          // S3 presigned PUT returns 200 OK with an empty body.
          validateStatus: (status) => status != null && status < 400,
        ),
        onSendProgress: onProgress,
      );
    } on DioException catch (e) {
      throw ServerException(
        message: 'S3 upload failed: ${e.message}',
        statusCode: e.response?.statusCode,
      );
    }
  }

  // ── Step 3: verify ────────────────────────────────────────────────────────

  @override
  Future<VerificationResultModel> verify(String sessionId) async {
    try {
      // 200 = approved, 422 = rejected — both are valid structured responses.
      final response = await _client.dio.post<Map<String, dynamic>>(
        '/api/v1/identification/verify',
        data: {'sessionId': sessionId},
        options: Options(
          validateStatus: (status) => status == 200 || status == 422,
        ),
      );
      final data = response.data!['data'] as Map<String, dynamic>;
      return VerificationResultModel.fromJson(data);
    } on DioException catch (e) {
      throw ServerException(
        message: e.message,
        statusCode: e.response?.statusCode,
      );
    }
  }
}
