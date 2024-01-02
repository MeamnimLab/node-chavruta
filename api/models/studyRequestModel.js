const mongoose = require('mongoose');

const studyRequestSchema = new mongoose.Schema({
    preferredLanguages: [String],
    topics: [String],
    studyDuration: {
        min: Number,
        max: Number,
    },
    startDateAndTime: Date,
    description:String,
    levelOfStudy: Number,
    ageRange: Number,
    educationRange: Number, 
    locationRange: Number,
    friendListRange: Number,
    privacy: {
        type: String,
        enum: ['private', 'public'],
        default: 'public', // Set a default value if not provided
    },
    state: {
        type: String,
        enum: ['done', 'past', 'open', 'close'],
        default: 'open', // Set a default value if not provided
    },
    matchesList: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
        default: [],
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    },
})

// Add a pre-delete middleware
studyRequestSchema.pre('deleteOne', { document: false, query: true }, async function (next) {
    const delId = this.getQuery()._id;

    // Find all users whose requestList contains delId
    const usersToUpdate = await UserModel.find({ requestList: delId });

    // Remove delId from requestList for each user
    const updatePromises = usersToUpdate.map(async (user) => {
        if (user.requestList && user.requestList.includes(delId)) {
            user.requestList = user.requestList.filter(id => id !== delId);
            await user.save();
        }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    next();
});

exports.StudyRequestModel = mongoose.model("studyRequests", studyRequestSchema);