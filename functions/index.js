const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./util/fbAuth');

const {
    getAllPosts,
    addPost,
    getPost,
    commentOnPost
} = require('./handlers/posts');

const {
    signup,
    login,
    uploadImage,
    addUserDetails,
    getUser
} = require('./handlers/users');

// Post routes
app.get('/posts', getAllPosts);
app.post('/post', FBAuth, addPost);
app.get('/post/:postId', getPost);

// TODO: delete post
// TODO: like a post
// TODO: unlike a post
// TODO: comment on a post
app.post('/post/:postId/comment', FBAuth, commentOnPost);


// Users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getUser);


exports.api = functions.https.onRequest(app);