
import React, { useState, useEffect } from 'react';
import { dbService, User } from '../../services/dbService';
import { sortChargersByDistance, Charger, chargersData } from '../../utils/distanceAlgorithm';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { MapPin, Battery, IndianRupee, Zap } from 'lucide-react';

export const DashboardPage: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [nearbyChargers, setNearbyChargers] = useState<Charger[]>([]);
    const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

    useEffect(() => {
        const currentUser = dbService.getCurrentUser();
        const profileStr = localStorage.getItem("user_profile");
        const profile = profileStr ? JSON.parse(profileStr) : null;
        
        if (!currentUser && !profile) {
            window.location.href = "/signin";
            return;
        }

        if (!currentUser && profile) {
            // Bridge old profile to new User format if needed
            const bridgedUser: User = {
                id: "old-user",
                name: `${profile.firstName} ${profile.lastName}`,
                email: profile.email,
                phone: "Not Provided",
                vehicles: [],
                walletBalance: 0,
                createdAt: new Date().toISOString()
            };
            setUser(bridgedUser);
        } else {
            setUser(currentUser);
        }


        // Geolocation
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserLoc({ lat: latitude, lng: longitude });
                const sorted = sortChargersByDistance(latitude, longitude, chargersData);
                setNearbyChargers(sorted);
            },
            () => {
                // Fallback (Chennai Center)
                const sorted = sortChargersByDistance(13.0827, 80.2707, chargersData);
                setNearbyChargers(sorted);
            }
        );
    }, []);

    if (!user) return <div className="p-8 text-center text-xl">Loading Dashboard...</div>;

    return (
        <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Welcome, <span className="text-blue-600 dark:text-blue-400">{user.name}</span>
                    </h1>
                    <p className="text-slate-500">Ready for your next charge? Chennai looks clear today.</p>
                </div>
                <div className="flex gap-4">
                     <Card className="bg-blue-600 text-white border-0">
                        <CardContent className="py-2 px-4 flex items-center gap-2">
                            <IndianRupee className="w-5 h-5" />
                            <span className="text-lg font-bold">₹{user.walletBalance}</span>
                        </CardContent>
                    </Card>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Charger Discovery */}
                <Card className="col-span-full border-2 border-blue-100 shadow-xl overflow-hidden">
                    <CardHeader className="bg-blue-50 dark:bg-slate-800">
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="text-blue-600" />
                            Nearest Chargers (Within 10km)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y p-0">
                        {nearbyChargers.map(charger => (
                            <div key={charger.id} className="p-4 hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg">{charger.name}</h3>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {charger.distance?.toFixed(1)} km</span>
                                        <span className="flex items-center gap-1"><Battery className="w-3 h-3" /> {charger.connectorType}</span>
                                        <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> ₹{charger.pricePerKwh}/kWh</span>
                                    </div>
                                </div>
                                <div>
                                    {charger.availableCapacity > 0 ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                            {charger.availableCapacity}/{charger.totalCapacity} Slots Free
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider">Station Full</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
