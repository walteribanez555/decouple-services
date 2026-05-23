import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Large circular shutter button.
///
/// Shows a [CircularProgressIndicator] while [loading] is true so the user
/// knows a capture is in progress.
class CaptureButton extends StatelessWidget {
  const CaptureButton({
    super.key,
    required this.onPressed,
    this.loading = false,
    this.size = 76,
  });

  final VoidCallback? onPressed;
  final bool loading;
  final double size;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: loading ? null : onPressed,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white,
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.9),
            width: 4,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.white.withValues(alpha: 0.25),
              blurRadius: 12,
              spreadRadius: 2,
            ),
          ],
        ),
        child: loading
            ? Padding(
                padding: const EdgeInsets.all(20),
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: AppColors.ink,
                ),
              )
            : null,
      ),
    );
  }
}
