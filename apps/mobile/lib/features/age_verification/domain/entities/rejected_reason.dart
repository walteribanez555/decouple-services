enum RejectedReason {
  underage,
  documentNotAuthentic,
  lowConfidence,
  poorImageQuality;

  static RejectedReason? fromApi(String value) => switch (value) {
        'underage'               => RejectedReason.underage,
        'document_not_authentic' => RejectedReason.documentNotAuthentic,
        'low_confidence'         => RejectedReason.lowConfidence,
        'poor_image_quality'     => RejectedReason.poorImageQuality,
        _                        => null,
      };
}
