'use client';

import { Player, WeeklyScore } from '@/lib/types';
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
import { ArrowDown, ArrowUp, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


interface RosterPlayerCardProps {
  player: Player;
  isLineup: boolean;
  onMove: (player: Player) => void;
  onSell: (player: Player) => void;
  canMoveToLineup: boolean;
}

interface Week {
  id: string;
  name: string;
}

const scoreSchema = z.object({
  weekId: z.string(),
  race1: z.coerce.number().min(12, 'Min score is 12').max(180, 'Max score is 180'),
  race2: z.coerce.number().min(12, 'Max score is 180'),
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
  const { user, updateWeeklyScores } = useUser();
  const [selectedWeek, setSelectedWeek] = useState('1');
  const [weeks, setWeeks] = useState<Week[]>([]);

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
      race1: user?.weeklyScores?.[player.id]?.['1']?.race1 || 12,
      race2: user?.weeklyScores?.[player.id]?.['1']?.race2 || 12,
    },
  });

  const handleWeekChange = (weekId: string) => {
    setSelectedWeek(weekId);
    form.setValue('weekId', weekId);
    form.setValue('race1', user?.weeklyScores?.[player.id]?.[weekId]?.race1 || 12);
    form.setValue('race2', user?.weeklyScores?.[player.id]?.[weekId]?.race2 || 12);
  }

  const onSubmit = (values: z.infer<typeof scoreSchema>) => {
    if (!user) return;
    updateWeeklyScores(player.id, values.weekId, { race1: values.race1, race2: values.race2 });
  };
  
  const moveButtonDisabled = isLineup ? false : !canMoveToLineup;
  const moveButtonTooltip = isLineup ? '' : !canMoveToLineup ? 'Lineup is full (6 players max)' : '';

  const sellPrice = Math.round(player.cost * 0.5);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <PlayerIcon iconName={player.icon} className="w-12 h-12 text-primary" />
            <div>
              <h3 className="font-bold font-headline">{player.name}</h3>
              <p className="text-sm text-muted-foreground">{isLineup ? 'In Lineup' : 'On Bench'}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <TooltipProvider>
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="destructive" className="w-8 h-8">
                          <DollarSign className="w-4 h-4"/>
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Vender jugador</p>
                  </TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Seguro que quieres vender a {player.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Recibirás {sellPrice.toLocaleString()} monedas (50% del coste original). Esta acción es irreversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onSell(player)}>Confirmar Venta</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                      size="icon"
                      variant="outline"
                      onClick={() => onMove(player)}
                      disabled={moveButtonDisabled}
                      className="w-8 h-8"
                  >
                      {isLineup ? <ArrowDown className="w-4 h-4"/> : <ArrowUp className="w-4 h-4"/>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{moveButtonTooltip || (isLineup ? 'Mover al Banquillo' : 'Mover a la Alineación')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
      </CardContent>
      { isLineup && (
        <Accordion type="single" collapsible className="bg-secondary/50">
            <AccordionItem value="scores" className="border-t">
            <AccordionTrigger className="px-4 py-2 text-sm hover:no-underline">Update Weekly Scores</AccordionTrigger>
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
