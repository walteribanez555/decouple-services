import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/doc_type.dart';
import '../cubit/age_verification_cubit.dart';
import '../widgets/camera_overlay.dart';
import '../widgets/capture_button.dart';
import '../widgets/status_chip.dart';

/// Full-screen in-app camera screen.
///
/// Responsibilities (mobile layer stays deliberately thin):
///   1. Initialize and dispose the [CameraController]
///   2. Display a live [CameraPreview] behind the [CameraOverlay]
///   3. Capture → compress (quality 80) → hand the file path to the cubit
///
/// All OCR, validation, and fraud detection happen on the backend.
class CapturePage extends StatefulWidget {
  const CapturePage({super.key, required this.docType});

  final DocType docType;

  @override
  State<CapturePage> createState() => _CapturePageState();
}

class _CapturePageState extends State<CapturePage>
    with WidgetsBindingObserver {
  CameraController? _controller;
  bool _initialized = false;
  bool _capturing = false;
  String? _initError;

  final _picker = ImagePicker();

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initCamera();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final ctrl = _controller;
    if (ctrl == null || !ctrl.value.isInitialized) return;
    if (state == AppLifecycleState.inactive) {
      ctrl.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initCamera();
    }
  }

  // ── Camera init ─────────────────────────────────────────────────────────────

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        if (mounted) setState(() => _initError = 'No camera found on this device.');
        return;
      }

      final ctrl = CameraController(
        cameras.first,
        // Medium resolution: enough for OCR, keeps memory and upload size low.
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await ctrl.initialize();

      if (!mounted) {
        ctrl.dispose();
        return;
      }

      setState(() {
        _controller = ctrl;
        _initialized = true;
        _initError = null;
      });
    } catch (e) {
      if (mounted) setState(() => _initError = e.toString());
    }
  }

  // ── Capture ─────────────────────────────────────────────────────────────────

  Future<void> _capture() async {
    final ctrl = _controller;
    if (_capturing || !_initialized || ctrl == null) return;
    setState(() => _capturing = true);

    try {
      final XFile raw = await ctrl.takePicture();

      // Compress before upload — cuts size ~40% with no OCR-visible quality loss.
      final tempDir = await getTemporaryDirectory();
      final targetPath =
          '${tempDir.path}/doc_${DateTime.now().millisecondsSinceEpoch}.jpg';

      final XFile? compressed = await FlutterImageCompress.compressAndGetFile(
        raw.path,
        targetPath,
        quality: 80,
        format: CompressFormat.jpeg,
      );

      if (!mounted) return;

      context.read<AgeVerificationCubit>().onCapture(
            docType: widget.docType,
            imagePath: compressed?.path ?? raw.path,
            mimeType: 'image/jpeg',
          );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Capture failed — please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _capturing = false);
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final file = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );
      if (file != null && mounted) {
        context.read<AgeVerificationCubit>().onCapture(
              docType: widget.docType,
              imagePath: file.path,
              mimeType: file.mimeType ?? 'image/jpeg',
            );
      }
    } catch (_) {
      // Ignore cancellation.
    }
  }

  Future<void> _toggleFlash() async {
    final ctrl = _controller;
    if (ctrl == null || !_initialized) return;
    final next = ctrl.value.flashMode == FlashMode.torch
        ? FlashMode.off
        : FlashMode.torch;
    await ctrl.setFlashMode(next);
    if (mounted) setState(() {});
  }

  // ── Build ───────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Camera preview
          _buildPreview(),

          // 2. Dark overlay + document frame
          const CameraOverlay(),

          // 3. Top bar (close + doc-type label)
          _buildTopBar(context),

          // 4. Alignment hint below the frame
          _buildStatusChip(context),

          // 5. Shutter cluster at the bottom
          _buildShutterCluster(context),
        ],
      ),
    );
  }

  // ── Layer builders ──────────────────────────────────────────────────────────

  Widget _buildPreview() {
    if (_initError != null) {
      return ColoredBox(
        color: const Color(0xFF0A0A0D),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Text(
              _initError!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70, fontSize: 14),
            ),
          ),
        ),
      );
    }

    if (!_initialized || _controller == null) {
      return const ColoredBox(
        color: Color(0xFF0A0A0D),
        child: Center(
          child: CircularProgressIndicator(
            color: Colors.white54,
            strokeWidth: 2,
          ),
        ),
      );
    }

    // Fill the screen regardless of preview aspect ratio.
    return ClipRect(
      child: OverflowBox(
        alignment: Alignment.center,
        child: FittedBox(
          fit: BoxFit.cover,
          child: SizedBox(
            width: _controller!.value.previewSize!.height,
            height: _controller!.value.previewSize!.width,
            child: CameraPreview(_controller!),
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context) {
    final cubit = context.read<AgeVerificationCubit>();

    return SafeArea(
      child: Align(
        alignment: Alignment.topCenter,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 0),
          child: Row(
            children: [
              _GlassButton(
                icon: Icons.close,
                onTap: () => cubit.proceed(widget.docType),
              ),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.45),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.12),
                  ),
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
              const SizedBox(width: 42), // balance the close button
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(BuildContext context) {
    return Positioned(
      left: 0,
      right: 0,
      bottom: MediaQuery.of(context).size.height * 0.28,
      child: Center(
        child: StatusChip(
          label: _capturing
              ? 'Processing…'
              : 'Position document inside the frame',
          icon: _capturing ? null : Icons.crop_free_outlined,
        ),
      ),
    );
  }

  Widget _buildShutterCluster(BuildContext context) {
    final flashOn = _controller?.value.flashMode == FlashMode.torch;

    return SafeArea(
      child: Align(
        alignment: Alignment.bottomCenter,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(36, 0, 36, 36),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Gallery fallback
              _GlassButton(
                icon: Icons.photo_library_outlined,
                onTap: _capturing ? null : _pickFromGallery,
              ),

              // Shutter
              CaptureButton(
                onPressed: _capture,
                loading: _capturing,
              ),

              // Torch toggle (helps in dim lighting)
              _GlassButton(
                icon: flashOn ? Icons.flash_on : Icons.flash_off_outlined,
                onTap: _capturing ? null : _toggleFlash,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Private widgets ───────────────────────────────────────────────────────────

class _GlassButton extends StatelessWidget {
  const _GlassButton({required this.icon, this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.black.withValues(alpha: 0.45),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.12),
            ),
          ),
          child: Icon(
            icon,
            color: onTap != null ? Colors.white : Colors.white38,
            size: 20,
          ),
        ),
      );
}
