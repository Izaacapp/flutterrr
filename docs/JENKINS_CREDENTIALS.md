# Jenkins Credentials Configuration

This document lists all the credentials that need to be configured in Jenkins for the CI/CD pipeline.

## Required Credentials

### 1. Docker Registry Credentials

| Credential ID | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `docker-registry-url` | Secret text | Docker registry URL | `docker.io/yournamespace` |
| `docker-creds` | Username with password | Docker Hub credentials | Username: `yourusername`<br>Password: `your-token` |

### 2. Server Access Credentials

| Credential ID | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `production-server-ip` | Secret text | Production server IP address | `123.456.789.0` |
| `production-server-user` | Secret text | SSH user for production server | `ubuntu` |
| `do-ssh-key` | SSH Username with private key | SSH key for server access | Private key content |

### 3. Application Configuration

| Credential ID | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `vite-api-url` | Secret text | Public API URL | `https://api.yourdomain.com` |
| `vite-graphql-url` | Secret text | GraphQL endpoint URL | `https://api.yourdomain.com/graphql` |
| `web-public-url` | Secret text | Public web URL | `https://yourdomain.com` |
| `api-port` | Secret text | API server port | `3000` |
| `web-port` | Secret text | Web server port | `8080` |

### 4. Database Credentials

| Credential ID | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `mongo-prod-uri` | Secret text | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |

### 5. Security & Authentication

| Credential ID | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `jwt-secret` | Secret text | JWT secret key | `your-super-secret-jwt-key` |

### 6. External Services

| Credential ID | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `mailtrap-token` | Secret text | Mailtrap API token | `your-mailtrap-token` |
| `upload-url` | Secret text | File upload base URL | `https://api.yourdomain.com/uploads` |

## How to Add Credentials in Jenkins

1. Navigate to Jenkins Dashboard
2. Go to "Manage Jenkins" → "Manage Credentials"
3. Select the appropriate domain (usually "Global")
4. Click "Add Credentials"
5. Choose the credential type:
   - For text values: Select "Secret text"
   - For username/password: Select "Username with password"
   - For SSH keys: Select "SSH Username with private key"
6. Enter the ID exactly as shown in the tables above
7. Fill in the required values
8. Click "OK" to save

## Environment-Specific Credentials

For multiple environments (staging, production), you can create environment-specific credentials:

### Staging
- `staging-server-ip`
- `staging-mongo-uri`
- `staging-vite-api-url`
- etc.

### Production
- `production-server-ip`
- `production-mongo-uri`
- `production-vite-api-url`
- etc.

## Security Best Practices

1. **Use Strong Secrets**: Generate strong, random values for all secrets
2. **Rotate Regularly**: Update credentials periodically
3. **Limit Access**: Use Jenkins' role-based access control to limit who can view/edit credentials
4. **Audit Usage**: Enable Jenkins audit logging to track credential usage
5. **Never Hardcode**: Never put actual credential values in your Jenkinsfile or source code
6. **Use Folders**: Organize credentials in folders by environment or project
7. **Backup**: Include credentials in your Jenkins backup strategy

## Testing Credentials

To test if credentials are properly configured:

1. Create a test pipeline job
2. Use this script to verify credentials are accessible:

```groovy
pipeline {
    agent any
    stages {
        stage('Test Credentials') {
            steps {
                withCredentials([
                    string(credentialsId: 'vite-api-url', variable: 'API_URL')
                ]) {
                    sh 'echo "API URL is configured (hidden): ${API_URL:0:8}..."'
                }
            }
        }
    }
}
```

## Troubleshooting

### "Credentials not found" Error
- Verify the credential ID matches exactly (case-sensitive)
- Check the credential is in the correct domain/folder
- Ensure the Jenkins job has permission to access the credential

### SSH Key Issues
- Ensure the private key is in the correct format (RSA/ED25519)
- Include the full key including headers (`-----BEGIN RSA PRIVATE KEY-----`)
- Verify the corresponding public key is added to the server's `~/.ssh/authorized_keys`

### Connection Timeouts
- Check firewall rules allow Jenkins to connect to external services
- Verify the server IPs and ports are correct
- Test connectivity from Jenkins server manually