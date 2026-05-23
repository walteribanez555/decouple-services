import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile/core/theme/app_colors.dart';

import '../cubit/age_verification_cubit.dart';
import '../widgets/av_button.dart';
import '../widgets/bullet_row.dart';

class IntroPage extends StatelessWidget {
  const IntroPage({super.key});

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
              // ── Step label + cancel ────────────────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'STEP 1 OF 3',
                    style: TextStyle(
                      fontSize: 13,
                      letterSpacing: 1.5,
                      color: AppColors.muted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  TextButton(
                    onPressed: cubit.cancel,
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.muted,
                      padding: EdgeInsets.zero,
                    ),
                    child: const Text('Cancel',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
                  ),
                ],
              ),

              const Spacer(),

              // ── Hero icon ──────────────────────────────────────────────
              Container(
                width: 92,
                height: 92,
                decoration: BoxDecoration(
                  color: AppColors.ink,
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x2E14141A),
                      blurRadius: 32,
                      offset: Offset(0, 12),
                    ),
                  ],
                ),
                child: const Icon(Icons.shield_outlined,
                    color: Colors.white, size: 36),
              ),

              const SizedBox(height: 32),

              // ── Title ──────────────────────────────────────────────────
              const Text(
                "Confirm you're\nover 18.",
                style: TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -1.2,
                  height: 1.05,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                "We'll need a quick photo of a government-issued ID. "
                "It's encrypted, used once, then deleted.",
                style: TextStyle(
                  fontSize: 16.5,
                  height: 1.45,
                  color: AppColors.ink2,
                ),
              ),

              const SizedBox(height: 24),

              // ── Bullets ────────────────────────────────────────────────
              BulletRow(
                icon: const Icon(Icons.lock_outline,
                    size: 18, color: AppColors.ink),
                text: 'End-to-end encrypted upload',
              ),
              const SizedBox(height: 14),
              BulletRow(
                icon: const Icon(Icons.visibility_outlined,
                    size: 18, color: AppColors.ink),
                text: 'Reviewed by AI, not stored',
              ),
              const SizedBox(height: 14),
              BulletRow(
                icon: const Icon(Icons.bolt_outlined,
                    size: 18, color: AppColors.ink),
                text: 'Takes about 30 seconds',
              ),

              const Spacer(),

              // ── CTA ────────────────────────────────────────────────────
              AvButton(
                label: 'Get started',
                onPressed: cubit.start,
              ),
              const SizedBox(height: 12),
              const Center(
                child: Text(
                  'By continuing you agree to our Terms and Privacy Policy.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12.5, color: AppColors.muted, height: 1.45),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
