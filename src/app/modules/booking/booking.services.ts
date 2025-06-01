import { IBooking } from "./booking.interface";
import { Booking } from "./booking.model";
// import { ObjectId } from "mongodb";
import mongoose from 'mongoose';

const createBooking = async (data: IBooking): Promise<any> => {
    // console.log('Booking',data);
    const existingBooking = await Booking.findOne({
        bus: data.bus,
        user: data.user,
        seat: data.seat,
    })
    const bookedBySomeone = await Booking.findOne({
        bus: data.bus,
        seat: data.seat,
    })

    console.log('bookedby someone', bookedBySomeone);

    // If seat is booked by someone else (not the current user)
    if (bookedBySomeone && String(bookedBySomeone.user) !== String(data.user)) {
        return { message: 'Someone Locked Before You! 😶‍🌫️', bookedBySomeone };
    }
    // if (bookedBySomeone && String(bookedBySomeone.user) !== String(data.user)) {
    //     return bookedBySomeone
    // }


    if (!existingBooking) {
        data.locked = true;
        data.payment = false;
        const result = await Booking.create(data)
        return result;
    }
    else {
        await Booking.deleteOne({
            bus: data.bus,
            user: data.user,
            seat: data.seat,
        })
    }
}

const createTransactionBooking = async (data: IBooking): Promise<any> => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // Check if seat is booked by someone else
        const bookedBySomeone = await Booking.findOne(
            { bus: data.bus, seat: data.seat },
            null,
            { session }
        );

        if (bookedBySomeone && String(bookedBySomeone.user) !== String(data.user)) {
            // Abort transaction and return error message
            await session.abortTransaction();
            session.endSession();
            return { message: 'Someone Locked Before You! 😶‍🌫️', bookedBySomeone };
        }

        // Check if this user already booked the seat
        const existingBooking = await Booking.findOne(
            { bus: data.bus, user: data.user, seat: data.seat },
            null,
            { session }
        );

        let result;

        if (!existingBooking) {
            // Create booking
            data.locked = true;
            data.payment = false;
            result = await Booking.create([data], { session }); // create with session
        } else {
            // Delete booking (toggle off)
            await Booking.deleteOne(
                { bus: data.bus, user: data.user, seat: data.seat },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        // If created, result is an array (because create with array), get first element
        return Array.isArray(result) ? result[0] : result;
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        if (error.code === 11000) {
            // Duplicate key error - seat already booked in concurrent tx
            return { message: 'Someone Locked Before You! 😶‍🌫️' };
        }

    }
};


// const createTransactionMaxBooking = async (data: IBooking): Promise<any> => {
//     const session = await mongoose.startSession();

//     try {
//         session.startTransaction();

//         // Check if seat is already booked by someone else
//         const existingBooking = await Booking.findOne(
//             { bus: data.bus, seat: data.seat },
//             null,
//             { session }
//         );

//         if (existingBooking && String(existingBooking.user) !== String(data.user)) {
//             await session.abortTransaction();
//             session.endSession();
//             return { message: 'Someone Locked Before You! 😶‍🌫️', bookedBySomeone: existingBooking };
//         }

//         // Use findOneAndUpdate for atomic operation
//         const result = await Booking.findOneAndUpdate(
//             { bus: data.bus, user: data.user, seat: data.seat },
//             { 
//                 $setOnInsert: { 
//                     ...data, 
//                     locked: true, 
//                     payment: false 
//                 }
//             },
//             { 
//                 upsert: true, 
//                 new: true, 
//                 session,
//                 setDefaultsOnInsert: true
//             }
//         );

//         // If user wants to toggle off (booking exists), delete it
//         if (!result.isNew) {
//             await Booking.deleteOne(
//                 { bus: data.bus, user: data.user, seat: data.seat },
//                 { session }
//             );
//         }

//         await session.commitTransaction();
//         session.endSession();

//         return result;
//     } catch (error: any) {
//         await session.abortTransaction();
//         session.endSession();
        
//         if (error.code === 11000) {
//             return { message: 'Someone Locked Before You! 😶‍🌫️' };
//         }
//         throw error;
//     }
// };

const getAllUnavailableSeatsOfaBus = async (busId: any): Promise<any> => {
    // console.log('service', busId);
    const LOCK_DURATION_MINUTES = 11;
    const expiryDate = new Date(Date.now() - LOCK_DURATION_MINUTES * 60 * 1000);

    // console.log('Current Date:', new Date());
    // console.log('Expiry Date (5 minutes ago):', expiryDate.toISOString());
    const updatedBooking = await Booking.deleteMany(
        {
            bus: busId,
            locked: true,
            payment: false,
            createdAt: { $lt: expiryDate.toISOString() }
        }
    );

    console.log(`Unlocked expired and unpaid seats.${updatedBooking}`);

    // const result = await Booking.find({ bus: busId })
    //     .select('seat')
    //     .lean()
    // const seats = result.map(item => item.seat);
    // return seats;
    const result = await Booking.aggregate([
        { $match: { bus: busId, locked: true } }, // Only locked seats
        {
            $group: {
                _id: null,
                unavailable: {
                    $push: {
                        $cond: [{ $eq: ['$payment', true] }, '$seat', '$$REMOVE']
                    }
                },
                locked: {
                    $push: {
                        $cond: [{ $eq: ['$payment', false] }, '$seat', '$$REMOVE']
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                unavailable: 1,
                locked: 1
            }
        }
    ]);
    return result[0];
}


const getSocketAllUnavailableSeatsOfaBus = async (busData: any): Promise<any> => {
    // console.log('service', busData?.bus);
    const LOCK_DURATION_MINUTES = 11;
    const expiryDate = new Date(Date.now() - LOCK_DURATION_MINUTES * 60 * 1000);

    // console.log('Current Date:', new Date());
    // console.log('Expiry Date (5 minutes ago):', expiryDate.toISOString());
    const updatedBooking = await Booking.deleteMany(
        {
            bus: busData?.bus,
            locked: true,
            payment: false,
            createdAt: { $lt: expiryDate.toISOString() }
        }
    );

    // console.log(`Unlocked expired and unpaid seats.${updatedBooking}`);

    const result = await Booking.aggregate([
        { $match: { bus: busData?.bus, locked: true } }, // Only locked seats
        {
            $group: {
                _id: null,
                unavailable: {
                    $push: {
                        $cond: [{ $eq: ['$payment', true] }, '$seat', '$$REMOVE']
                    }
                },
                locked: {
                    $push: {
                        $cond: [{ $eq: ['$payment', false] }, '$seat', '$$REMOVE']
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                unavailable: 1,
                locked: 1
            }
        }
    ]);
    return result[0];
}

export const bookingServices = {
    createBooking,
    createTransactionBooking,
    // createTransactionMaxBooking,
    getAllUnavailableSeatsOfaBus,
    getSocketAllUnavailableSeatsOfaBus,
}