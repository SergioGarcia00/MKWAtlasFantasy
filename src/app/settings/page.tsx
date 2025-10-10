'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [isRecalculating, setIsRecalculating] = useState(false);
    
    useEffect(() => {
        if (user && user.id !== 'user-sipgb') {
            router.push('/');
        }
    }, [user, router]);

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
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <div>
                            <h4 className="font-semibold">Recalculate Player Market Prices</h4>
                            <p className="text-sm text-muted-foreground">This will apply a random variation of +/-10% to every player's cost based on their `peak_mmr`.</p>
                        </div>
                         <Button onClick={handleRecalculatePrices} disabled={isRecalculating} className="w-fit">
                            {isRecalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Recalculate Market Prices
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
