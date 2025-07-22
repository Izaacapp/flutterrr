// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:provider/provider.dart';
import 'core/api/graphql_client.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'features/feed/presentation/screens/feed_screen.dart';
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/auth/presentation/screens/otp_verification_screen.dart';
import 'services/auth_service.dart';
import 'widgets/main_app_widget.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  await initHiveForFlutter();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: FutureBuilder<ValueNotifier<GraphQLClient>>(
        future: getGraphQLClient(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return MaterialApp(
              debugShowCheckedModeBanner: false,
              theme: AppTheme.lightTheme,
              home: const Scaffold(
                body: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 16),
                      Text('Discovering API endpoint...'),
                    ],
                  ),
                ),
              ),
            );
          }
          
          if (snapshot.hasError) {
            return MaterialApp(
              debugShowCheckedModeBanner: false,
              theme: AppTheme.lightTheme,
              home: Scaffold(
                body: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text('Error: ${snapshot.error}'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          resetGraphQLClient();
                          (context as Element).markNeedsBuild();
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }
          
          // ✅ CRITICAL: GraphQLProvider WRAPS MaterialApp!
          return GraphQLProvider(
            client: snapshot.data!,
            child: CacheProvider(
              child: MaterialApp(
                debugShowCheckedModeBanner: false,
                title: 'Passport Buddy',
                theme: AppTheme.lightTheme,
                home: Consumer<AuthProvider>(
                  builder: (context, auth, child) {
                    if (auth.isLoading) {
                      return const Scaffold(
                        body: Center(
                          child: CircularProgressIndicator(),
                        ),
                      );
                    }
                    
                    // Check if user exists but needs verification
                    if (authService.user != null && authService.needsVerification) {
                      return OTPVerificationScreen(
                        email: authService.user!.email,
                      );
                    }
                    
                    // Check if authenticated (verified)
                    if (!auth.isAuthenticated) {
                      return const LoginScreen();
                    }
                    
                    return const MainAppWidget();
                  },
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}