import 'package:get_it/get_it.dart';
import 'package:mobile/core/config/app_config.dart';
import 'package:mobile/core/network/api_client.dart';

import 'data/datasources/age_verification_remote_datasource.dart';
import 'data/repositories/age_verification_repository_impl.dart';
import 'domain/repositories/age_verification_repository.dart';
import 'domain/usecases/presign_usecase.dart';
import 'domain/usecases/upload_to_s3_usecase.dart';
import 'domain/usecases/verify_age_usecase.dart';
import 'presentation/cubit/age_verification_cubit.dart';

/// Registers all age-verification dependencies into [sl].
///
/// Call this from [setupDependencies] in
/// `lib/core/dependency_injection/injection.dart`.
void registerAgeVerificationFeature(GetIt sl) {
  // ── Network ──────────────────────────────────────────────────────────────
  // Only register ApiClient if not already registered (shared with other features).
  if (!sl.isRegistered<ApiClient>()) {
    sl.registerLazySingleton<ApiClient>(
      () => ApiClient(AppConfig.identificationApiBaseUrl),
    );
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  sl.registerLazySingleton<AgeVerificationRemoteDatasource>(
    () => AgeVerificationRemoteDatasourceImpl(sl<ApiClient>()),
  );

  sl.registerLazySingleton<AgeVerificationRepository>(
    () => AgeVerificationRepositoryImpl(
        sl<AgeVerificationRemoteDatasource>()),
  );

  // ── Domain ────────────────────────────────────────────────────────────────
  sl.registerLazySingleton(() => PresignUseCase(sl<AgeVerificationRepository>()));
  sl.registerLazySingleton(() => UploadToS3UseCase(sl<AgeVerificationRepository>()));
  sl.registerLazySingleton(() => VerifyAgeUseCase(sl<AgeVerificationRepository>()));

  // ── Presentation ──────────────────────────────────────────────────────────
  // Registered as a factory so each navigation entry gets a fresh cubit.
  sl.registerFactory(
    () => AgeVerificationCubit(
      presignUseCase:    sl<PresignUseCase>(),
      uploadToS3UseCase: sl<UploadToS3UseCase>(),
      verifyAgeUseCase:  sl<VerifyAgeUseCase>(),
    ),
  );
}
