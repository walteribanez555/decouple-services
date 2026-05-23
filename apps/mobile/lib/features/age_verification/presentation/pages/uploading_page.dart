import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';

import '../widgets/step_row.dart';

class UploadingPage extends StatelessWidget {
  const UploadingPage({
    super.key,
    required this.progress,
    required this.stage,
  });

  /// 0.0–1.0
  final double progress;

  /// 'presign' | 'upload' | 'done'
  final String stage;

  @override
  Widget build(BuildContext context) {
    final steps = [
      (label: 'Preparing secure upload', stage: 'presign'),
      (label: 'Uploading document',      stage: 'upload'),
      (label: 'Finalising',              stage: 'done'),
    ];

    final currentIndex = switch (stage) {
      'presign' => 0,
      'upload'  => 1,
      _         => 2,
    };

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),

              // ── Step label ─────────────────────────────────────────────
              const Row(
                children: [
                  Spacer(),
                  Text(
                    'STEP 3 OF 3',
                    style: TextStyle(
                      fontSize: 13,
                      letterSpacing: 1.5,
                      color: AppColors.muted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Spacer(),
                ],
              ),

              const Spacer(),

              // ── Icon ───────────────────────────────────────────────────
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.fill,
                  borderRadius: BorderRadius.circular(22),
                ),
                child: const Icon(Icons.cloud_upload_outlined,
                    color: AppColors.ink, size: 32),
              ),

              const SizedBox(height: 24),

              const Text(
                'Uploading your ID',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.8,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "Stay on this screen — this only takes a moment.",
                style: TextStyle(
                  fontSize: 15,
                  height: 1.4,
                  color: AppColors.muted,
                ),
              ),

              const SizedBox(height: 32),

              // ── Progress bar ───────────────────────────────────────────
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 6,
                  backgroundColor: AppColors.fillStrong,
                  valueColor: const AlwaysStoppedAnimation(AppColors.ink),
                ),
              ),

              const SizedBox(height: 8),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${(progress * 100).round()}%',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.muted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    stage == 'presign'
                        ? 'Preparing…'
                        : stage == 'upload'
                            ? 'Uploading…'
                            : 'Done',
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.muted),
                  ),
                ],
              ),

              const SizedBox(height: 32),

              // ── Steps checklist ────────────────────────────────────────
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.hairline),
                ),
                child: Column(
                  children: steps.asMap().entries.map((entry) {
                    final i = entry.key;
                    final step = entry.value;
                    final status = i < currentIndex
                        ? StepStatus.done
                        : i == currentIndex
                            ? StepStatus.active
                            : StepStatus.pending;
                    return Padding(
                      padding: EdgeInsets.only(
                          bottom: i < steps.length - 1 ? 14 : 0),
                      child: StepRow(label: step.label, status: status),
                    );
                  }).toList(),
                ),
              ),

              const Spacer(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
