import 'rejected_reason.dart';
import 'verification_details.dart';

class VerificationResult {
  const VerificationResult({
    required this.sessionId,
    required this.approved,
    required this.details,
    required this.rejectedReasons,
  });

  final String sessionId;
  final bool approved;
  final VerificationDetails details;
  final List<RejectedReason> rejectedReasons;
}
