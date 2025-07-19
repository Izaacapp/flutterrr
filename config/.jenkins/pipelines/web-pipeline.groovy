// .jenkins/pipelines/web-pipeline.groovy
stage('Build Web') {
  parallel(
    "Build Prod": { sh 'docker build -f web/Dockerfile.prod -t web:${BUILD_NUMBER} .' },
    "Run Tests": { sh 'cd web && npm test' }
  )
}