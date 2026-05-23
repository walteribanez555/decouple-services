import '../../domain/entities/doc_type.dart';
import '../../domain/entities/verification_result.dart';

sealed class AgeVerificationState {
  const AgeVerificationState();
}

// ── Navigation states ─────────────────────────────────────────────────────────

final class AvInitialState extends AgeVerificationState {
  const AvInitialState();
}

final class AvDocTypeState extends AgeVerificationState {
  const AvDocTypeState({this.selectedDoc = DocType.license});
  final DocType selectedDoc;
}

final class AvTipsState extends AgeVerificationState {
  const AvTipsState({required this.docType});
  final DocType docType;
}

final class AvCaptureState extends AgeVerificationState {
  const AvCaptureState({required this.docType});
  final DocType docType;
}

final class AvReviewState extends AgeVerificationState {
  const AvReviewState({
    required this.docType,
    required this.imagePath,
    required this.mimeType,
  });
  final DocType docType;
  final String imagePath;
  final String mimeType;
}

// ── Async states ──────────────────────────────────────────────────────────────

final class AvUploadingState extends AgeVerificationState {
  const AvUploadingState({
    required this.progress,
    required this.stage,
    required this.imagePath,
    required this.mimeType,
  });

  /// 0.0–1.0 upload progress.
  final double progress;

  /// 'presign' | 'upload' | 'done'
  final String stage;
  final String imagePath;
  final String mimeType;
}

final class AvVerifyingState extends AgeVerificationState {
  const AvVerifyingState();
}

// ── Result states ─────────────────────────────────────────────────────────────

final class AvApprovedState extends AgeVerificationState {
  const AvApprovedState({required this.result});
  final VerificationResult result;
}

final class AvRejectedState extends AgeVerificationState {
  const AvRejectedState({required this.result});
  final VerificationResult result;
}

final class AvErrorState extends AgeVerificationState {
  const AvErrorState({
    required this.message,
    required this.imagePath,
    required this.mimeType,
    this.code,
  });
  final String message;
  final String? code;
  // Stored so the user can retry without re-picking the image.
  final String imagePath;
  final String mimeType;
}
