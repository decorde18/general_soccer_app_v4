"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import LocationLink from "@/components/shared/LocationLink";
import { UnifiedCalendarItem } from "@/lib/actions/calendar-actions";

interface CalendarClientProps {
  initialItems: UnifiedCalendarItem[];
  teamSeasonId?: number;
  seasonName?: string;
}

type ViewMode = "month" | "agenda";

export default function CalendarClient({
  initialItems,
  teamSeasonId,
  seasonName,
}: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<UnifiedCalendarItem | null>(null);

  // Month navigation
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Filtered items
  const filteredItems = useMemo(() => {
    if (categoryFilter === "all") return initialItems;
    return initialItems.filter((item) => item.category === categoryFilter);
  }, [initialItems, categoryFilter]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: {
      date: Date;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      items: UnifiedCalendarItem[];
    }[] = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, daysInPrevMonth - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr,
        dayNumber: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        items: filteredItems.filter((item) => item.dateStr === dateStr),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(currentYear, currentMonth, i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        items: filteredItems.filter((item) => item.dateStr === dateStr),
      });
    }

    // Next month padding to fill complete weeks (up to 35 or 42)
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        items: filteredItems.filter((item) => item.dateStr === dateStr),
      });
    }

    return days;
  }, [currentYear, currentMonth, filteredItems]);

  const getCategoryBadgeClass = (category: UnifiedCalendarItem["category"]) => {
    switch (category) {
      case "game":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25";
      case "practice":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25";
      case "meeting":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25";
      case "camp":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/25";
      default:
        return "bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25";
    }
  };

  const getCategoryIcon = (category: UnifiedCalendarItem["category"]) => {
    switch (category) {
      case "game":
        return "⚽";
      case "practice":
        return "🏃";
      case "meeting":
        return "📋";
      case "camp":
        return "🏕️";
      default:
        return "📅";
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* 1. Header with Controls */}
      <Card className="border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Program Calendar
              </span>
              {seasonName && (
                <span className="text-xs text-muted font-medium">
                  • {seasonName}
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-text">
              {monthNames[currentMonth]} {currentYear}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Prev / Today / Next */}
            <div className="flex items-center rounded-lg border border-border bg-surface-elevated/80 p-0.5">
              <Button
                variant="outline"
                size="xs"
                onClick={handlePrevMonth}
                className="border-none shadow-none"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={handleToday}
                className="border-none shadow-none font-bold"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={handleNextMonth}
                className="border-none shadow-none"
              >
                <ChevronRight size={16} />
              </Button>
            </div>

            {/* View Switcher */}
            <div className="flex items-center rounded-lg border border-border bg-surface-elevated/80 p-0.5">
              <Button
                variant={viewMode === "month" ? "primary" : "outline"}
                size="xs"
                onClick={() => setViewMode("month")}
                className={viewMode === "month" ? "" : "border-none shadow-none"}
              >
                <CalendarIcon size={14} className="mr-1" /> Month
              </Button>
              <Button
                variant={viewMode === "agenda" ? "primary" : "outline"}
                size="xs"
                onClick={() => setViewMode("agenda")}
                className={viewMode === "agenda" ? "" : "border-none shadow-none"}
              >
                <List size={14} className="mr-1" /> Agenda
              </Button>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            Filter:
          </span>
          {[
            { id: "all", label: "All Items" },
            { id: "game", label: "⚽ Matches" },
            { id: "practice", label: "🏃 Practices" },
            { id: "meeting", label: "📋 Meetings" },
            { id: "camp", label: "🏕️ Camps" },
            { id: "team_event", label: "📅 Events" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                categoryFilter === cat.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface-elevated text-muted hover:text-text hover:bg-surface-hover"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </Card>

      {/* 2. Month Grid View */}
      {viewMode === "month" && (
        <Card className="overflow-hidden border-border bg-surface shadow-md">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-border bg-surface-elevated/70 text-center text-xs font-bold uppercase tracking-wider text-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2.5">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border">
            {calendarDays.map((slot, idx) => (
              <div
                key={`day-${idx}`}
                className={`min-h-[110px] p-1.5 transition-colors sm:min-h-[130px] sm:p-2 ${
                  slot.isCurrentMonth
                    ? "bg-surface hover:bg-surface-hover/30"
                    : "bg-surface-elevated/30 opacity-40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      slot.isToday
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : slot.isCurrentMonth
                        ? "text-text"
                        : "text-muted"
                    }`}
                  >
                    {slot.dayNumber}
                  </span>
                  {slot.items.length > 0 && (
                    <span className="text-[10px] font-semibold text-muted">
                      {slot.items.length}
                    </span>
                  )}
                </div>

                {/* Day Items List */}
                <div className="mt-1.5 space-y-1">
                  {slot.items.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full truncate rounded border px-1.5 py-0.5 text-left text-[11px] font-medium transition-all ${getCategoryBadgeClass(
                        item.category
                      )}`}
                    >
                      <span className="mr-1">{getCategoryIcon(item.category)}</span>
                      <span className="font-bold">{item.timeDisplay}</span>{" "}
                      <span>{item.title}</span>
                    </button>
                  ))}
                  {slot.items.length > 3 && (
                    <button
                      onClick={() => setSelectedItem(slot.items[0])}
                      className="text-[10px] font-bold text-primary hover:underline block text-left px-1"
                    >
                      +{slot.items.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. Agenda View */}
      {viewMode === "agenda" && (
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card className="p-8 text-center border-border bg-surface">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted/50 mb-3" />
              <h3 className="text-base font-bold text-text">No calendar events found</h3>
              <p className="text-xs text-muted mt-1">
                No scheduled matches or team events match the selected criteria.
              </p>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden border-border bg-surface p-4 shadow-sm hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="flex flex-col items-center justify-center rounded-xl bg-surface-elevated border border-border p-2.5 min-w-[60px] text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        {new Date(item.startDatetime).toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <span className="text-xl font-extrabold text-text">
                        {new Date(item.startDatetime).getDate()}
                      </span>
                      <span className="text-[9px] font-bold text-muted">
                        {new Date(item.startDatetime).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getCategoryBadgeClass(
                            item.category
                          )}`}
                        >
                          {getCategoryIcon(item.category)} {item.categoryLabel}
                        </span>
                        {item.scoreDisplay && (
                          <span className="rounded bg-surface-elevated px-2 py-0.5 text-xs font-extrabold text-emerald-400">
                            Final: {item.scoreDisplay}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-1 text-base font-bold text-text">
                        {item.title}
                      </h2>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {item.timeDisplay}
                        </span>
                        {item.locationName && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {item.locationId ? (
                              <LocationLink
                                locationId={item.locationId}
                                locationName={item.locationName}
                              />
                            ) : (
                              item.locationName
                            )}
                            {item.sublocationName && ` (${item.sublocationName})`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center">
                    {item.sourceType === "game" && (
                      <Link
                        href={`/gamestats/${item.teamSeasonId || 1}/${item.sourceId}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="outline" size="xs">
                          Match Center <ArrowRight size={12} className="ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* 4. Event Details Modal */}
      {selectedItem && (
        <Modal
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.categoryLabel}
          size="md"
          footer={
            <div className="flex w-full items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </Button>
              {selectedItem.sourceType === "game" && (
                <Link
                  href={`/gamestats/${selectedItem.teamSeasonId || 1}/${selectedItem.sourceId}`}
                >
                  <Button variant="primary" size="sm">
                    Open Match Center <ExternalLink size={14} className="ml-1.5" />
                  </Button>
                </Link>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getCategoryBadgeClass(
                    selectedItem.category
                  )}`}
                >
                  {getCategoryIcon(selectedItem.category)} {selectedItem.categoryLabel}
                </span>
                {selectedItem.scoreDisplay && (
                  <span className="rounded bg-surface-elevated px-2 py-0.5 text-xs font-extrabold text-emerald-400">
                    Final Score: {selectedItem.scoreDisplay}
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-xl font-black text-text">
                {selectedItem.title}
              </h2>
            </div>

            <div className="rounded-lg border border-border bg-surface-elevated/50 p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-text">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span>
                  <strong>Date & Time:</strong> {new Date(selectedItem.startDatetime).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at {selectedItem.timeDisplay}
                </span>
              </div>

              {selectedItem.locationName && (
                <div className="flex items-center gap-2 text-text">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    <strong>Venue:</strong>{" "}
                    {selectedItem.locationId ? (
                      <LocationLink
                        locationId={selectedItem.locationId}
                        locationName={selectedItem.locationName}
                      />
                    ) : (
                      selectedItem.locationName
                    )}
                    {selectedItem.sublocationName && ` (${selectedItem.sublocationName})`}
                  </span>
                </div>
              )}
            </div>

            {selectedItem.description && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-1">
                  Description & Notes
                </h4>
                <div className="rounded-lg border border-border bg-surface p-3 text-xs text-text whitespace-pre-wrap leading-relaxed">
                  {selectedItem.description}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
