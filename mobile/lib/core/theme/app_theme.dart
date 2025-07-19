import 'package:flutter/material.dart';

class AppColors {
  // Passport Buddy Purple Theme
  static const Color darkPurple = Color(0xFF7B6BA6);
  static const Color mediumPurple = Color(0xFFB8B3E9);
  static const Color lightPurple = Color(0xFFD4D1F5);
  static const Color periwinkle = Color(0xFFB8B3E9);
  static const Color lightPeriwinkle = Color(0xFFE8E6FA);
  static const Color ultraLight = Color(0xFFF5F4FD);
  static const Color background = Color(0xFFFAFAFF);
  static const Color white = Color(0xFFFFFFFF);
  
  // Travel-specific colors
  static const Color boardingPass = Color(0xFFFFB74D);
  static const Color flight = Color(0xFF4FC3F7);
  static const Color earth = Color(0xFF81C784);
  
  // Error color
  static const Color error = Color(0xFFED4956);
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.mediumPurple,
        brightness: Brightness.light,
      ).copyWith(
        primary: AppColors.mediumPurple,
        secondary: AppColors.periwinkle,
        surface: AppColors.white,
        background: AppColors.background,
        error: AppColors.error,
      ),
      scaffoldBackgroundColor: AppColors.background,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.darkPurple,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w700,
          color: AppColors.darkPurple,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.mediumPurple,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.ultraLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.lightPeriwinkle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.lightPeriwinkle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.mediumPurple, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
      cardTheme: const CardThemeData(
        color: AppColors.white,
        elevation: 2,
        shadowColor: Color(0x1AB8B3E9), // AppColors.mediumPurple with 0.1 opacity
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          side: BorderSide(color: AppColors.lightPeriwinkle, width: 1),
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.mediumPurple,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }
}