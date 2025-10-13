'use client';

import { useState } from 'react';
import type { Player } from '@/lib/types';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Shield } from 'lucide-react';
import { PlayerIcon } from './icons/player-icon';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface ShopPlayerCardProps {
  player: Player;
}

export function ShopPlayerCard({ player }: ShopPlayerCardProps) {
  const { user, allUsers, purchasePlayerByPeakMmr } = useUser();
  const { toast } = useToast();

  if (!player || !user) {
    return null;
  }
  
  const owner = allUsers.find(u => u.players.some(p => p.id === player.id));
  const isOwned = !!owner;
  const isOwnedByCurrentUser = owner?.id === user.id;

  const purchasePrice = player.peak_mmr || player.cost;
  const isRosterFull = user.players.length >= 10;
  const canAfford = user.currency >= purchasePrice;

  const handlePurchase = () => {
    purchasePlayerByPeakMmr(player);
  };
  
  const getButton = () => {
    if (isOwned) {
      return <Button className="w-full" disabled variant={isOwnedByCurrentUser ? 'outline' : 'secondary'}>{isOwnedByCurrentUser ? 'You own this player' : `Owned by ${owner.name}`}</Button>;
    }

    if (isRosterFull) {
        return <Button className="w-full" disabled>Roster Full</Button>
    }
    
    if (!canAfford) {
        return <Button className="w-full" disabled>Insufficient Funds</Button>
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button className="w-full bg-accent hover:bg-accent/90">
                    Buy for {purchasePrice.toLocaleString()}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to purchase {player.name} for {purchasePrice.toLocaleString()} coins?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePurchase}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
  }
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col">
        <CardHeader className="p-4">
            <div className="relative bg-gradient-to-br from-primary/20 to-secondary p-6 flex items-center justify-center rounded-lg">
                {isOwned && (
                <Badge variant="secondary" className="absolute top-2 right-2 z-10">
                    <Shield className="w-3 h-3 mr-1"/>
                    Owned
                </Badge>
                )}
                <PlayerIcon iconName={player.icon} className="w-24 h-24 text-primary" />
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow">
            <h3 className="font-bold text-lg font-headline">{player.name}</h3>
            <div className="flex items-center gap-2 mt-2 text-primary">
                <DollarSign className="w-4 h-4" />
                <span className="font-semibold">{purchasePrice.toLocaleString()}</span>
            </div>
             <p className="text-xs text-muted-foreground">
                Peak MMR
            </p>
        </CardContent>
        <CardFooter className="p-2 bg-secondary/50">
            {getButton()}
        </CardFooter>
    </Card>
  );
}
