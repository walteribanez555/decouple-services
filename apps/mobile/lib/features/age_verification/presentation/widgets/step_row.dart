import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';

enum StepStatus { done, active, pending }

class StepRow extends StatelessWidget {
  const StepRow({
    super.key,
    required this.label,
    required this.status,
  });

  final String label;
  final StepStatus status;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _dot(),
        const SizedBox(width: 12),
        Text(
          label,
          style: TextStyle(
            fontSize: 15.5,
            fontWeight: FontWeight.w500,
            color: status == StepStatus.pending ? AppColors.faint : AppColors.ink,
          ),
        ),
      ],
    );
  }

  Widget _dot() {
    return switch (status) {
      StepStatus.done => Container(
          width: 22,
          height: 22,
          decoration: const BoxDecoration(
            color: AppColors.ink,
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.check, size: 13, color: Colors.white),
        ),
      StepStatus.active => SizedBox(
          width: 22,
          height: 22,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: AppColors.ink,
            backgroundColor: AppColors.hairline,
          ),
        ),
      StepStatus.pending => Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.hairline, width: 2),
          ),
        ),
    };
  }
}
