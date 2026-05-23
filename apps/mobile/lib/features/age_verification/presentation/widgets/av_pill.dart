import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';

enum AvPillTone { neutral, success, error, warn, accent }

class AvPill extends StatelessWidget {
  const AvPill({super.key, required this.label, this.tone = AvPillTone.neutral});

  final String label;
  final AvPillTone tone;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (tone) {
      AvPillTone.neutral => (AppColors.fill, AppColors.ink2),
      AvPillTone.success => (AppColors.successSoft, AppColors.success),
      AvPillTone.error   => (AppColors.errorSoft, AppColors.error),
      AvPillTone.warn    => (AppColors.warnSoft, AppColors.warn),
      AvPillTone.accent  => (AppColors.accentSoft, AppColors.accent),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          color: fg,
          fontSize: 12.5,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.1,
        ),
      ),
    );
  }
}
