import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/core/theme/app_colors.dart';

import '../../domain/entities/doc_type.dart';
import '../cubit/age_verification_cubit.dart';

class CapturePage extends StatefulWidget {
  const CapturePage({super.key, required this.docType});

  final DocType docType;

  @override
  State<CapturePage> createState() => _CapturePageState();
}

class _CapturePageState extends State<CapturePage> {
  final _picker = ImagePicker();
  bool _picking = false;

  Future<void> _pick(ImageSource source) async {
    if (_picking) return;
    setState(() => _picking = true);

    try {
      final file = await _picker.pickImage(
        source: source,
        imageQuality: 90,
        preferredCameraDevice: CameraDevice.rear,
      );
      if (!mounted) return;
      if (file != null) {
        final mimeType = file.mimeType ?? 'image/jpeg';
        context.read<AgeVerificationCubit>().onCapture(
              docType: widget.docType,
              imagePath: file.path,
              mimeType: mimeType,
            );
      }
    } finally {
      if (mounted) setState(() => _picking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AgeVerificationCubit>();

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0D),
      body: Stack(
        children: [
          // ── Subtle texture ───────────────────────────────────────────
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(0, -0.3),
                  radius: 1.2,
                  colors: [Color(0xFF2A2A30), Color(0xFF0A0A0D)],
                ),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // ── Top bar ──────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 12, 18, 0),
                  child: Row(
                    children: [
                      _GlassButton(
                        icon: Icons.close,
                        onTap: () => cubit.proceed(widget.docType),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.4),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '${widget.docType.label} · ${widget.docType.hint}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const Spacer(),
                      const SizedBox(width: 40),
                    ],
                  ),
                ),

                const Spacer(),

                // ── Viewfinder frame ─────────────────────────────────
                Container(
                  width: 300,
                  height: 188,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                        color: AppColors.accent, width: 2.5),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.55),
                        blurRadius: 0,
                        spreadRadius: 9999,
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      // Inner label
                      Center(
                        child: Text(
                          'ALIGN ID HERE',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.4),
                            fontSize: 11,
                            fontFamily: 'monospace',
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                      // Corner accents
                      ..._corners(),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // ── Status hint ──────────────────────────────────────
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Text(
                    'Position your ID inside the frame',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),

                const Spacer(),

                // ── Shutter cluster ──────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(36, 0, 36, 32),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Gallery
                      _GlassButton(
                        icon: Icons.photo_library_outlined,
                        onTap: () => _pick(ImageSource.gallery),
                      ),
                      // Shutter
                      GestureDetector(
                        onTap: _picking
                            ? null
                            : () => _pick(ImageSource.camera),
                        child: Container(
                          width: 76,
                          height: 76,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                            border: Border.all(
                                color: Colors.white.withValues(alpha: 0.9),
                                width: 4),
                            boxShadow: [
                              BoxShadow(
                                color:
                                    Colors.white.withValues(alpha: 0.3),
                                blurRadius: 0,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: _picking
                              ? const Padding(
                                  padding: EdgeInsets.all(20),
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColors.ink,
                                  ),
                                )
                              : null,
                        ),
                      ),
                      // Placeholder for symmetry
                      const SizedBox(width: 40),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _corners() {
    const color = AppColors.accent;
    const size = 28.0;
    const thickness = 4.0;

    return [
      // Top-left
      Positioned(
        top: -2, left: -2,
        child: _Corner(size: size, thickness: thickness, color: color,
            top: true, left: true),
      ),
      // Top-right
      Positioned(
        top: -2, right: -2,
        child: _Corner(size: size, thickness: thickness, color: color,
            top: true, left: false),
      ),
      // Bottom-left
      Positioned(
        bottom: -2, left: -2,
        child: _Corner(size: size, thickness: thickness, color: color,
            top: false, left: true),
      ),
      // Bottom-right
      Positioned(
        bottom: -2, right: -2,
        child: _Corner(size: size, thickness: thickness, color: color,
            top: false, left: false),
      ),
    ];
  }
}

class _Corner extends StatelessWidget {
  const _Corner({
    required this.size,
    required this.thickness,
    required this.color,
    required this.top,
    required this.left,
  });

  final double size;
  final double thickness;
  final Color color;
  final bool top;
  final bool left;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: size,
        height: size,
        child: CustomPaint(
          painter: _CornerPainter(
              thickness: thickness, color: color, top: top, left: left),
        ),
      );
}

class _CornerPainter extends CustomPainter {
  _CornerPainter({
    required this.thickness,
    required this.color,
    required this.top,
    required this.left,
  });

  final double thickness;
  final Color color;
  final bool top;
  final bool left;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = thickness
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final x = left ? 0.0 : size.width;
    final y = top ? 0.0 : size.height;

    canvas.drawLine(
      Offset(x, y),
      Offset(left ? size.width : 0, y),
      paint,
    );
    canvas.drawLine(
      Offset(x, y),
      Offset(x, top ? size.height : 0),
      paint,
    );
  }

  @override
  bool shouldRepaint(_CornerPainter old) => false;
}

class _GlassButton extends StatelessWidget {
  const _GlassButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.black.withValues(alpha: 0.4),
          ),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
      );
}
