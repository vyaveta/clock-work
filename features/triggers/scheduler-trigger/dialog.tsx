"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getNextSchedulerOccurrence, normalizeSchedulerConfig, type SchedulerConfig, type SchedulerRepeat } from "./schedule-utils"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const weekDays = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
]

interface SchedulerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    value: SchedulerConfig
    onSave: (config: SchedulerConfig) => void
}

export const SchedulerDialog = ({ open, onOpenChange, value, onSave }: SchedulerDialogProps) => {
    const [startDate, setStartDate] = useState(value.startDate)
    const [repeat, setRepeat] = useState<SchedulerRepeat>(value.repeat)
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>(value.daysOfWeek)
    const [times, setTimes] = useState<string[]>(value.times)
    const [timezone, setTimezone] = useState(value.timezone)

    useEffect(() => {
        if (!open) return
        setStartDate(value.startDate)
        setRepeat(value.repeat)
        setDaysOfWeek(value.daysOfWeek)
        setTimes(value.times)
        setTimezone(value.timezone)
    }, [open, value])

    const toggleDay = (day: number, checked: boolean) => {
        setDaysOfWeek((current) =>
            checked ? [...new Set([...current, day])] : current.filter((value) => value !== day),
        )
    }

    const handleSave = () => {
        const config = normalizeSchedulerConfig({ startDate, repeat, daysOfWeek, times, timezone })
        if (!config) {
            toast.error("Check the date, time, timezone, and repeat days")
            return
        }
        if (!getNextSchedulerOccurrence(config, new Date())) {
            toast.error("Choose a future date and time for this schedule")
            return
        }

        onSave(config)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Schedule workflow</DialogTitle>
                    <DialogDescription>Choose when this workflow starts and how often it repeats.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="scheduler-start-date">Start date</Label>
                        <Input id="scheduler-start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="scheduler-repeat">Repeat</Label>
                        <select
                            id="scheduler-repeat"
                            value={repeat}
                            onChange={(event) => setRepeat(event.target.value as SchedulerRepeat)}
                            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                        >
                            <option value="once">Once</option>
                            <option value="daily">Every day</option>
                            <option value="weekly">Selected days each week</option>
                        </select>
                    </div>

                    {repeat === "weekly" && (
                        <fieldset className="grid gap-2">
                            <legend className="text-sm font-medium">Days of the week</legend>
                            <div className="flex flex-wrap gap-x-4 gap-y-3">
                                {weekDays.map((day) => (
                                    <label key={day.value} className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={daysOfWeek.includes(day.value)}
                                            onCheckedChange={(checked) => toggleDay(day.value, checked === true)}
                                        />
                                        {day.label}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    )}

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label>Run times</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => setTimes((current) => [...current, "09:00"])}>
                                <PlusIcon className="size-4" /> Add time
                            </Button>
                        </div>
                        <div className="grid gap-2">
                            {times.map((time, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        aria-label={`Run time ${index + 1}`}
                                        type="time"
                                        value={time}
                                        onChange={(event) => setTimes((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Remove run time"
                                        disabled={times.length === 1}
                                        onClick={() => setTimes((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                    >
                                        <Trash2Icon className="size-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="scheduler-timezone">Time zone</Label>
                        <Input id="scheduler-timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Asia/Kolkata" />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" onClick={handleSave}>Save schedule</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
