declare const JWT_SECRET: string;
interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    company: string;
}
export declare const generateToken: (payload: TokenPayload) => string;
export declare const verifyToken: (token: string) => TokenPayload | null;
export { JWT_SECRET };
