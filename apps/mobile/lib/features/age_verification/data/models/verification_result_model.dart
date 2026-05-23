import '../../domain/entities/rejected_reason.dart';
import '../../domain/entities/verification_details.dart';
import '../../domain/entities/verification_result.dart';

class VerificationResultModel {
  const VerificationResultModel({
    required this.sessionId,
    required this.approved,
    required this.isAdult,
    required this.appearsAuthentic,
    required this.imageQuality,
    required this.confidence,
    required this.dob,
    required this.rejectedReasons,
  });

  factory VerificationResultModel.fromJson(Map<String, dynamic> json) {
    final details = json['details'] as Map<String, dynamic>;
    return VerificationResultModel(
      sessionId:        json['sessionId'] as String,
      approved:         json['approved'] as bool,
      isAdult:          details['isAdult'] as bool,
      appearsAuthentic: details['appearsAuthentic'] as bool,
      imageQuality:     details['imageQuality'] as String,
      confidence:       (details['confidence'] as num).toDouble(),
      dob:              details['dob'] as String,
      rejectedReasons:  (json['rejectedReasons'] as List<dynamic>)
          .map((e) => RejectedReason.fromApi(e as String))
          .whereType<RejectedReason>()
          .toList(),
    );
  }

  final String sessionId;
  final bool approved;
  final bool isAdult;
  final bool appearsAuthentic;
  final String imageQuality;
  final double confidence;
  final String dob;
  final List<RejectedReason> rejectedReasons;

  VerificationResult toDomain() => VerificationResult(
        sessionId: sessionId,
        approved: approved,
        details: VerificationDetails(
          isAdult: isAdult,
          appearsAuthentic: appearsAuthentic,
          imageQuality: _parseQuality(imageQuality),
          confidence: confidence,
          dob: dob,
        ),
        rejectedReasons: rejectedReasons,
      );

  static ImageQuality _parseQuality(String v) => switch (v) {
        'good'       => ImageQuality.good,
        'acceptable' => ImageQuality.acceptable,
        _            => ImageQuality.poor,
      };
}
