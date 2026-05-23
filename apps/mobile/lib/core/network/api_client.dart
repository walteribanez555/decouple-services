import 'package:dio/dio.dart';

import 'dio_config.dart';

// Central HTTP client.
//
// Wraps Dio and attaches all interceptors.
// Register as a lazy singleton via injection.dart.
//
// Usage:
//   final client = sl<ApiClient>();
//   final res = await client.dio.get('/endpoint');
class ApiClient {
  ApiClient(String baseUrl) : dio = createDio(baseUrl) {
    // TODO: attach interceptors
    //   dio.interceptors.add(AuthInterceptor(sl()));
    //   dio.interceptors.add(LoggingInterceptor());
  }

  final Dio dio;
}
