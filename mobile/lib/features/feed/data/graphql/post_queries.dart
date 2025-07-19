// lib/features/feed/data/graphql/post_queries.dart
import 'package:graphql_flutter/graphql_flutter.dart';

// Your GraphQL queries matching your Node.js schema
final String getPostsQuery = r'''
  query GetPosts {
    posts {
      _id
      author {
        _id
        username
        fullName
        avatar
      }
      content
      images {
        url
        key
        size
        mimetype
      }
      likes
      comments {
        _id
      }
      createdAt
    }
  }
''';

final String createPostMutation = r'''
  mutation CreatePost($content: String!) {
    createPost(postInput: {content: $content}) {
      _id
      content
      images {
        url
        key
        size
        mimetype
      }
      createdAt
    }
  }
''';

final String updateProfileMutation = r'''
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      _id
      username
      fullName
      avatar
      bio
      location
      homeAirport
      passportCountry
      milesFlown
      countriesVisited
      emailVerified
    }
  }
''';

// For convenience
final getPostsDocument = gql(getPostsQuery);
final createPostDocument = gql(createPostMutation);
final updateProfileDocument = gql(updateProfileMutation);