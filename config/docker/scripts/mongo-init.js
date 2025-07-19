// MongoDB initialization script
print('MongoDB initialization started...');

// Switch to or create the devdb database
db = db.getSiblingDB('devdb');

// Create collections
db.createCollection('users');
db.createCollection('posts');

print('MongoDB initialization completed successfully!');