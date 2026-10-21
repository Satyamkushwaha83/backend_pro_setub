import mongoose, { Schema } from "mongoose"

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,//one who is suscribing
        ref: "User"
    },
    channel: {
        ype: Schema.Types.ObjectId,//one whom "subsriber" is subscribing
        ref: "User"
    }
}, {timestamps:true})

export const Subscription = mongoose.model("Subscription",
    subscriptionSchema
)