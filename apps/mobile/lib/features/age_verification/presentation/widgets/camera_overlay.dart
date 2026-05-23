import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../painters/scanner_overlay_painter.dart';

/// Fills its parent with the semi-transparent overlay and the corner-accented
/// document frame.  Meant to be placed directly above the [CameraPreview] in
/// a [Stack].
class CameraOverlay extends StatelessWidget {
  const CameraOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: ScannerOverlayPainter(
        borderColor: AppColors.accent,
        overlayOpacity: 0.72,
        borderWidth: 2.5,
        cornerRadius: 18,
      ),
      child: const SizedBox.expand(),
    );
  }
}
