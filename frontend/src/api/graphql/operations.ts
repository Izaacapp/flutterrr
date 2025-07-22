import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import { gql } from '@apollo/client';

export const GET_POSTS = gql`
  query GetPosts {
    posts {
      _id
      content
      author {
        _id
        username
        fullName
        avatar
      }
      images {
        url
        key
        size
        mimetype
      }
      likes
      comments {
        _id
        author {
          _id
          username
          fullName
          avatar
        }
        content
        createdAt
      }
      createdAt
    }
  }
`;

export const CREATE_POST = gql`
  mutation CreatePost($content: String!) {
    createPost(postInput: { content: $content }) {
      _id
      content
      author {
        _id
        username
        fullName
        avatar
      }
      images {
        url
        key
        size
        mimetype
      }
      createdAt
    }
  }
`;

export const UPDATE_PROFILE = gql`
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
`;

export const GET_ME = gql`
  query GetMe {
    me {
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
`;