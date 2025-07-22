import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import { buildSchema } from 'graphql';

// This exports the schema definition.
// The key types here are `RootQuery` and `RootMutation`.
export default buildSchema(`
    type Image {
        url: String!
        key: String!
        size: Int!
        mimetype: String!
    }

    type User {
        _id: ID!
        username: String!
        fullName: String!
        avatar: String
        bio: String
        location: String
        homeAirport: String
        passportCountry: String
        milesFlown: Int
        countriesVisited: [String!]!
        emailVerified: Boolean!
    }

    type Comment {
        _id: ID!
        author: User
        content: String!
        createdAt: String!
    }

    type Post {
        _id: ID!
        author: User
        content: String!
        images: [Image!]!
        likes: [String!]!
        comments: [Comment!]!
        createdAt: String!
    }

    input PostInput {
        content: String!
    }

    input UpdateProfileInput {
        fullName: String
        bio: String
        location: String
        homeAirport: String
        passportCountry: String
        avatar: String
    }

    type RootQuery {
        posts: [Post!]!
        user(userId: ID): User
        me: User
    }

    type RootMutation {
        createPost(postInput: PostInput!): Post
        updateProfile(input: UpdateProfileInput!): User
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);