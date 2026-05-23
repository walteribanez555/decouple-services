import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile/core/theme/app_colors.dart';

import '../../domain/entities/verification_result.dart';
import '../cubit/age_verification_cubit.dart';
import '../widgets/av_button.dart';
import '../widgets/av_pill.dart';
import '../widgets/receipt_row.dart';

class ApprovedPage extends StatelessWidget {
  const ApprovedPage({super.key, required this.result});

  final VerificationResult result;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AgeVerificationCubit>();
    final d = result.details;
    final confidencePct = '${(d.confidence * 100).round()}%';

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),

              // ── Header ─────────────────────────────────────────────────
              Row(
                children: [
                  const AvPill(label: 'Verified', tone: AvPillTone.success),
                ],
              ),

              const Spacer(),

              // ── Check icon ─────────────────────────────────────────────
              Container(
                width: 80,
                height: 80,
                decoration: const BoxDecoration(
                  color: AppColors.successSoft,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_rounded,
                    color: AppColors.success, size: 40),
              ),

              const SizedBox(height: 24),

              const Text(
                "You're verified!",
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -1,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "Your age has been confirmed. You're all set.",
                style: TextStyle(
                  fontSize: 15.5,
                  height: 1.4,
                  color: AppColors.muted,
                ),
              ),

              const SizedBox(height: 28),

              // ── Receipt card ───────────────────────────────────────────
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.hairline),
                ),
                child: Column(
                  children: [
                    ReceiptRow(
                      label: 'Result',
                      value: d.isAdult ? 'Adult (18+)' : 'Minor',
                    ),
                    const Divider(
                        height: 18, thickness: 1, color: AppColors.hairline),
                    ReceiptRow(
                      label: 'Date of birth',
                      value: d.dob.isNotEmpty ? d.dob : '—',
                    ),
                    const Divider(
                        height: 18, thickness: 1, color: AppColors.hairline),
                    ReceiptRow(
                      label: 'Confidence',
                      value: confidencePct,
                    ),
                    const Divider(
                        height: 18, thickness: 1, color: AppColors.hairline),
                    ReceiptRow(
                      label: 'Session',
                      value: result.sessionId.length > 8
                          ? '…${result.sessionId.substring(result.sessionId.length - 8)}'
                          : result.sessionId,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // ── Deletion notice ────────────────────────────────────────
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.fill,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.delete_outline,
                        size: 18, color: AppColors.ink2),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Your document image has been deleted from our servers.',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.ink2,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(),

              AvButton(
                label: 'Continue',
                onPressed: cubit.cancel,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
