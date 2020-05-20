let db = {
    users: [{
        userId: 'userid',
        email: 'email@gmail.com',
        handle: 'user',
        createdAt: 'createdAt',
        imageUrl: 'imageUrl',
        bio: 'bio',
        website: 'website',
        location: 'location'
    }],
    posts: [{
        userHandle: 'user',
        body: 'this is the post body',
        createdAt: '2020-05-16T15:35:30.896Z',
        likeCount: 5,
        commentCount: 2
    }]
};

const userDetails = {
    // Redux data
    credentials: {
        userId: 'userid',
        email: 'email@gmail.com',
        handle: 'user',
        createdAt: 'createdAt',
        imageUrl: 'imageUrl',
        bio: 'bio',
        website: 'website',
        location: 'location'
    },
    likes: [{
            userHandle: 'user',
            postId: 'postId'
        },
        {
            userHandle: 'user',
            postId: 'postId'
        }
    ]
}