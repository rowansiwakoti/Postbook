const {
    db,
    admin
} = require('../util/admin');

const config = require('../util/config');
const {
    validateSignUpData,
    validateLoginData,
    reduceUserDetails
} = require('../util/validators');

const firebase = require('firebase');
firebase.initializeApp(config);

// Sign users up
exports.signup = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

    const {
        valid,
        errors
    } = validateSignUpData(newUser);

    if (!valid) return res.status(400).json(errors);

    const noImage = 'no-image.png';

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
            return data.user.getIdToken();
        })
        .then(token => {
            tokenKey = token;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImage}?alt=media`,
                userId
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({
                token: tokenKey
            });
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
};

// Log user in.
exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    const {
        valid,
        errors
    } = validateLoginData(user);

    if (!valid) return res.status(400).json(errors);

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
};

// Add user details
exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);

    db.doc(`/users/${req.user.handle}`).update(userDetails)
        .then(() => {
            return res.json({
                message: 'Details added successfully!'
            });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({
                error: err.code
            });
        });
};

exports.getUser = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.user.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                userData.credentials = doc.data();
                return db.collection('likes').where('userHandle', '==', req.user.handle).get();
            }
        })
        .then(data => {
            userData.likes = [];
            data.forEach(doc => {
                userData.likes.push(doc.data());
            });
            return res.json(userData);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({
                error: err.code
            });
        });

};

// Uploads a profile image for a user.
exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busBoy = new BusBoy({
        headers: req.headers
    });

    let imageFileName = null;
    let imageToBeUploaded = {};

    busBoy.on('file', (fieldName, file, fileName, encoding, mimeType) => {
        if (mimeType !== 'image/jpeg' && mimeType !== 'image/png' && mimeType !== 'image/jpg') {
            return res.status(400).json({
                error: 'Wrong file type submitted!'
            });
        }
        const imageExtension = fileName.split('.').pop();
        imageFileName = `${Math.round(Math.random() * 100000000000)}.${imageExtension}`;
        const filePath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {
            filePath,
            mimeType
        };

        file.pipe(fs.createWriteStream(filePath));
    });
    busBoy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filePath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimeType
                    }
                }
            })
            .then(() => {
                console.log('this is image file name ', imageFileName);
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/users/${req.user.handle}`).update({
                    imageUrl
                });
            })
            .then(() => {
                return res.json({
                    message: 'Image uploaded successfully!'
                });
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({
                    error: err.code
                });
            });
    });
    busBoy.end(req.rawBody);
}