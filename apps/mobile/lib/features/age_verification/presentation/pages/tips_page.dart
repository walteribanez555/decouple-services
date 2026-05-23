import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile/core/theme/app_colors.dart';

import '../../domain/entities/doc_type.dart';
import '../cubit/age_verification_cubit.dart';
import '../widgets/av_button.dart';


class TipsPage extends StatelessWidget {
  const TipsPage({super.key, required this.docType});

  final DocType docType;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AgeVerificationCubit>();

    final tips = [
      (true,  'Flat on a dark surface'),
      (true,  'All four corners visible'),
      (true,  'Sharp focus, even lighting'),
      (false, 'No glare or shadow'),
      (false, 'No screenshots or copies'),
    ];

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),

              // ── Nav ────────────────────────────────────────────────────
              Row(
                children: [
                  GestureDetector(
                    onTap: () => cubit.selectDoc(docType),
                    child: const SizedBox(
                      width: 36,
                      height: 36,
                      child: Icon(Icons.chevron_left,
                          color: AppColors.ink, size: 24),
                    ),
                  ),
                  const Spacer(),
                  const Text(
                    'STEP 3 OF 3',
                    style: TextStyle(
                      fontSize: 13,
                      letterSpacing: 1.5,
                      color: AppColors.muted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  const SizedBox(width: 36),
                ],
              ),

              const SizedBox(height: 16),
              const Text(
                'Take a clear photo',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.8,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Position the front of your ID inside the frame.',
                style: TextStyle(
                  fontSize: 15,
                  height: 1.4,
                  color: AppColors.muted,
                ),
              ),
              const SizedBox(height: 18),

              // ── ID card illustration ───────────────────────────────────
              Container(
                height: 200,
                decoration: BoxDecoration(
                  color: AppColors.ink,
                  borderRadius: BorderRadius.circular(22),
                ),
                child: Stack(
                  children: [
                    // Gradient overlay
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(22),
                          gradient: RadialGradient(
                            center: const Alignment(0.5, -0.5),
                            radius: 1,
                            colors: [
                              AppColors.accent.withValues(alpha: 0.2),
                              Colors.transparent,
                            ],
                          ),
                        ),
                      ),
                    ),
                    // Mock ID card
                    Center(
                      child: Transform.rotate(
                        angle: -0.052,
                        child: Container(
                          width: 220,
                          height: 138,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFAF8F2),
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x66000000),
                                blurRadius: 40,
                                offset: Offset(0, 18),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 56,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFD9D3C2),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    ...[0.7, 0.9, 0.6, 0.8].map((w) => Padding(
                                          padding: const EdgeInsets.only(bottom: 4),
                                          child: FractionallySizedBox(
                                            widthFactor: w,
                                            child: Container(
                                              height: 5,
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFAAAAAA),
                                                borderRadius: BorderRadius.circular(3),
                                              ),
                                            ),
                                          ),
                                        )),
                                    const Spacer(),
                                    FractionallySizedBox(
                                      widthFactor: 0.4,
                                      child: Container(
                                        height: 5,
                                        decoration: BoxDecoration(
                                          color: AppColors.accent,
                                          borderRadius: BorderRadius.circular(3),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 22),

              // ── Tips list ──────────────────────────────────────────────
              ...tips.map((entry) {
                final (ok, text) = entry;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: ok ? AppColors.successSoft : AppColors.errorSoft,
                        ),
                        child: Icon(
                          ok ? Icons.check : Icons.close,
                          size: 14,
                          color: ok ? AppColors.success : AppColors.error,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        text,
                        style: const TextStyle(
                          fontSize: 15.5,
                          color: AppColors.ink2,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                );
              }),

              const Spacer(),

              AvButton(
                label: "I'm ready",
                onPressed: () => cubit.goToCapture(docType),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
