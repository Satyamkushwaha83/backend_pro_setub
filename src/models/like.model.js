import mongoose, { Schema, SchemaType, SchemaTypes } from "mongoose";


const likeSchema = new Schema(
    {
       comment: {
      type: Schema.Types.ObjectId,
      ref:"comment"
    }, 
        video: {
      type: SchemaType.ObjectId,
      ref:"video"
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
     tweet: {
      type: Schema.Types.ObjectId,
      ref: "tweet"
    },
    },
   {
     timestamps: true
   }
)


export const Like  = mongoose.model("Like", likeSchema)