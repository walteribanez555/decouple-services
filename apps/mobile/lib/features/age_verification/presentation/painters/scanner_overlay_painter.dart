import 'package:flutter/material.dart';

/// Draws a dark semi-transparent overlay with a rounded rectangular cutout
/// centred on the canvas — the "viewfinder" the user aligns the document to.
///
/// The cutout dimensions are: width = 88% of canvas, height = 56% of canvas,
/// matching a standard ID-card aspect-ratio (approximately 1.586 : 1).
class ScannerOverlayPainter extends CustomPainter {
  const ScannerOverlayPainter({
    this.borderColor = const Color(0xFF5B47E8),
    this.overlayOpacity = 0.75,
    this.borderWidth = 3.0,
    this.cornerRadius = 20.0,
  });

  final Color borderColor;
  final double overlayOpacity;
  final double borderWidth;
  final double cornerRadius;

  @override
  void paint(Canvas canvas, Size size) {
    // ── Dark overlay ────────────────────────────────────────────────────────
    final overlayPaint = Paint()
      ..color = Colors.black.withValues(alpha: overlayOpacity);

    final cutout = _cutoutRect(size);

    // Difference: full-screen rect minus the rounded cutout.
    final overlayPath = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height));
    final cutoutPath = Path()
      ..addRRect(RRect.fromRectAndRadius(cutout, Radius.circular(cornerRadius)));

    canvas.drawPath(
      Path.combine(PathOperation.difference, overlayPath, cutoutPath),
      overlayPaint,
    );

    // ── Frame border ────────────────────────────────────────────────────────
    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    canvas.drawRRect(
      RRect.fromRectAndRadius(cutout, Radius.circular(cornerRadius)),
      borderPaint,
    );
  }

  Rect _cutoutRect(Size size) => Rect.fromCenter(
        center: Offset(size.width / 2, size.height * 0.45),
        width: size.width * 0.88,
        height: size.width * 0.56,
      );

  @override
  bool shouldRepaint(ScannerOverlayPainter old) =>
      old.borderColor != borderColor ||
      old.overlayOpacity != overlayOpacity ||
      old.borderWidth != borderWidth ||
      old.cornerRadius != cornerRadius;
}
