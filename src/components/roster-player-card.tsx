'use client';

import { Player } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerIcon } from './icons/player-icon';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from './ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { useUser } from '@/context/user-context';
import { ArrowRightLeft, Banknote, DollarSign, Loader2, Link as LinkIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import Link from 'next/link';

interface RosterPlayerCardProps {
  player: Player;
  isLineup: boolean;
  onMove: (player: Player, isCurrentlyInLineup: boolean) => void;
  onSell: (player: Player) => void;
  canMoveToLineup: boolean;
}

interface Week {
  id: string;
  name: string;
}

const scoreSchema = z.object({
  weekId: z.string(),
  race1: z.coerce.number().min(0, 'Min score is 0').max(180, 'Max score is 180'),
  race2: z.coerce.number().min(0, 'Max score is 0').max(180, 'Max score is 180'),
});

async function fetchWeeks(): Promise<Week[]> {
    try {
      const response = await fetch('/api/weeks');
      if (!response.ok) {
        console.error('Failed to fetch weeks');
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching weeks:', error);
      return [];
    }
  }

export function RosterPlayerCard({ player, isLineup, onMove, onSell, canMoveToLineup }: RosterPlayerCardProps) {
  const { user, updateWeeklyScores, increaseBuyoutClause } = useUser();
  const [selectedWeek, setSelectedWeek] = useState('1');
  const [weeks, setWeeks] = useState<Week[]>([]);
  
  const [isClauseDialogOpen, setIsClauseDialogOpen] = useState(false);
  const [clauseInvestment, setClauseInvestment] = useState(0);
  const [isInvesting, setIsInvesting] = useState(false);

  useEffect(() => {
    const loadWeeks = async () => {
        const weeksData = await fetchWeeks();
        setWeeks(weeksData);
    };
    loadWeeks();
  }, [])

  const form = useForm<z.infer<typeof scoreSchema>>({
    resolver: zodResolver(scoreSchema),
    defaultValues: {
      weekId: '1',
      race1: user?.weeklyScores?.[player.id]?.['1']?.race1 || 0,
      race2: user?.weeklyScores?.[player.id]?.['1']?.race2 || 0,
    },
  });
  
  const userPlayer = user?.players.find(p => p.id === player.id);
  const currentInvestment = userPlayer?.clauseInvestment || 0;
  const sellPrice = userPlayer?.purchasePrice || player.cost;
  const currentBuyoutClause = sellPrice + (currentInvestment * 2);

  const handleWeekChange = (weekId: string) => {
    setSelectedWeek(weekId);
    form.setValue('weekId', weekId);
    form.setValue('race1', user?.weeklyScores?.[player.id]?.[weekId]?.race1 || 0);
    form.setValue('race2', user?.weeklyScores?.[player.id]?.[weekId]?.race2 || 0);
  }

  const onSubmit = (values: z.infer<typeof scoreSchema>) => {
    if (!user) return;
    updateWeeklyScores(player.id, values.weekId, { race1: values.race1, race2: values.race2 });
  };
  
  const handleClauseInvestment = async () => {
    if (clauseInvestment <= 0) return;
    setIsInvesting(true);
    await increaseBuyoutClause(player.id, clauseInvestment);
    setIsInvesting(false);
    setIsClauseDialogOpen(false);
    setClauseInvestment(0);
  };

  const moveButtonDisabled = isLineup ? false : !canMoveToLineup;
  const moveButtonTooltip = isLineup ? 'Move to Bench' : !canMoveToLineup ? 'Lineup is full' : 'Move to Lineup';
  
  return (
    <Card className="overflow-hidden bg-background">
      <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <PlayerIcon iconName={player.icon} className="w-12 h-12 text-primary" />
              {isLineup && (
                <div className="absolute top-0 right-0 -mr-1 -mt-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background" title="In Starting Lineup"></div>
              )}
            </div>
            <div>
              <h3 className="font-bold font-headline">{player.name}</h3>
              <p className="text-sm text-muted-foreground">{player.mmr?.toLocaleString()} MMR</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              {player.registry_url && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild size="icon" variant="ghost" className="w-8 h-8 text-blue-500 hover:bg-blue-500/10 hover:text-blue-500">
                           <Link href={player.registry_url} target="_blank">
                                <LinkIcon className="w-4 h-4" />
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>View on MKCentral Registry</p>
                    </TooltipContent>
                </Tooltip>
              )}
              <Dialog open={isClauseDialogOpen} onOpenChange={setIsClauseDialogOpen}>
                <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="w-8 h-8 text-green-600 hover:bg-green-500/10 hover:text-green-600">
                            <Banknote className="w-4 h-4"/>
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Increase Buyout Clause</p>
                    </TooltipContent>
                </Tooltip>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Increase Buyout Clause for {player.name}</DialogTitle>
                        <DialogDescription>
                            Invest your coins to make it more expensive for other users to buy out this player. For every 1 coin you invest, the buyout clause increases by 2.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Current Buyout Price</p>
                        <p className="text-3xl font-bold">{currentBuyoutClause.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">({(userPlayer?.purchasePrice || player.cost).toLocaleString()} base + {(currentInvestment * 2).toLocaleString()} from investment)</p>
                      </div>
                      <div>
                        <Label htmlFor="investment">Amount to Invest</Label>
                        <Input 
                          id="investment"
                          type="number"
                          value={clauseInvestment}
                          onChange={e => setClauseInvestment(Number(e.target.value))}
                          min={0}
                          max={user?.currency || 0}
                        />
                         <p className="text-xs text-muted-foreground mt-1">Your balance: {(user?.currency || 0).toLocaleString()} coins.</p>
                      </div>
                       <div className="p-4 bg-primary/10 text-primary rounded-lg text-center">
                        <p className="text-sm">New Buyout Price</p>
                        <p className="text-3xl font-bold">{(currentBuyoutClause + (clauseInvestment * 2)).toLocaleString()}</p>
                      </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleClauseInvestment} disabled={isInvesting || clauseInvestment <= 0 || (user && user.currency < clauseInvestment)}>
                           {isInvesting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                           Invest {clauseInvestment.toLocaleString()} Coins
                        </Button>
                    </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <DollarSign className="w-4 h-4"/>
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sell Player</p>
                  </TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to sell {player.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will receive {sellPrice.toLocaleString()} coins (your original purchase price). This action is irreversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onSell(player)}>Confirm Sale</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => onMove(player, isLineup)}
                        disabled={moveButtonDisabled}
                        className="w-8 h-8"
                    >
                        <ArrowRightLeft className="w-4 h-4"/>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{moveButtonTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
      </CardContent>
      { isLineup && (
        <Accordion type="single" collapsible className="bg-secondary/50">
            <AccordionItem value="scores" className="border-t">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold hover:no-underline">Update Weekly Scores</AccordionTrigger>
            <AccordionContent className="p-4">
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="weekId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Week</FormLabel>
                        <Select onValueChange={handleWeekChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a week" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {weeks.map(week => (
                                <SelectItem key={week.id} value={week.id}>Week {week.id}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="race1"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Race 1 Score</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="race2"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Race 2 Score</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                    <Button type="submit" size="sm" className="w-full">Save Scores</Button>
                </form>
                </Form>
            </AccordionContent>
            </AccordionItem>
        </Accordion>
      )}
    </Card>
  );
}
