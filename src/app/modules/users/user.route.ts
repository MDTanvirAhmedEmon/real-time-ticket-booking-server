import { Router } from "express";
import { customerController } from "./user.controller";
// import validateRequest from "../../middlewares/validateRequest";
// import { userValidationSchema } from "./user.validation";

const router = Router();

router.post('/create-user',
    // validateRequest(userValidationSchema),
     customerController.createCustomer)

export const UserRouter = router;