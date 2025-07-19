#!/bin/bash

# Test the post upload endpoint
echo "Testing post creation without images..."
curl -X POST http://localhost:3000/api/posts \
  -F "content=Test post without images" \
  -v

echo -e "\n\nTesting post creation with image..."
# Create a test image if it doesn't exist
if [ ! -f test-image.jpg ]; then
  echo "Creating test image..."
  # Create a simple 100x100 red square using ImageMagick or just use any existing image
  echo "Please add a test-image.jpg file to test image uploads"
fi

# If test image exists, upload it
if [ -f test-image.jpg ]; then
  curl -X POST http://localhost:3000/api/posts \
    -F "content=Test post with image" \
    -F "images=@test-image.jpg" \
    -v
fi