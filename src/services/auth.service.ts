import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET ;

if (!SECRET_KEY) {
  throw new Error("JWT_SECRET is missing in .env");
}

export const generateToken = (payload: object) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET_KEY);
};
