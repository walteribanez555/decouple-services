import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fpdart/fpdart.dart';

import '../../domain/entities/doc_type.dart';
import '../../domain/usecases/presign_usecase.dart';
import '../../domain/usecases/upload_to_s3_usecase.dart';
import '../../domain/usecases/verify_age_usecase.dart';
import 'age_verification_state.dart';

class AgeVerificationCubit extends Cubit<AgeVerificationState> {
  AgeVerificationCubit({
    required this.presignUseCase,
    required this.uploadToS3UseCase,
    required this.verifyAgeUseCase,
  }) : super(const AvInitialState());

  final PresignUseCase presignUseCase;
  final UploadToS3UseCase uploadToS3UseCase;
  final VerifyAgeUseCase verifyAgeUseCase;

  // ── Navigation ─────────────────────────────────────────────────────────────

  void start() => emit(const AvDocTypeState());

  void selectDoc(DocType doc) => emit(AvDocTypeState(selectedDoc: doc));

  void proceed(DocType docType) => emit(AvTipsState(docType: docType));

  void goToCapture(DocType docType) =>
      emit(AvCaptureState(docType: docType));

  void onCapture({
    required DocType docType,
    required String imagePath,
    required String mimeType,
  }) =>
      emit(AvReviewState(
          docType: docType, imagePath: imagePath, mimeType: mimeType));

  void retake(DocType docType) => emit(AvCaptureState(docType: docType));

  void backToIntro() => emit(const AvInitialState());

  void cancel() => emit(const AvInitialState());

  // ── Full verification flow ─────────────────────────────────────────────────

  /// Orchestrates: presign → S3 upload → verify.
  Future<void> submit({
    required String imagePath,
    required String mimeType,
  }) async {
    // ── Step 1: presign ───────────────────────────────────────────────────
    emit(AvUploadingState(
      progress: 0,
      stage: 'presign',
      imagePath: imagePath,
      mimeType: mimeType,
    ));

    final presignEither = await presignUseCase(mimeType);

    switch (presignEither) {
      case Left(:final value):
        if (!isClosed) {
          emit(AvErrorState(
            message: value.message ?? 'Could not start upload.',
            imagePath: imagePath,
            mimeType: mimeType,
          ));
        }
        return;
      case Right(:final value):
        final sessionId = value.sessionId;
        final uploadUrl = value.uploadUrl;

        // ── Step 2: S3 upload ─────────────────────────────────────────────
        emit(AvUploadingState(
          progress: 0,
          stage: 'upload',
          imagePath: imagePath,
          mimeType: mimeType,
        ));

        final uploadEither = await uploadToS3UseCase(
          uploadUrl: uploadUrl,
          filePath: imagePath,
          mimeType: mimeType,
          onProgress: (sent, total) {
            if (!isClosed && total > 0) {
              emit(AvUploadingState(
                progress: sent / total,
                stage: 'upload',
                imagePath: imagePath,
                mimeType: mimeType,
              ));
            }
          },
        );

        switch (uploadEither) {
          case Left(:final value):
            if (!isClosed) {
              emit(AvErrorState(
                message: value.message ?? 'Upload failed.',
                imagePath: imagePath,
                mimeType: mimeType,
              ));
            }
            return;
          case Right():
            break;
        }

        // ── Step 3: verify ────────────────────────────────────────────────
        if (!isClosed) {
          emit(AvUploadingState(
            progress: 1,
            stage: 'done',
            imagePath: imagePath,
            mimeType: mimeType,
          ));
        }
        await Future<void>.delayed(const Duration(milliseconds: 450));
        if (!isClosed) emit(const AvVerifyingState());

        final verifyEither = await verifyAgeUseCase(sessionId);

        switch (verifyEither) {
          case Left(:final value):
            if (!isClosed) {
              emit(AvErrorState(
                message: value.message ?? 'Verification failed.',
                imagePath: imagePath,
                mimeType: mimeType,
              ));
            }
          case Right(:final value):
            if (!isClosed) {
              if (value.approved) {
                emit(AvApprovedState(result: value));
              } else {
                emit(AvRejectedState(result: value));
              }
            }
        }
    }
  }

  /// Retry the full upload + verify flow with the same image.
  Future<void> retry({required String imagePath, required String mimeType}) =>
      submit(imagePath: imagePath, mimeType: mimeType);
}
