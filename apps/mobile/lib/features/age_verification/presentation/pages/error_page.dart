import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile/core/theme/app_colors.dart';

import '../cubit/age_verification_cubit.dart';
import '../widgets/av_button.dart';

class ErrorPage extends StatelessWidget {
  const ErrorPage({
    super.key,
    required this.message,
    required this.imagePath,
    required this.mimeType,
    this.code,
  });

  final String message;
  final String? code;
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
              const SizedBox(height: 20),

              const Spacer(),

              // ── Icon ───────────────────────────────────────────────────
              Container(
                width: 80,
                height: 80,
                decoration: const BoxDecoration(
                  color: AppColors.errorSoft,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.wifi_off_rounded,
                    color: AppColors.error, size: 36),
              ),

              const SizedBox(height: 24),

              const Text(
                'Something went wrong',
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.9,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                message,
                style: const TextStyle(
                  fontSize: 15.5,
                  height: 1.4,
                  color: AppColors.muted,
                ),
              ),

              if (code != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.fill,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Code: $code',
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: AppColors.muted,
                      fontFamily: 'monospace',
                    ),
                  ),
                ),
              ],

              const Spacer(),

              AvButton(
                label: 'Try again',
                onPressed: () =>
                    cubit.retry(imagePath: imagePath, mimeType: mimeType),
              ),
              const SizedBox(height: 10),
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
}
