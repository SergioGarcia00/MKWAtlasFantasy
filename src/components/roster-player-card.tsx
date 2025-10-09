'use client';

import { Player, WeeklyScore } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerIcon } from './icons/player-icon';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { useUser } from '@/context/user-context';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState } from 'react';

interface RosterPlayerCardProps {
  player: Player;
  isLineup: boolean;
  onMove: (player: Player) => void;
  canMoveToLineup: boolean;
}

const scoreSchema = z.object({
  weekId: z.string(),
  race1: z.coerce.number().min(12, 'Min score is 12').max(180, 'Max score is 180'),
  race2: z.coerce.number().min(12, 'Min score is 12').max(180, 'Max score is 180'),
});

export function RosterPlayerCard({ player, isLineup, onMove, canMoveToLineup }: RosterPlayerCardProps) {
  const { user, updateWeeklyScores } = useUser();
  const [selectedWeek, setSelectedWeek] = useState('1');

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
    updateWeeklyScores(player.id, values.weekId, { race1: values.race1, race2: values.race2 });
  };
  
  const moveButtonDisabled = isLineup ? false : !canMoveToLineup;
  const moveButtonTooltip = isLineup ? '' : !canMoveToLineup ? 'Lineup is full (6 players max)' : '';

  const weekOptions = ['1', '2', '3', '4', '5']; // Example weeks

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <PlayerIcon iconName={player.icon} className="w-12 h-12 text-primary" />
            <div>
              <h3 className="font-bold font-headline">{player.name}</h3>
              <p className="text-sm text-muted-foreground">{isLineup ? 'In Lineup' : 'On Bench'}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMove(player)}
            disabled={moveButtonDisabled}
            title={moveButtonTooltip}
            className="gap-2"
          >
            {isLineup ? <><ArrowDown/> Move to Bench</> : <><ArrowUp/> Move to Lineup</>}
          </Button>
        </div>
      </CardContent>
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
                          {weekOptions.map(week => (
                            <SelectItem key={week} value={week}>Week {week}</SelectItem>
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
    </Card>
  );
}
