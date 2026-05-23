import 'package:dio/dio.dart';

import '../constants/app_constants.dart';

/// Builds and returns a configured [Dio] instance.
///
/// Interceptors (auth, logging, retry) are attached in [ApiClient].
Dio createDio(String baseUrl) {
  return Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(milliseconds: AppConstants.connectTimeoutMs),
      receiveTimeout: const Duration(milliseconds: AppConstants.receiveTimeoutMs),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );
}
