enum ImageQuality { good, acceptable, poor }

class VerificationDetails {
  const VerificationDetails({
    required this.isAdult,
    required this.appearsAuthentic,
    required this.imageQuality,
    required this.confidence,
    required this.dob,
  });

  final bool isAdult;
  final bool appearsAuthentic;
  final ImageQuality imageQuality;

  /// Model confidence 0.0–1.0.
  final double confidence;

  /// Date of birth extracted from the document (YYYY-MM-DD).
  final String dob;
}
