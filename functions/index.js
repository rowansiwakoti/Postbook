const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./util/fbAuth');

const {
    getAllPosts,
    addPost
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
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getUser);


// Users routes
app.post('/signup', signup);
app.post('/login', login);


exports.api = functions.https.onRequest(app);