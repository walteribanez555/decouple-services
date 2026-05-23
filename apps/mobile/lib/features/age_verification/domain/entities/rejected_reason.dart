enum RejectedReason {
  notIdentityDocument,
  underage,
  documentNotAuthentic,
  lowConfidence,
  poorImageQuality;

  static RejectedReason? fromApi(String value) => switch (value) {
        'not_identity_document'  => RejectedReason.notIdentityDocument,
        'underage'               => RejectedReason.underage,
        'document_not_authentic' => RejectedReason.documentNotAuthentic,
        'low_confidence'         => RejectedReason.lowConfidence,
        'poor_image_quality'     => RejectedReason.poorImageQuality,
        _                        => null,
      };
}
