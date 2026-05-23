import 'package:flutter/material.dart';

// Design token palette — matches the Age Verification HTML design (screens.jsx T object).
abstract final class AppColors {
  // ── Backgrounds ───────────────────────────────────────────────────────────
  static const Color bg      = Color(0xFFF4F2EC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color fill    = Color(0xFFEFEDE6);
  static const Color fillStrong = Color(0xFFE4E1D8);

  // ── Text ──────────────────────────────────────────────────────────────────
  static const Color ink   = Color(0xFF14141A);
  static const Color ink2  = Color(0xFF3A3A42);
  static const Color muted = Color(0xFF6A6A72);
  static const Color faint = Color(0xFFA6A6AE);

  // ── Borders ───────────────────────────────────────────────────────────────
  // rgba(20, 20, 26, 0.08)
  static const Color hairline = Color(0x1414141A);

  // ── Accent ────────────────────────────────────────────────────────────────
  static const Color accent     = Color(0xFF5B47E8);
  static const Color accentSoft = Color(0xFFEEEBFD);

  // ── Status: success ───────────────────────────────────────────────────────
  static const Color success     = Color(0xFF1E8A5C);
  static const Color successSoft = Color(0xFFE4F3EC);

  // ── Status: error ─────────────────────────────────────────────────────────
  static const Color error     = Color(0xFFD3463A);
  static const Color errorSoft = Color(0xFFFBEAE7);

  // ── Status: warning ───────────────────────────────────────────────────────
  static const Color warn     = Color(0xFFB8761B);
  static const Color warnSoft = Color(0xFFFBEFD8);
}
