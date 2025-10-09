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
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (user && user.id !== 'user-sipgb') {
            router.push('/');
        }
    }, [user, router]);

    const handleUpdateMarket = async () => {
        setIsUpdating(true);
        try {
            const response = await fetch('/api/players/update-market', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to update the market.');
            }

            toast({
                title: "Market Updated!",
                description: "Player MMRs and costs have been recalculated.",
            });
            
            // Optionally, force a reload to see changes immediately.
            window.location.reload();

        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Could not update the player market.",
            });
        } finally {
            setIsUpdating(false);
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
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold">Player Market Recalculation</h3>
                            <p className="text-sm text-muted-foreground">
                                This will randomly adjust every player's MMR by -2% to +2%, which will
                                automatically update their cost. This simulates market fluctuations.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleUpdateMarket} disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Recalculate Player Market
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
