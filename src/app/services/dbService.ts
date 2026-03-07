
// Simulated Browser-Based Database (LocalStorage)
const DB_KEY = 'ev_portal_users';
const SESSION_KEY = 'ev_portal_session';

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    password?: string;
    vehicles: string[];
    walletBalance: number;
    createdAt: string;
}

export const dbService = {
    getUsers: (): User[] => {
        const data = localStorage.getItem(DB_KEY);
        return data ? JSON.parse(data) : [];
    },
    
    saveUser: (user: User) => {
        const users = dbService.getUsers();
        users.push(user);
        localStorage.setItem(DB_KEY, JSON.stringify(users));
    },
    
    findUserByEmail: (email: string) => {
        return dbService.getUsers().find(u => u.email === email);
    },
    
    getCurrentUser: (): User | null => {
        const data = localStorage.getItem(SESSION_KEY);
        return data ? JSON.parse(data) : null;
    },
    
    setSession: (user: User) => {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    },
    
    clearSession: () => {
        localStorage.removeItem(SESSION_KEY);
    }
};
