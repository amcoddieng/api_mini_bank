import type { Request, Response } from "express";
import { Collection, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { connectDB } from "../services/mongo.service.js";
import type { User } from "../models/user.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || "secretkey";
function generateNumeroCompte(): string {

  return crypto.randomBytes(6) // 6 bytes ~ 12 caractères hex
    .toString("base64")        // encodage base64
    .replace(/[^A-Z0-9]/gi, "") // garder que lettres/chiffres
    .slice(0, 8)                // max 8 caractères
    .toUpperCase();             // majuscules
}
// Fonction pour générer un numéro de compte unique
// function generateNumeroCompte(): string {
//   return crypto
//     .randomBytes(6)
//     .toString("base64")
//     .replace(/[^0-9]/g, "") // que des chiffres
//     .slice(0, 10);          // 10 chiffres max
// }

// Vérifie que l'utilisateur a le rôle autorisé


// Fonction pour générer un numéro unique
async function generateUniqueNumeroCompte(usersCollection: Collection<User>): Promise<string> {
  let numero: string;
  let exists = true;

  while (exists) {
    numero = generateNumeroCompte();
    const user = await usersCollection.findOne({ "compte.numeroCompte": numero });
    exists = !!user; // true si trouvé
  }

  return numero!;
}
// Création d'utilisateur
// export const createUser = async (req: Request, res: Response) => {
//   try {
//     const userInput: Omit<User, "block" | "compte"> & { password: string } = req.body;
//     const db = await connectDB();
//     const usersCollection: Collection<User> = db.collection("users");

//     // Vérifier unicité email
//     const emailExist = await usersCollection.findOne({ email: userInput.email });
//     if (emailExist) {
//       return res.status(400).json({ error: "Email déjà utilisé" });
//     }

//     // Vérifier unicité telephone
//     const telExist = await usersCollection.findOne({ telephone: userInput.telephone });
//     if (telExist) {
//       return res.status(400).json({ error: "Téléphone déjà utilisé" });
//     }
//   const password1 = "000"
//     // Hash du mot de passe
//     const hashedPassword = await bcrypt.hash(password1, 10);

//     // Générer un numéro de compte unique
//     const numeroCompteUnique = await generateUniqueNumeroCompte(usersCollection);

//     // Créer l'utilisateur complet
//     const user: User = {
//       ...userInput,
//       block: false,
//       compte: {
//         numeroCompte: numeroCompteUnique,
//         solde: 0,
//         motDePasse: hashedPassword,
//       },
//     };

//     // Insertion dans la collection users
//     const result = await usersCollection.insertOne(user);
//     const userId = result.insertedId;

//     // Selon le rôle, insérer dans la collection correspondante
//     if (user.role === "client") {
//       const clientsCollection: Collection<any> = db.collection("client");
//       await clientsCollection.insertOne({ userId });
//     } else if (user.role === "distributeur") {
//       const distributeursCollection: Collection<any> = db.collection("distributeur");
//       await distributeursCollection.insertOne({ userId });
//     }

//     res.json({ message: "Utilisateur créé", id: userId, numeroCompte: numeroCompteUnique });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Erreur création utilisateur" });
//   }
// };








export const createUser = async (req: Request, res: Response) => {
  try {
    const userInput: Omit<User, "block" | "compte" | "photo"> & { password: string } = req.body;
    const db = await connectDB();
    const usersCollection: Collection<User> = db.collection("users");

    // Vérifier unicité email
    const emailExist = await usersCollection.findOne({ email: userInput.email });
    if (emailExist) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    // Vérifier unicité téléphone
    const telExist = await usersCollection.findOne({ telephone: userInput.telephone });
    if (telExist) {
      return res.status(400).json({ error: "Téléphone déjà utilisé" });
    }

    // mot de passe par défaut
    const password1 = "000";
    const hashedPassword = await bcrypt.hash(password1, 10);

    // Générer un numéro de compte unique
    const numeroCompteUnique = await generateUniqueNumeroCompte(usersCollection);

    // Photo (si présente)
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    // Créer l'utilisateur complet
    const user: User = {
      ...userInput,
      photo, 
      block: false,
      compte: {
        numeroCompte: numeroCompteUnique,
        solde: 0,
        motDePasse: hashedPassword,
      },
    };

    // Insertion dans la collection users
    const result = await usersCollection.insertOne(user);
    const userId = result.insertedId;

    // Selon le rôle, insérer dans la collection correspondante
    if (user.role === "client") {
      const clientsCollection: Collection<any> = db.collection("client");
      await clientsCollection.insertOne({ userId: new ObjectId(userId) });
    } else if (user.role === "distributeur") {
      const distributeursCollection: Collection<any> = db.collection("distributeur");
      await distributeursCollection.insertOne({ userId: new ObjectId(userId) });
    }

    res.json({
      message: "Utilisateur créé",
      id: userId,
      numeroCompte: numeroCompteUnique,
      photo, // ✅ renvoi chemin photo
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur création utilisateur" });
  }
};










// Connexion (login)
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const db = await connectDB();
    const usersCollection: Collection<User> = db.collection("users");

    const user = await usersCollection.findOne({"email": email });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    // Vérifier si l'utilisateur est bloqué
    if (user.block) {
      return res.status(403).json({ error: "Compte bloqué, contactez l'administrateur" });
    }

    const valid = await bcrypt.compare(password, user.compte.motDePasse);
    if (!valid) return res.status(401).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign({ id: user._id,nom: user.nom,prenom:user.prenom,email: user.email, role:user.role, photo:user.photo,compte:user.compte.numeroCompte}, SECRET, { expiresIn: "1h" });
    res.json({ message: "Connexion réussie", token });
  } catch {
    res.status(500).json({ error: "Erreur de connexion" });
  }
};

// Lire tous les utilisateurs
export const getUsers = async (_req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const usersCollection: Collection<User> = db.collection("users");
    const users = await usersCollection.find().toArray();
    res.json(users);
  } catch {
    res.status(500).json({ error: "Erreur récupération utilisateurs" });
  }
};

// export const updateUser = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     // Si un fichier photo a été envoyé, on met à jour le champ photo
//     if (req.file) {
//       updateData.photo = `/uploads/${req.file.filename}`; // chemin relatif pour le frontend
//     }

//     // Si on modifie le mot de passe, on le hash
//     if (updateData.password) {
//       updateData.password = await bcrypt.hash(updateData.password, 10);
//     }

//     const db = await connectDB();
//     const usersCollection: Collection<User> = db.collection("users");

//     await usersCollection.updateOne(
//       { _id: new ObjectId(id) },
//       { $set: updateData }
//     );

//     const updatedUser = await usersCollection.findOne({ _id: new ObjectId(id) });
//     res.json({ user: updatedUser });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Erreur modification utilisateur" });
//   }
// };

// backend/controllers/userController.ts


export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // hash password si présent
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // si fichier photo uploadé
    if (req.file) {
      updateData.photo = `/uploads/${req.file.filename}`;
    }

    const db = await connectDB();
    const usersCollection: Collection = db.collection("users");
    await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    res.json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur modification utilisateur" });
  }
};

// // Modification
// export const updateUser = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     if (updateData.password) {
//       updateData.password = await bcrypt.hash(updateData.password, 10);
//     }

//     const db = await connectDB();
//     const usersCollection: Collection<User> = db.collection("users");
//     await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
// const updatedUser = await usersCollection.findOne({ _id: new ObjectId(id) });
// res.json({ user: updatedUser });

//   } catch {
//     res.status(500).json({ error: "Erreur modification utilisateur" });
//   }
// };

// Suppression
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await connectDB();
    const usersCollection: Collection<User> = db.collection("users");
    await usersCollection.deleteOne({ _id: new ObjectId(id) });

    res.json({ message: "Utilisateur supprimé" });
  } catch {
    res.status(500).json({ error: "Erreur suppression utilisateur" });
  }
};
// Suppression d'un ou plusieurs utilisateurs
export const deleteUsers = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body; // on attend un tableau d'IDs dans le corps de la requête

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Aucun ID fourni" });
    }

    // Filtre seulement les IDs valides
    const objectIds = ids.filter((id: string) => ObjectId.isValid(id)).map((id: string) => new ObjectId(id));

    if (objectIds.length === 0) {
      return res.status(400).json({ error: "Aucun ID valide fourni" });
    }

    const db = await connectDB();
    const usersCollection: Collection<User> = db.collection("users");

    const result = await usersCollection.deleteMany({ _id: { $in: objectIds } });

    res.json({ message: `${result.deletedCount} utilisateur(s) supprimé(s)` });
  } catch (error) {
    console.error("Erreur suppression utilisateurs :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
// Bloquer/Débloquer utilisateur(s)
export const blockUsers = async (req: Request, res: Response) => {
  try {
    let { ids, block } = req.body;
    const db = await connectDB();
    const usersCollection: Collection<User> = db.collection("users");

    // Si ids est une string → transforme en tableau
    if (!Array.isArray(ids)) {
      ids = [ids];
    }

    await usersCollection.updateMany(
      { _id: { $in: ids.map((id: string) => new ObjectId(id)) } },
      { $set: { block } }
    );

    res.json({ message: `Utilisateur(s) ${block ? "bloqué(s)" : "débloqué(s)"}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur blocage utilisateur(s)" });
  }
};


// Déconnexion (côté client : suppression du token)
export const logout = async (_req: Request, res: Response) => {
  res.json({ message: "Déconnexion réussie (supprimez le token côté client)" });
};
// nombre de user par categorie
export const getUserCounts = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const usersCollection: Collection<User> = db.collection("users");

    // Comptage par rôle
    const clientCount = await usersCollection.countDocuments({ role: "client" });
    const distributeurCount = await usersCollection.countDocuments({ role: "distributeur" });
    const agentCount = await usersCollection.countDocuments({ role: "agent" });

    return res.status(200).json({
      clients: clientCount,
      distributeurs: distributeurCount,
      agents: agentCount,
    });
  } catch (error) {
    console.error("Erreur lors du comptage des utilisateurs :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

  // function qui donne la liste des transactions
  export const getTransactionList = async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const transactionsCollection = db.collection("transactions");

      const transactions = await transactionsCollection.find().toArray();

      return res.status(200).json(transactions);
    } catch (error) {
      console.error("Erreur lors de la récupération des transactions :", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  };

// POST /depot
export const depot = async (req: Request, res: Response) => {
  const { compteDestinataire, montant, idCompteSource } = req.body;

  if (!montant || !compteDestinataire) {
    return res.status(400).json({ error: "Montant et compte destinataire requis" });
  }

  try {
    const db = await connectDB();
    const usersCollection = db.collection("users");
    const transactionsCollection = db.collection("transactions");

    const montantDebiter = montant;

    // Vérifier le compte source
    const compteSource = await usersCollection.findOne({ _id: new ObjectId(idCompteSource) });
    if (!compteSource) return res.status(404).json({ error: "Compte source introuvable" });
    
    // Vérification rôle source
    if (compteSource.role !== "agent") {
      return res.status(403).json({ error: "Le compte source doit être un agent" });
    }

    if (compteSource.compte.solde < montantDebiter) {
      return res.status(400).json({ error: "Solde insuffisant" });
    }

    // Vérifier le compte destinataire
    const compteDest = await usersCollection.findOne({ "compte.numeroCompte": compteDestinataire });
    if (!compteDest) return res.status(404).json({ error: "Compte destinataire introuvable" });

    // Vérification rôle destinataire
    if (compteDest.role !== "distributeur") {
      return res.status(403).json({ error: "Le compte destinataire doit être un distributeur" });
    }

    // Débit du compte source
    await usersCollection.updateOne(
      { _id: new ObjectId(idCompteSource) },
      { $inc: { "compte.solde": -montantDebiter } }
    );

    // Crédit du compte destinataire
    await usersCollection.updateOne(
      { _id: compteDest._id },
      { $inc: { "compte.solde": montant } }
    );

    // Enregistrer la transaction
    await transactionsCollection.insertOne({
      type: "depot",
      montant,
      frais: 0,
      idCompteSource: new ObjectId(idCompteSource),
      idCompteDestinataire: compteDest._id,
      etat: "reussi",
      dateTransaction: new Date(),
    });

    res.status(200).json({
      message: "Depot effectué avec succès",
      montantTransfere: montant,
      frais: 0,
      montantDebite: montantDebiter,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erreur lors du depot" });
  }
};


// annuler depot
// POST /annuler-depot
export const annulerDepot = async (req: Request, res: Response) => {
  const { idTransaction } = req.body;

  if (!idTransaction) {
    return res.status(400).json({ error: "ID de la transaction requis" });
  }

  try {
    const db = await connectDB();
    const usersCollection = db.collection("users");
    const transactionsCollection = db.collection("transactions");

    // Récupérer la transaction
    const transaction = await transactionsCollection.findOne({ _id: new ObjectId(idTransaction) });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction introuvable" });
    }

    if (transaction.type !== "depot") {
      return res.status(400).json({ error: "Seules les transactions de type 'depot' peuvent être annulées" });
    }

    if (transaction.etat === "annulé") {
      return res.status(400).json({ error: "Cette transaction est déjà annulée" });
    }

    const { montant, idCompteSource, idCompteDestinataire } = transaction;

    // Vérifier comptes
    const compteSource = await usersCollection.findOne({ _id: new ObjectId(idCompteSource) });
    const compteDest = await usersCollection.findOne({ _id: new ObjectId(idCompteDestinataire) });

    if (!compteSource || !compteDest) {
      return res.status(404).json({ error: "Compte introuvable" });
    }

    // Annulation : retirer l’argent du destinataire et rendre à la source
    await usersCollection.updateOne(
      { _id: compteDest._id },
      { $inc: { "compte.solde": -montant } }
    );

    await usersCollection.updateOne(
      { _id: compteSource._id },
      { $inc: { "compte.solde": montant } }
    );

    // Mettre à jour l’état de la transaction
    await transactionsCollection.updateOne(
      { _id: new ObjectId(idTransaction) },
      { $set: { etat: "annulé" } }
    );

    res.status(200).json({
      message: "Dépôt annulé avec succès",
      transactionAnnulee: idTransaction,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erreur lors de l'annulation du dépôt" });
  }
};

















export const creditAccount = async (req: Request, res: Response) => {
  try {
    const { numeroCompte, montant } = req.body;

    // validations basiques
    if (!numeroCompte) return res.status(400).json({ error: "numeroCompte requis" });
    if (montant === undefined || montant === null) return res.status(400).json({ error: "montant requis" });

    const value = Number(montant);
    if (Number.isNaN(value) || value <= 0) return res.status(400).json({ error: "montant invalide (doit être > 0)" });

    const db= await connectDB();
 // utilise la db par déFaut de ta connexion
    const usersCol = db.collection("users");

    // Met à jour le solde du compte correspondant au numeroCompte
    const result = await usersCol.findOneAndUpdate(
      { "compte.numeroCompte": numeroCompte },
      { $inc: { "compte.solde": value } },
      { returnDocument: "after" } // renvoie le document après mise à jour
    );

    if (!result.value) {
      return res.status(404).json({ error: "Compte introuvable" });
    }

    // Optionnel : enregistrer une transaction (facultatif)
    const transactions = db.collection("transactions");
    await transactions.insertOne({
      type: "credit_admin",
      montant: value,
      compteNumero: numeroCompte,
      date: new Date(),
      note: "Crédit manuel sans sécurité",
    });

    return res.status(200).json({
      message: "Crédit effectué",
      numeroCompte,
      nouveauSolde: result.value.compte?.solde ?? null,
    });
  } catch (err:any) {
    console.error("Erreur creditAccount:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
};
