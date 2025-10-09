'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsPage() {
    const { user } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (user && user.id !== 'user-sipgb') {
            router.push('/');
        }
    }, [user, router]);

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
                        Only visible to Sipgb.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Welcome to the admin settings panel.</p>
                </CardContent>
            </Card>
        </div>
    );
}
