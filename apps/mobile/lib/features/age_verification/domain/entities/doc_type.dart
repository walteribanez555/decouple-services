enum DocType {
  passport,
  license,
  nationalId;

  String get label => switch (this) {
        DocType.passport  => 'Passport',
        DocType.license   => "Driver's license",
        DocType.nationalId => 'National ID card',
      };

  String get hint => switch (this) {
        DocType.passport  => 'Photo page',
        DocType.license   => 'Front side',
        DocType.nationalId => 'Front side',
      };
}
