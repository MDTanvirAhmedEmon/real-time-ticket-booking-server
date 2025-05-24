import { IBooking } from "./booking.interface";
import { Booking } from "./booking.model";
import { ObjectId } from "mongodb";

const createBooking = async (data: IBooking): Promise<any> => {
    // console.log('Booking',data);
    const existingBooking = await Booking.findOne({
        bus: data.bus,
        user: data.user,
        seat: data.seat,
    })
    console.log("existingBooking", existingBooking);
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

const getAllUnavailableSeatsOfaBus = async (busId: any): Promise<any> => {
    console.log('service', busId);
    const LOCK_DURATION_MINUTES = 5;
    const expiryDate = new Date(Date.now() - LOCK_DURATION_MINUTES * 60 * 1000);

    console.log('Current Date:', new Date());
    console.log('Expiry Date (5 minutes ago):', expiryDate.toISOString());
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
    console.log('service', busData?.bus);
    const LOCK_DURATION_MINUTES = 5;
    const expiryDate = new Date(Date.now() - LOCK_DURATION_MINUTES * 60 * 1000);

    console.log('Current Date:', new Date());
    console.log('Expiry Date (5 minutes ago):', expiryDate.toISOString());
    const updatedBooking = await Booking.deleteMany(
        {
            bus: busData?.bus,
            locked: true,
            payment: false,
            createdAt: { $lt: expiryDate.toISOString() }
        }
    );

    console.log(`Unlocked expired and unpaid seats.${updatedBooking}`);

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
    getAllUnavailableSeatsOfaBus,
    getSocketAllUnavailableSeatsOfaBus,
}