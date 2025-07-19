// Simple connection test
import 'package:http/http.dart' as http;

void main() async {
  final urls = [
    'http://192.168.1.206:3000/health',
    'http://192.168.1.206:3000/graphql',
    'http://localhost:3000/health',
  ];
  
  for (final url in urls) {
    try {
      print('Testing $url...');
      final response = await http.get(Uri.parse(url)).timeout(
        Duration(seconds: 5),
        onTimeout: () {
          throw Exception('Timeout after 5 seconds');
        },
      );
      print('✅ $url - Status: ${response.statusCode}');
    } catch (e) {
      print('❌ $url - Error: $e');
    }
  }
}