import { NextFunction, Request, Response } from "express";
import { bookingServices } from "./booking.services";


const createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body
        const result = await bookingServices.createBooking(data)


        res.status(200).json({
            success: true,
            message: 'Booked Successfully',
            data: result,
        })
    }
    catch (error) {
        next(error)
    }
}

const getAllUnavailableSeatsOfaBus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id
        const result = await bookingServices.getAllUnavailableSeatsOfaBus(id)


        res.status(200).json({
            success: true,
            message: 'get all unavailable seats of a bus Successfully',
            data: result,
        })
    }
    catch (error) {
        next(error)
    }
}

export const bookingController = {
    createBooking,
    getAllUnavailableSeatsOfaBus,

}