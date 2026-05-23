class PresignResponse {
  const PresignResponse({
    required this.sessionId,
    required this.uploadUrl,
    required this.expiresIn,
  });

  final String sessionId;
  final String uploadUrl;
  final int expiresIn;
}
