import mongoose, { Schema, SchemaType, SchemaTypes } from "mongoose";

const playlistSchema = new Schema(
    {
        name:{
            type: String,
            required: true
        },
        description:{
            type: String,
            required: true
        },
          videos: [
            {
                 type: SchemaType.ObjectId,
                 ref:"video"
             }
],
        owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    },
    
    {
        timestamps: true
    }
)


export const Playlist = mongoose.model("Playlist", playlistSchema)