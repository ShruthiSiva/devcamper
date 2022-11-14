const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add a title for the review."],
    maxlength: 100,
  },
  text: {
    type: String,
    required: [true, "Please add some text."],
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, "Please add a rating between 1 and 10."],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

// Prevent user from submitting more than one review per bootcamp
// Mongo DB allows secondary indexing (primary indexing is by the use of _id). From what I understand, this tries to index a document (a review in the Reviews collection within out DB) by "_id", "bootcamp" and "user". "id" is generally unique. Here, we're saying that we want the combination of "bootcamp" and "user" indexes to be unique too.
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// Static method to get average rating.
ReviewSchema.statics.getAverageRating = async function (bootcampId) {
  const obj = await this.aggregate([
    {
      /** Get all reviews with that bootcamp ID */
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        /** This step of the pipeline performs grouping (eg. averaging) of those retrieved reviews from the last step */
        /** $bootcamp: The field that contains the bootcamp ID in each review */
        _id: "$bootcamp",
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageRating: obj[0].averageRating,
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
ReviewSchema.post("save", function () {
  // We are on the model, so "this" references the model.
  // We defined getAverageCost as a static method on the model.
  this.constructor.getAverageRating(this.bootcamp);
});

// Call getAverageRating before remove
ReviewSchema.pre("remove", function () {
  this.constructor.getAverageRating(this.bootcamp);
});

module.exports = mongoose.model("Review", ReviewSchema);
