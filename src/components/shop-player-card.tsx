'use client';

import { useState } from 'react';
import type { Player, User } from '@/lib/types';
import { useUser } from '@/context/user-context';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Shield, UserPlus, Loader2 } from 'lucide-react';
import { PlayerIcon } from './icons/player-icon';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

interface ShopPlayerCardProps {
  player: Player;
}

export function ShopPlayerCard({ player }: ShopPlayerCardProps) {
  const { user, allUsers, assignPlayer } = useUser();
  const { toast } = useToast();
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!player || !user) {
    return null;
  }
  
  const owner = allUsers.find(u => u.players.some(p => p.id === player.id));
  const isOwned = !!owner;
  const isOwnedByCurrentUser = owner?.id === user.id;

  const handleAssignPlayer = async () => {
    if (!selectedUserId) {
        toast({ title: "No user selected", description: "Please select a user to assign the player to.", variant: "destructive"});
        return;
    }
    
    const targetUser = allUsers.find(u => u.id === selectedUserId);
    if (!targetUser) {
        toast({ title: "User not found", variant: "destructive"});
        return;
    }

    setIsLoading(true);
    await assignPlayer(player, targetUser, owner);
    setIsLoading(false);
    setIsAssigning(false);
    setSelectedUserId(null);
  };
  
  const getButton = () => {
    if (isOwned) {
      return (
        <div className="w-full text-center text-sm text-muted-foreground py-2">
            Owned by: {owner.name}
        </div>
      );
    }
    return (
        <Button className="w-full bg-accent hover:bg-accent/90" onClick={() => setIsAssigning(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Player
        </Button>
    );
  }
  
  return (
    <>
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
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span className="font-semibold">{player.cost.toLocaleString()}</span>
                 <span className="text-xs">(Base Cost)</span>
            </div>
             <p className="text-xs text-muted-foreground">
                Peak MMR: {player.peak_mmr?.toLocaleString() || 'N/A'}
            </p>
        </CardContent>
        <CardFooter className="p-2 bg-secondary/50">
            {getButton()}
        </CardFooter>
    </Card>

    <Dialog open={isAssigning} onOpenChange={setIsAssigning}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Assign {player.name}</DialogTitle>
                <DialogDescription>
                    Select a user to give this player to for free. This will add the player to their bench.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="user-select">Assign to User</Label>
                 <Select onValueChange={setSelectedUserId} >
                    <SelectTrigger id="user-select">
                        <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                        {allUsers.filter(u => u.id !== owner?.id).map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAssignPlayer} disabled={!selectedUserId || isLoading}>
                    {isLoading && <Loader2 className="animate-spin mr-2"/>}
                    Confirm Assignment
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
