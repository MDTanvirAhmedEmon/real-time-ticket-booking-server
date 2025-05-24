import { Types } from "mongoose";

export type IBooking = {
    bus: string // Real world => Types.ObjectId
    user: string
    seat: string
    locked?: boolean
    payment?: boolean
}