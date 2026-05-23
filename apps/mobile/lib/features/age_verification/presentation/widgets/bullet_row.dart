import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colors.dart';

class BulletRow extends StatelessWidget {
  const BulletRow({super.key, required this.icon, required this.text});

  final Widget icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.fill,
            borderRadius: BorderRadius.circular(10),
          ),
          alignment: Alignment.center,
          child: icon,
        ),
        const SizedBox(width: 12),
        Text(
          text,
          style: const TextStyle(
            fontSize: 15.5,
            color: AppColors.ink2,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
