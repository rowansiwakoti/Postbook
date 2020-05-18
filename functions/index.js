const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('../key.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const app = require('express')();

const firebase = require('firebase');
const config = {
    apiKey: "AIzaSyBfIiuHWDrEGQKWLb-7SQZwP8Ew_q4dixs",
    authDomain: "postbook-82e7d.firebaseapp.com",
    databaseURL: "https://postbook-82e7d.firebaseio.com",
    projectId: "postbook-82e7d",
    storageBucket: "postbook-82e7d.appspot.com",
    messagingSenderId: "573878459475",
    appId: "1:573878459475:web:2377e27984945adc613aa6",
    measurementId: "G-2H6QCK59RT"
};
firebase.initializeApp(config)

const db = admin.firestore();

app.get('/posts', (request, response) => {
    db.collection('posts')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let posts = [];
            data.forEach(doc => {
                posts.push({
                    postId: doc.id,
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

    db.collection('posts')
        .add(newPost)
        .then(doc => {
            return response.json({
                messsage: `Document ${doc.id} created successfully!`
            });
        })
        .catch(err => {
            response.status(500).json({
                error: 'Something went wrong!'
            });
            console.error(err);
        })
})

const isEmpty = (string) => {
    if (string.trim() === '') return true;
    else return false;
}

const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(emailRegEx)) return true;
    else return false;
}

// Signup route
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    }

    let errors = {};

    if (isEmpty(newUser.email)) {
        errors.email = 'Must not be empty';
    } else if (!isEmail(newUser.email)) {
        errors.email = 'Must be a valid email address';
    }

    if (isEmpty(newUser.password)) {
        errors.password = 'Must not be empty';
    }

    if (newUser.password !== newUser.confirmPassword) {
        errors.confirmPassword = 'Passwords must match'
    }

    if (isEmpty(newUser.handle)) {
        errors.handle = 'Must not be empty';
    }

    if (Object.keys(errors).length) {
        return res.status(400).json(errors);
    }


    // TODO: validate data
    let tokenKey = null,
        userId = null;
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({
                    handle: 'This handle is already taken!'
                });
            }
            return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken()
        })
        .then(token => {
            tokenKey = token;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({
                token: tokenKey
            })
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({
                    email: 'Email is already in use!'
                });
            } else {
                return res.status(500).json({
                    error: err.code
                });
            }
        })
})

app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    let errors = {};

    if (isEmpty(user.email)) {
        errors.email = 'Must not be empty';
    } else if (!isEmail(user.email)) {
        errors.email = 'Must be a valid email address';
    }

    if (isEmpty(user.password)) {
        errors.password = 'Must not be empty';
    }

    if (Object.keys(errors).length) {
        return res.status(400).json(errors);
    }

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({
                token
            });
        })
        .catch(err => {
            if (err.code === 'auth/wrong-password') {
                return res.status(403).json({
                    general: 'Wrong credentials, please try again!'
                });
            }
            if (err.code === 'auth/user-not-found') {
                return res.status(404).json({
                    general: 'User not found!'
                });
            }
            console.error(err);
            return res.status(500).json({
                error: err.code
            });
        })
})



exports.api = functions.https.onRequest(app);