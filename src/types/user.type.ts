// src/types/user.type.ts

export type UserRole = 'GESTIONNAIRE_DE_STOCK' | 'ADMIN' | 'USER' | string;

export interface User {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: UserRole;
}