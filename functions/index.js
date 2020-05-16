const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const express = require('express');
const app = express();

app.get('/posts', (request, response) => {
    admin.firestore()
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let posts = [];
            data.forEach(doc => {
                posts.push({
                    postId: doc.id,
                    /*  body: doc.data().body,
                     userHandle: doc.data().userHandle,
                     createdAt: doc.data().createdAt */
                    ...doc.data()
                });
            })
            return response.json(posts);
        })
        .catch(err => console.error(err));
});


app.post('/post', (request, response) => {
    const newPost = {
        body: request.body.body,
        userHandle: request.body.userHandle,
        createdAt: new Date().toISOString()
    }

    admin.firestore().collection('posts')
        .add(newPost)
        .then(doc => {
            return response.json({
                messsage: `document ${doc.id} created successfully!`
            });
        })
        .catch(err => {
            response.status(500).json({
                error: 'Something went wrong'
            });
            console.error(err);
        })
})

// https://baseurl.com/api/

exports.api = functions.https.onRequest(app);