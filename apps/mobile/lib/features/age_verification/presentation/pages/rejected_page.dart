import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile/core/theme/app_colors.dart';

import '../../domain/entities/rejected_reason.dart';
import '../../domain/entities/verification_details.dart';
import '../../domain/entities/verification_result.dart';
import '../cubit/age_verification_cubit.dart';
import '../widgets/av_button.dart';
import '../widgets/av_pill.dart';
import '../widgets/diag_row.dart';

class RejectedPage extends StatelessWidget {
  const RejectedPage({super.key, required this.result});

  final VerificationResult result;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AgeVerificationCubit>();
    final d = result.details;
    final reasons = result.rejectedReasons;

    final (headline, body) = _copy(reasons);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),

              // ── Status pill ────────────────────────────────────────────
              Row(
                children: [
                  AvPill(
                    label: _pillLabel(reasons),
                    tone: reasons.contains(RejectedReason.underage)
                        ? AvPillTone.error
                        : AvPillTone.warn,
                  ),
                ],
              ),

              const Spacer(),

              // ── Icon ───────────────────────────────────────────────────
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: reasons.contains(RejectedReason.underage)
                      ? AppColors.errorSoft
                      : AppColors.warnSoft,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  reasons.contains(RejectedReason.underage)
                      ? Icons.block_rounded
                      : Icons.warning_amber_rounded,
                  color: reasons.contains(RejectedReason.underage)
                      ? AppColors.error
                      : AppColors.warn,
                  size: 38,
                ),
              ),

              const SizedBox(height: 24),

              Text(
                headline,
                style: const TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.9,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                body,
                style: const TextStyle(
                  fontSize: 15.5,
                  height: 1.4,
                  color: AppColors.muted,
                ),
              ),

              const SizedBox(height: 28),

              // ── Diagnostics card ───────────────────────────────────────
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 18, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.hairline),
                ),
                child: Column(
                  children: [
                    DiagRow(
                      label: 'Age check',
                      value: d.isAdult ? 'Adult' : 'Under 18',
                      ok: d.isAdult,
                    ),
                    DiagRow(
                      label: 'Authentic',
                      value: d.appearsAuthentic ? 'Yes' : 'No',
                      ok: d.appearsAuthentic,
                    ),
                    DiagRow(
                      label: 'Image quality',
                      value: _qualityLabel(d.imageQuality),
                      ok: d.imageQuality != ImageQuality.poor,
                    ),
                    DiagRow(
                      label: 'Confidence',
                      value: '${(d.confidence * 100).round()}%',
                      ok: d.confidence >= 0.7,
                    ),
                  ],
                ),
              ),

              const Spacer(),

              // ── Actions ────────────────────────────────────────────────
              if (!reasons.contains(RejectedReason.underage)) ...[
                AvButton(
                  label: 'Try again',
                  onPressed: cubit.start,
                ),
                const SizedBox(height: 10),
              ],
              AvButton(
                label: 'Cancel',
                variant: AvButtonVariant.ghost,
                onPressed: cubit.cancel,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  (String, String) _copy(List<RejectedReason> reasons) {
    if (reasons.contains(RejectedReason.underage)) {
      return (
        'Age requirement not met',
        'You must be 18 or older to continue. '
            'This decision cannot be appealed.',
      );
    }
    if (reasons.contains(RejectedReason.documentNotAuthentic)) {
      return (
        'Document not accepted',
        'We could not verify your document as authentic. '
            'Please use an original, unedited government-issued ID.',
      );
    }
    if (reasons.contains(RejectedReason.poorImageQuality)) {
      return (
        'Photo unclear',
        "We couldn't read your document clearly. "
            'Try again in better lighting with the ID flat on a surface.',
      );
    }
    // lowConfidence fallback
    return (
      'Verification inconclusive',
      "We weren't confident enough to verify your ID. "
          'Please try again with a sharper photo.',
    );
  }

  String _pillLabel(List<RejectedReason> reasons) {
    if (reasons.contains(RejectedReason.underage)) return 'Underage';
    if (reasons.contains(RejectedReason.documentNotAuthentic)) {
      return 'Not authentic';
    }
    if (reasons.contains(RejectedReason.poorImageQuality)) {
      return 'Poor quality';
    }
    return 'Not verified';
  }

  String _qualityLabel(ImageQuality q) => switch (q) {
        ImageQuality.good       => 'Good',
        ImageQuality.acceptable => 'Acceptable',
        ImageQuality.poor       => 'Poor',
      };
}
