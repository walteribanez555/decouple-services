import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile/core/theme/app_colors.dart';

import '../../domain/entities/doc_type.dart';
import '../cubit/age_verification_cubit.dart';
import '../widgets/av_button.dart';

class ReviewPage extends StatelessWidget {
  const ReviewPage({
    super.key,
    required this.docType,
    required this.imagePath,
    required this.mimeType,
  });

  final DocType docType;
  final String imagePath;
  final String mimeType;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AgeVerificationCubit>();

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
                    onTap: () => cubit.goToCapture(docType),
                    child: const SizedBox(
                      width: 36,
                      height: 36,
                      child: Icon(Icons.chevron_left, color: AppColors.ink),
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
                'Looks good?',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.8,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Make sure every line of text is readable.',
                style: TextStyle(
                  fontSize: 15,
                  height: 1.4,
                  color: AppColors.muted,
                ),
              ),
              const SizedBox(height: 18),

              // ── Photo preview ──────────────────────────────────────────
              ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: AspectRatio(
                  aspectRatio: 4 / 3,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.file(
                        File(imagePath),
                        fit: BoxFit.cover,
                      ),
                      Positioned(
                        top: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.successSoft,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.check,
                                  size: 14, color: AppColors.success),
                              SizedBox(width: 6),
                              Text(
                                'CAPTURED',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.success,
                                  letterSpacing: 0.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // ── Meta ───────────────────────────────────────────────────
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.hairline),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Format',
                            style: TextStyle(
                                fontSize: 13, color: AppColors.muted)),
                        Text(
                          mimeType
                              .replaceFirst('image/', '')
                              .toUpperCase(),
                          style: const TextStyle(
                            fontSize: 13.5,
                            color: AppColors.ink,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const Divider(
                        height: 20,
                        thickness: 1,
                        color: AppColors.hairline),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Document',
                            style: TextStyle(
                                fontSize: 13, color: AppColors.muted)),
                        Text(
                          'ID document',
                          style: TextStyle(
                            fontSize: 13.5,
                            color: AppColors.ink,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const Spacer(),

              AvButton(
                label: 'Use this photo',
                onPressed: () =>
                    cubit.submit(imagePath: imagePath, mimeType: mimeType),
              ),
              const SizedBox(height: 10),
              AvButton(
                label: 'Retake',
                variant: AvButtonVariant.ghost,
                onPressed: () => cubit.retake(docType),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
