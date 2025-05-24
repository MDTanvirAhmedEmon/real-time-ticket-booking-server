import { model, Schema } from "mongoose";
import { IBooking } from "./booking.interface";

const bookingSchema: Schema<IBooking> = new Schema({
    bus: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    seat: {
        type: String,
        required: true
    },
    locked: {
        type: Boolean,
    },
    payment: {
        type: Boolean,
    }
    // user: {
    //     type: Schema.Types.ObjectId,
    //     required: [true, 'User id is required'],
    //     unique: true,
    //     ref: 'User',
    // }
}, {
    timestamps: true
});

export const Booking = model<IBooking>('Booking', bookingSchema);