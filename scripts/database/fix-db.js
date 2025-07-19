// Run this with: docker exec mern_flutter_mongodb mongosh -u root -p pass --authenticationDatabase admin devdb < /fix-db.js

db.posts.updateMany(
  { images: { $exists: false } },
  { $set: { images: [] } }
);

print("Updated posts:", db.posts.updateMany({ images: { $exists: false } }, { $set: { images: [] } }));
print("Sample post:", JSON.stringify(db.posts.findOne()));