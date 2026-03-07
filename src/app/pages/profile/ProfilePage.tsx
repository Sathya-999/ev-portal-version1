
import React, { useState } from 'react';
import { dbService, User } from '../../services/dbService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { User as UserIcon, Mail, Phone, Car } from 'lucide-react';

export const ProfilePage: React.FC = () => {
    const user = dbService.getCurrentUser() as User;

    if (!user) {
        window.location.href = '/login';
        return null;
    }

    return (
        <div className="p-8 space-y-8 bg-slate-50 dark:bg-slate-900 min-h-screen flex justify-center">
            <Card className="w-full max-w-2xl shadow-2xl border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 p-10 text-white flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-5xl font-bold border-4 border-white/30 backdrop-blur-md">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center">
                        <CardTitle className="text-3xl font-bold uppercase tracking-tight">{user.name}</CardTitle>
                        <p className="text-blue-100 opacity-90 mt-1">EV Owner since {new Date(user.createdAt).getFullYear()}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6 bg-white dark:bg-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <Mail className="text-blue-600 w-6 h-6" />
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Email Address</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <Phone className="text-blue-600 w-6 h-6" />
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Phone Number</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{user.phone}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Car className="w-4 h-4" /> Registered Vehicles
                        </h3>
                        {user.vehicles.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {user.vehicles.map((v, i) => (
                                    <div key={i} className="p-4 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300">
                                        {v}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl italic">No vehicles registered yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
