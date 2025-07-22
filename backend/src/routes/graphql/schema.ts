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

    type Notification {
        _id: ID!
        sender: User!
        type: String!
        message: String!
        relatedPost: Post
        relatedComment: String
        isRead: Boolean!
        createdAt: String!
        updatedAt: String!
    }

    type NotificationResponse {
        notifications: [Notification!]!
        totalCount: Int!
        unreadCount: Int!
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
        notifications(page: Int, limit: Int): NotificationResponse
        unreadNotificationCount: Int
    }

    type RootMutation {
        createPost(postInput: PostInput!): Post
        updateProfile(input: UpdateProfileInput!): User
        markNotificationAsRead(notificationId: ID!): Notification
        markAllNotificationsAsRead: Boolean
        deleteNotification(notificationId: ID!): Boolean
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);