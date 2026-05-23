import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';

class VerifyingPage extends StatefulWidget {
  const VerifyingPage({super.key});

  @override
  State<VerifyingPage> createState() => _VerifyingPageState();
}

class _VerifyingPageState extends State<VerifyingPage>
    with TickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final AnimationController _dotController;
  late final List<Animation<double>> _dotAnims;

  @override
  void initState() {
    super.initState();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);

    _dotController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();

    _dotAnims = List.generate(3, (i) {
      final start = i * 0.2;
      return Tween<double>(begin: 0, end: -10).animate(
        CurvedAnimation(
          parent: _dotController,
          curve: Interval(start, start + 0.4, curve: Curves.easeInOut),
        ),
      );
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _dotController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // ── Pulsing rings ────────────────────────────────────────
              AnimatedBuilder(
                animation: _pulseController,
                builder: (_, _) {
                  final scale = 1.0 + _pulseController.value * 0.15;
                  return Stack(
                    alignment: Alignment.center,
                    children: [
                      // outer ring
                      Transform.scale(
                        scale: scale,
                        child: Container(
                          width: 110,
                          height: 110,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.accentSoft.withValues(
                                alpha: 0.5 * (1 - _pulseController.value)),
                          ),
                        ),
                      ),
                      // inner ring
                      Container(
                        width: 80,
                        height: 80,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.accentSoft,
                        ),
                      ),
                      // icon
                      const Icon(Icons.auto_awesome,
                          color: AppColors.accent, size: 32),
                    ],
                  );
                },
              ),

              const SizedBox(height: 32),

              const Text(
                'Analysing your ID',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.8,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "Our AI is checking your document.",
                style: TextStyle(
                  fontSize: 15.5,
                  color: AppColors.muted,
                ),
              ),

              const SizedBox(height: 32),

              // ── Bouncing dots ────────────────────────────────────────
              AnimatedBuilder(
                animation: _dotController,
                builder: (_, _) {
                  return Row(
                    mainAxisSize: MainAxisSize.min,
                    children: List.generate(3, (i) {
                      return Transform.translate(
                        offset: Offset(0, _dotAnims[i].value),
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.accent,
                          ),
                        ),
                      );
                    }),
                  );
                },
              ),

              const SizedBox(height: 48),

              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 48),
                child: Text(
                  'This usually takes under 10 seconds.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13.5,
                    color: AppColors.faint,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
