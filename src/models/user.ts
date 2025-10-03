export interface User {
  nom: string;
  prenom: string;
  email: string;
  telephone: number;
  nin: number;
  passeport: string;
  adresse:string;
  block: boolean;
  role: string;
  photo:any;
  compte: {
    numeroCompte: string;
    solde: number;
    motDePasse: string;
  };
}
