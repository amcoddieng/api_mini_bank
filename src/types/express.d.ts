import type { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      _id: string;
      compte: {
        _id: string;
        numeroCompte: string;
        solde: number;
      };
      role: string;
      [key: string]: any; // pour les autres champs éventuels
    };
  }
}
