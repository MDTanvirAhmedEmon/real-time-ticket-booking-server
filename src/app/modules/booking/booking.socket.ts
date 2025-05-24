import { Server } from "socket.io";
import { bookingServices } from "./booking.services";
import { Booking } from "./booking.model";


const initialBooking = (io: Server) => {
    const bookingNamespace = io.of('/booking');

    bookingNamespace.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // socket.on('createBooking', async (bookingData) => {
        //     console.log(bookingData);
        //     socket.emit('bookingCreated', { data: "paisi" });
        //     const result = await bookingServices.getAllUnavailableSeatsOfaBus(bookingData);
        //     socket.broadcast.emit('allUser', { data: "amio paisi" });

        // })

        socket.on('joinBusRoom', (busId) => {
            console.log(`Socket ${socket.id} joined bus room: ${busId}`);
            const parsedData = JSON.parse(busId);
            socket.join(parsedData?.bus);
        });

        socket.on('createBooking', async (bookingData) => {
            console.log('bookingData', bookingData);

            const parsedData = JSON.parse(bookingData);
            const busId = parsedData.bus;
            await bookingServices.createBooking(parsedData)
            const seats = await bookingServices.getAllUnavailableSeatsOfaBus(parsedData);
            bookingNamespace.to(busId).emit('busSeatsUpdated', seats);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            // You can perform any cleanup or logging here
        });
    });
};

export default initialBooking;
