
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Week {
  id: string;
  name: string;
}

export default function SettingsPage() {
    const { user, allUsers, loadAllData } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isPayingOut, setIsPayingOut] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [selectedWeek, setSelectedWeek] = useState<string>('');

    const [selectedUser, setSelectedUser] = useState<string>('');
    const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);


    useEffect(() => {
        if (user && user.id !== 'user-sipgb') {
            router.push('/');
        }
        async function fetchWeeks() {
            try {
                const response = await fetch('/api/weeks');
                const data = await response.json();
                setWeeks(data);
                if (data.length > 0) {
                    setSelectedWeek(data[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch weeks", error);
            }
        }

        if (user?.id === 'user-sipgb') {
            fetchWeeks();
             if (allUsers.length > 0) {
                setSelectedUser(allUsers[0].id);
            }
        }
    }, [user, router, allUsers]);

    const handleUpdateCurrency = async (amount: number, isReset = false) => {
        if (!selectedUser) {
             toast({
                variant: 'destructive',
                title: 'No User Selected',
                description: 'Please select a user to update their currency.',
            });
            return;
        }
        setIsUpdatingCurrency(true);
        try {
            const response = await fetch(`/api/users/${selectedUser}/update-currency`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, isReset }),
            });
             if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update currency');
            }
            const result = await response.json();
             toast({
                title: 'Currency Updated!',
                description: `${result.name}'s new balance is ${result.currency.toLocaleString()}.`,
            });
            await loadAllData();

        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Error Updating Currency',
                description: error.message,
            });
        } finally {
            setIsUpdatingCurrency(false);
        }
    };


    const handleRecalculatePrices = async () => {
        setIsRecalculating(true);
        try {
            const response = await fetch('/api/market/recalculate-prices', { method: 'POST' });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to recalculate prices');
            }
            toast({
                title: 'Market Prices Recalculated!',
                description: 'Player costs have been updated league-wide.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Recalculating Prices',
                description: error.message,
            });
        } finally {
            setIsRecalculating(false);
        }
    };
    
    const handleAssignTeams = async () => {
        setIsAssigning(true);
        try {
            const response = await fetch('/api/users/assign-starter-teams', { method: 'POST' });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to assign starter teams');
            }
            const result = await response.json();
            toast({
                title: 'Starter Teams Assigned!',
                description: result.message,
            });
            await loadAllData();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Assigning Teams',
                description: error.message,
            });
        } finally {
            setIsAssigning(false);
        }
    };

    const handleWeeklyPayout = async () => {
        if (!selectedWeek) {
            toast({
                variant: 'destructive',
                title: 'No Week Selected',
                description: 'Please select a week to process payouts.',
            });
            return;
        }
        setIsPayingOut(true);
        try {
            const response = await fetch('/api/payouts/weekly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekId: selectedWeek }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to process weekly payout');
            }
            const result = await response.json();
            toast({
                title: 'Weekly Payout Successful!',
                description: result.message,
            });
            await loadAllData();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Processing Payout',
                description: error.message,
            });
        } finally {
            setIsPayingOut(false);
        }
    };

    const handleExportData = () => {
      window.location.href = '/api/data/export';
    };

    if (!user || user.id !== 'user-sipgb') {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold font-headline">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your application settings.
                </p>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Admin Settings</CardTitle>
                    <CardDescription>
                        Only visible to Sipgb. These actions are irreversible.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <h4 className="font-semibold">Manage User Currency</h4>
                        <p className="text-sm text-muted-foreground">Add funds to a user or reset their balance.</p>
                         <div className="flex items-center gap-4">
                            <div className="w-48">
                                <Label htmlFor="user-select">User</Label>
                                <Select onValueChange={setSelectedUser} value={selectedUser}>
                                    <SelectTrigger id="user-select">
                                        <SelectValue placeholder="Select a user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allUsers.map(u => (
                                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={() => handleUpdateCurrency(1000)} disabled={isUpdatingCurrency || !selectedUser} className="self-end">
                                {isUpdatingCurrency ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Add 1,000 Coins
                            </Button>
                             <Button onClick={() => handleUpdateCurrency(17000, true)} disabled={isUpdatingCurrency || !selectedUser} className="self-end" variant="secondary">
                                {isUpdatingCurrency ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Reset to 17k
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h4 className="font-semibold">Export Live Data</h4>
                        <p className="text-sm text-muted-foreground">Download a JSON file with the current state of all users, market, and weeks from the live application.</p>
                         <Button onClick={handleExportData} disabled={isExporting} className="w-fit">
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Export All Data
                        </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h4 className="font-semibold">Recalculate Player Market Prices</h4>
                        <p className="text-sm text-muted-foreground">This will apply a random variation of +/-10% to every player's cost based on their `peak_mmr`.</p>
                         <Button onClick={handleRecalculatePrices} disabled={isRecalculating} className="w-fit">
                            {isRecalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Recalculate Market Prices
                        </Button>
                    </div>
                     <div className="flex flex-col gap-2">
                        <h4 className="font-semibold">Assign Starter Teams</h4>
                        <p className="text-sm text-muted-foreground">This will assign a random team of 6 players to each user. It will reset all current rosters.</p>
                         <Button onClick={handleAssignTeams} disabled={isAssigning} className="w-fit">
                            {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Assign Starter Teams
                        </Button>
                    </div>
                     <div className="flex flex-col gap-2">
                        <h4 className="font-semibold">Weekly Payout</h4>
                        <p className="text-sm text-muted-foreground">Distribute weekly earnings to all users. Earnings are calculated as (Total Lineup Score / 2).</p>
                        <div className="flex items-center gap-4">
                            <div className="w-48">
                                <Label htmlFor="week-select">Week to Payout</Label>
                                <Select onValueChange={setSelectedWeek} value={selectedWeek}>
                                    <SelectTrigger id="week-select">
                                        <SelectValue placeholder="Select a week" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {weeks.map(week => (
                                            <SelectItem key={week.id} value={week.id}>{week.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleWeeklyPayout} disabled={isPayingOut || !selectedWeek} className="self-end">
                                {isPayingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Issue Payout for Week {selectedWeek}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
