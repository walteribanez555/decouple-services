import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';

enum AvButtonVariant { primary, ghost, soft, danger }

class AvButton extends StatelessWidget {
  const AvButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = AvButtonVariant.primary,
    this.leading,
    this.disabled = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final AvButtonVariant variant;
  final Widget? leading;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, border) = switch (variant) {
      AvButtonVariant.primary => (AppColors.ink, Colors.white, null),
      AvButtonVariant.ghost   => (Colors.transparent, AppColors.ink, AppColors.hairline),
      AvButtonVariant.soft    => (AppColors.fill, AppColors.ink, null),
      AvButtonVariant.danger  => (AppColors.error, Colors.white, null),
    };

    return SizedBox(
      width: double.infinity,
      height: 56,
      child: Material(
        color: disabled ? bg.withValues(alpha: 0.4) : bg,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: disabled ? null : onPressed,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: border != null ? Border.all(color: border, width: 1.5) : null,
            ),
            alignment: Alignment.center,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (leading != null) ...[leading!, const SizedBox(width: 8)],
                Text(
                  label,
                  style: TextStyle(
                    color: disabled ? fg.withValues(alpha: 0.4) : fg,
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
