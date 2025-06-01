
export type IUser = {
    email: string;
    password: string;
    passwordChangedAt?: Date;
    role: "user";
    status: 'in-progress' | 'blocked';
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
}