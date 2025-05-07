// src/models/User.ts
export interface User {
    id: string;
    username: string;
    balance: number;
    createdAt: number;
    lastLogin: number;
}

export interface UserBet {
    userId: string;
    username: string;
    gameId: string;
    amount: number;
    autoCashoutAt: number | null;
    cashedOutAt: number | null;
    profit: number | null;
    timestamp: number;
}