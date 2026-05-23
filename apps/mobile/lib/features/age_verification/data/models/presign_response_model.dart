import '../../domain/entities/presign_response.dart';

class PresignResponseModel {
  const PresignResponseModel({
    required this.sessionId,
    required this.uploadUrl,
    required this.expiresIn,
  });

  factory PresignResponseModel.fromJson(Map<String, dynamic> json) =>
      PresignResponseModel(
        sessionId: json['sessionId'] as String,
        uploadUrl: json['uploadUrl'] as String,
        expiresIn: json['expiresIn'] as int,
      );

  final String sessionId;
  final String uploadUrl;
  final int expiresIn;

  PresignResponse toDomain() => PresignResponse(
        sessionId: sessionId,
        uploadUrl: uploadUrl,
        expiresIn: expiresIn,
      );
}
