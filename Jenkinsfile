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
                                    ./backend
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
                                    ./frontend
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
                        echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin
                        
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
                    string(credentialsId: 'mongo-prod-user', variable: 'MONGO_USER'),
                    string(credentialsId: 'mongo-prod-pass', variable: 'MONGO_PASS')
                ]) {
                    sh """
                        # Copy docker-compose.prod.yml and .env.prod to server
                        scp -o StrictHostKeyChecking=no -i ${SSH_KEY} \
                            docker-compose.prod.yml \
                            ${PROD_USER}@${PROD_SERVER}:${DEPLOY_PATH}/
                        
                        # Deploy on server
                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${PROD_USER}@${PROD_SERVER} << 'EOF'
                            cd ${DEPLOY_PATH}
                            
                            # Set environment variables
                            export TAG=${BUILD_TAG}
                            export MONGO_ROOT_USERNAME=${MONGO_USER}
                            export MONGO_ROOT_PASSWORD=${MONGO_PASS}
                            
                            # Pull latest images
                            docker-compose -f docker-compose.prod.yml pull
                            
                            # Stop old containers
                            docker-compose -f docker-compose.prod.yml down
                            
                            # Start new containers
                            docker-compose -f docker-compose.prod.yml up -d
                            
                            # Wait for services to be healthy
                            echo "Waiting for services to start..."
                            sleep 30
                            
                            # Health checks
                            echo "Checking Backend health..."
                            curl -f http://localhost:3000/health || exit 1
                            
                            echo "Checking Frontend health..."
                            curl -f http://localhost:8080 || exit 1
                            
                            # Cleanup old images
                            docker image prune -f
                            
                            echo "Deployment completed successfully!"
                            docker ps
EOF
                    """
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    // Test the live endpoints
                    sh """
                        echo "Testing production endpoints..."
                        
                        # Test API
                        curl -f https://www.xbullet.me/health || exit 1
                        echo "✅ API is responding"
                        
                        # Test Frontend
                        curl -f https://www.xbullet.me || exit 1
                        echo "✅ Frontend is responding"
                        
                        # Test GraphQL
                        curl -f https://www.xbullet.me/graphql || exit 1
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
                URL: https://www.xbullet.me
            """
        }
        
        failure {
            echo "❌ Deployment failed! Check the logs above."
        }
        
        always {
            // Cleanup workspace
            sh 'docker system prune -f || true'
            cleanWs()
        }
    }
}