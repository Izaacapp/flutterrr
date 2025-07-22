import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.VITE_GRAPHQL_URL || 'http://localhost:3000/graphql',
  documents: "src/**/*.{ts,tsx}", // Scans your components for GQL queries
  generates: {
    // Defines the output location and plugins to run
    "./src/gql/generated.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo" // This plugin creates the hooks
      ],
      config: {
        withHooks: true, // Explicitly enable hooks generation
        reactApolloVersion: 3, // Specify your Apollo Client version
      }
    }
  }
};

export default config;