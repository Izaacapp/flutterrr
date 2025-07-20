pipeline {
    agent any
    
    environment {
        // Docker Registry
        REGISTRY = 'timesnotrelative'
        BACKEND_IMAGE = "${REGISTRY}/passport-buddy-backend"
        FRONTEND_IMAGE = "${REGISTRY}/passport-buddy-frontend"
        
        // Production Server
        PROD_SERVER = '138.197.72.196'
        PROD_USER = 'root'
        DEPLOY_PATH = '/app'
        
        // Build Info
        BUILD_TAG = "${BUILD_NUMBER}"
        GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    echo "Building from branch: ${env.BRANCH_NAME}"
                    echo "Commit: ${GIT_COMMIT_SHORT}"
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        script {
                            echo "Building Backend Docker image..."
                            sh """
                                docker build -f backend/Dockerfile.prod \
                                    --build-arg NODE_ENV=production \
                                    --build-arg BUILD_NUMBER=${BUILD_NUMBER} \
                                    --build-arg GIT_COMMIT=${GIT_COMMIT_SHORT} \
                                    -t ${BACKEND_IMAGE}:${BUILD_TAG} \
                                    -t ${BACKEND_IMAGE}:latest \
                                    . 
                            """
                        }
                    }
                }
                
                stage('Build Frontend') {
                    steps {
                        script {
                            echo "Building Frontend Docker image..."
                            sh """
                                docker build -f frontend/Dockerfile.prod \
                                    --build-arg VITE_API_URL=https://www.xbullet.me \
                                    --build-arg VITE_GRAPHQL_URL=https://www.xbullet.me/graphql \
                                    --build-arg VITE_WS_URL=wss://www.xbullet.me/graphql \
                                    -t ${FRONTEND_IMAGE}:${BUILD_TAG} \
                                    -t ${FRONTEND_IMAGE}:latest \
                                    . 
                            """
                        }
                    }
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo \${DOCKER_PASS} | docker login -u \${DOCKER_USER} --password-stdin
                        
                        # Push Backend
                        docker push ${BACKEND_IMAGE}:${BUILD_TAG}
                        docker push ${BACKEND_IMAGE}:latest
                        
                        # Push Frontend
                        docker push ${FRONTEND_IMAGE}:${BUILD_TAG}
                        docker push ${FRONTEND_IMAGE}:latest
                        
                        docker logout
                    """
                }
            }
        }
        
        stage('Deploy to Production') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'do-ssh-key', keyFileVariable: 'SSH_KEY'),
                    string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET'),
                    string(credentialsId: 'session-secret', variable: 'SESSION_SECRET'),
                    string(credentialsId: 'do-spaces-key', variable: 'DO_SPACES_KEY'),
                    string(credentialsId: 'do-spaces-secret', variable: 'DO_SPACES_SECRET')
                ]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no -i \${SSH_KEY} ${PROD_USER}@${PROD_SERVER} << 'EOF'
                            # Navigate to deployment directory
                            cd ${DEPLOY_PATH}
                            
                            # Pull latest code
                            git pull origin main
                            
                            # Create production .env file
                            cat > config/.env.prod << ENV
# Production Environment Configuration
NODE_ENV=production
PORT=3000
API_HOST=${PROD_SERVER}

# Database (no auth as per deployment docs)
MONGO_URI=mongodb://mongodb:27017/passport_buddy_prod
MONGO_DB_NAME=passport_buddy_prod

# Security
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
BCRYPT_ROUNDS=12

# CORS
ALLOWED_ORIGINS=https://www.xbullet.me,https://xbullet.me
CORS_ORIGIN=https://www.xbullet.me,https://xbullet.me

# Email Service
MAILTRAP_TOKEN=59406d5785ac01dc13eed94c3ec47dcb
MAILTRAP_ENDPOINT=https://send.api.mailtrap.io
EMAIL_FROM=noreply@xbullet.me
EMAIL_FROM_NAME=Passport Buddy

# Storage
STORAGE_TYPE=spaces
UPLOAD_DIR=./uploads
UPLOAD_URL=https://www.xbullet.me/uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# DigitalOcean Spaces
DO_SPACES_KEY=${DO_SPACES_KEY}
DO_SPACES_SECRET=${DO_SPACES_SECRET}
DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=passportbuddy
DO_SPACES_REGION=nyc3

# Frontend URLs (baked into image)
VITE_API_URL=https://www.xbullet.me
VITE_GRAPHQL_URL=https://www.xbullet.me/graphql
VITE_WS_URL=wss://www.xbullet.me/graphql

# Feature Flags
ENABLE_SIGNUP=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_FORGOT_PASSWORD=true
ENABLE_GRAPHQL_PLAYGROUND=false

# Build Tag
TAG=${BUILD_TAG}
ENV
                            
                            # Deploy with docker-compose
                            echo "Deploying services with tag: ${BUILD_TAG}"
                            docker-compose -f docker-compose.prod.yml --env-file config/.env.prod pull
                            docker-compose -f docker-compose.prod.yml --env-file config/.env.prod down --remove-orphans
                            docker-compose -f docker-compose.prod.yml --env-file config/.env.prod up -d
                            
                            echo "Waiting for services to start..."
                            sleep 30
                            
                            # Check health
                            echo "Checking Backend health..."
                            curl -f http://localhost:3000/api/health || exit 1
                            
                            echo "Deployment completed successfully!"
EOF
                    """
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    sh """
                        echo "Testing production endpoints..."
                        
                        # Test API health
                        curl -f https://www.xbullet.me/api/health || exit 1
                        echo "✅ API is responding"
                        
                        # Test Frontend
                        curl -f https://www.xbullet.me || exit 1
                        echo "✅ Frontend is responding"
                        
                        # Test GraphQL
                        curl -f -X POST https://www.xbullet.me/graphql \
                            -H "Content-Type: application/json" \
                            -d '{"query":"{ __typename }"}' || exit 1
                        echo "✅ GraphQL is responding"
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo """
                ✅ Deployment Successful!
                Build: ${BUILD_NUMBER}
                Commit: ${GIT_COMMIT_SHORT}
                Images: ${BUILD_TAG}
                URL: https://www.xbullet.me
            """
        }
        
        failure {
            echo "❌ Deployment failed! Check the logs above."
        }
        
        always {
            // Cleanup
            sh 'docker system prune -f || true'
            cleanWs()
        }
    }
}