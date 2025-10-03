

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "secretkey";

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Token manquant" });

  try {
    jwt.verify(token, SECRET_KEY);
    next();
  } catch {
    res.status(403).json({ error: "Token invalide" });
  }
};



// interface JwtPayloadCustom {
//   id: string;
//   email: string;
//   role: string;
// }

// export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) return res.status(401).json({ error: "Token manquant" });

//   try {
//     const payload = jwt.verify(token, SECRET_KEY) as JwtPayloadCustom;
//     req.user = payload; // maintenant TypeScript sait que req.user existe
//     next();
//   } catch {
//     res.status(403).json({ error: "Token invalide" });
//   }
// };
