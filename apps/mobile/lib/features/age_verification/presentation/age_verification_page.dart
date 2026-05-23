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

// ── Assign an ordinal to each state so we can tell forward from backward ───────

int _stateOrdinal(AgeVerificationState state) => switch (state) {
      AvInitialState()   => 0,
      AvDocTypeState()   => 1,
      AvTipsState()      => 2,
      AvCaptureState()   => 3,
      AvReviewState()    => 4,
      AvUploadingState() => 5,
      AvVerifyingState() => 6,
      AvApprovedState()  => 7,
      AvRejectedState()  => 7,
      AvErrorState()     => 5,
    };

// ── Stateful so we can track direction between state transitions ───────────────

class _AgeVerificationView extends StatefulWidget {
  const _AgeVerificationView();

  @override
  State<_AgeVerificationView> createState() => _AgeVerificationViewState();
}

class _AgeVerificationViewState extends State<_AgeVerificationView> {
  /// Monotonically changing key fed to [AnimatedSwitcher] — incremented on
  /// every state-type change so the switcher always sees a new child.
  int _pageKey = 0;

  /// Whether the last transition was a forward step (true) or backward (false).
  bool _isForward = true;

  Type? _prevType;
  int? _lastOrdinal;

  // ── BlocConsumer listener ────────────────────────────────────────────────────

  void _onStateChange(BuildContext context, AgeVerificationState state) {
    if (state.runtimeType == _prevType) return;
    final newOrdinal = _stateOrdinal(state);
    setState(() {
      _isForward  = newOrdinal >= (_lastOrdinal ?? 0);
      _lastOrdinal = newOrdinal;
      _prevType    = state.runtimeType;
      _pageKey++;
    });
  }

  // ── Build ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AgeVerificationCubit, AgeVerificationState>(
      listener: _onStateChange,
      builder: (context, state) {
        return AnimatedSwitcher(
          duration: const Duration(milliseconds: 320),
          // Disable the default layout so the pages fill the entire screen.
          layoutBuilder: (currentChild, previousChildren) => Stack(
            fit: StackFit.expand,
            alignment: Alignment.center,
            children: [
              ...previousChildren,
              ?currentChild,
            ],
          ),
          transitionBuilder: (child, animation) {
            // Entering child  : slides in from right (forward) / left (back)
            //                   and fades in.
            // Exiting child   : AnimatedSwitcher reverses the animation, so it
            //                   slides out the same direction and fades out.
            // Using a tiny 3 % slide keeps the motion subtle and elegant.
            final dx = _isForward ? 0.035 : -0.035;
            return FadeTransition(
              opacity: CurvedAnimation(
                parent: animation,
                curve: Curves.easeOut,
                reverseCurve: Curves.easeIn,
              ),
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: Offset(dx, 0),
                  end: Offset.zero,
                ).animate(
                  CurvedAnimation(
                    parent: animation,
                    curve: Curves.easeOutCubic,
                    reverseCurve: Curves.easeInCubic,
                  ),
                ),
                child: child,
              ),
            );
          },
          child: KeyedSubtree(
            key: ValueKey(_pageKey),
            child: _buildPage(context, state),
          ),
        );
      },
    );
  }

  // ── Page factory ─────────────────────────────────────────────────────────────

  Widget _buildPage(BuildContext context, AgeVerificationState state) =>
      switch (state) {
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
      };
}
