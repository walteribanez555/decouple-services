import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile/core/theme/app_colors.dart';

import '../../domain/entities/doc_type.dart';
import '../cubit/age_verification_cubit.dart';
import '../widgets/av_button.dart';

class DocTypePage extends StatelessWidget {
  const DocTypePage({super.key, required this.selectedDoc});

  final DocType selectedDoc;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AgeVerificationCubit>();

    final docs = [
      (DocType.passport, Icons.book_outlined),
      (DocType.license, Icons.credit_card_outlined),
      (DocType.nationalId, Icons.badge_outlined),
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

              // ── Nav top ────────────────────────────────────────────────
              Row(
                children: [
                  _BackButton(onPressed: cubit.backToIntro),
                  const Spacer(),
                  const Text(
                    'STEP 2 OF 3',
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
                'Pick your document',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.8,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "Choose one. We'll guide you through the photo.",
                style: TextStyle(
                  fontSize: 15,
                  height: 1.4,
                  color: AppColors.muted,
                ),
              ),
              const SizedBox(height: 22),

              // ── Document options ───────────────────────────────────────
              ...docs.map((entry) {
                final (type, icon) = entry;
                final isSelected = selectedDoc == type;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: GestureDetector(
                    onTap: () => cubit.selectDoc(type),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: isSelected
                              ? AppColors.ink
                              : AppColors.hairline,
                          width: 1.5,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppColors.fill,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(icon,
                                color: AppColors.ink, size: 24),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(type.label,
                                    style: const TextStyle(
                                      fontSize: 16.5,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.ink,
                                    )),
                                const SizedBox(height: 2),
                                Text(type.hint,
                                    style: const TextStyle(
                                      fontSize: 13.5,
                                      color: AppColors.muted,
                                    )),
                              ],
                            ),
                          ),
                          _Radio(active: isSelected),
                        ],
                      ),
                    ),
                  ),
                );
              }),

              const Spacer(),

              // ── Info note ──────────────────────────────────────────────
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.fill,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.lock_outline, size: 18, color: AppColors.ink2),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Accepted formats: JPEG, PNG, WebP — up to 5 MB.',
                        style: TextStyle(
                          fontSize: 13.5,
                          color: AppColors.ink2,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              AvButton(
                label: 'Continue',
                onPressed: () => cubit.proceed(selectedDoc),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _BackButton extends StatelessWidget {
  const _BackButton({required this.onPressed});
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onPressed,
        child: Container(
          width: 36,
          height: 36,
          decoration: const BoxDecoration(shape: BoxShape.circle),
          child: const Icon(Icons.chevron_left,
              color: AppColors.ink, size: 24),
        ),
      );
}

class _Radio extends StatelessWidget {
  const _Radio({required this.active});
  final bool active;

  @override
  Widget build(BuildContext context) => Container(
        width: 22,
        height: 22,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: active ? AppColors.ink : Colors.transparent,
          border: Border.all(
            color: active ? AppColors.ink : AppColors.hairline,
            width: 1.5,
          ),
        ),
        child: active
            ? const Center(
                child: CircleAvatar(
                  radius: 4,
                  backgroundColor: Colors.white,
                ),
              )
            : null,
      );
}
