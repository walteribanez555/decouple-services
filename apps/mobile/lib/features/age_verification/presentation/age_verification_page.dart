import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';

import 'cubit/age_verification_cubit.dart';
import 'cubit/age_verification_state.dart';
import 'pages/approved_page.dart';
import 'pages/capture_page.dart';
import 'pages/doc_type_page.dart';
import 'pages/error_page.dart';
import 'pages/intro_page.dart';
import 'pages/rejected_page.dart';
import 'pages/review_page.dart';
import 'pages/tips_page.dart';
import 'pages/uploading_page.dart';
import 'pages/verifying_page.dart';

class AgeVerificationPage extends StatelessWidget {
  const AgeVerificationPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<AgeVerificationCubit>(
      create: (_) => GetIt.I<AgeVerificationCubit>(),
      child: const _AgeVerificationView(),
    );
  }
}

class _AgeVerificationView extends StatelessWidget {
  const _AgeVerificationView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AgeVerificationCubit, AgeVerificationState>(
      builder: (context, state) => switch (state) {
        AvInitialState()   => const IntroPage(),
        AvDocTypeState()   => DocTypePage(selectedDoc: state.selectedDoc),
        AvTipsState()      => TipsPage(docType: state.docType),
        AvCaptureState()   => CapturePage(docType: state.docType),
        AvReviewState()    => ReviewPage(
            docType:   state.docType,
            imagePath: state.imagePath,
            mimeType:  state.mimeType,
          ),
        AvUploadingState() => UploadingPage(
            progress: state.progress,
            stage:    state.stage,
          ),
        AvVerifyingState() => const VerifyingPage(),
        AvApprovedState()  => ApprovedPage(result: state.result),
        AvRejectedState()  => RejectedPage(result: state.result),
        AvErrorState()     => ErrorPage(
            message:   state.message,
            imagePath: state.imagePath,
            mimeType:  state.mimeType,
            code:      state.code,
          ),
      },
    );
  }
}
