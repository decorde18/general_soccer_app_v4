"use client";

import { formatSecondsToMmss } from "@/lib/dateTimeUtils";
import useGameStore from "@/stores/gameStore";
import { useEffect, useState } from "react";

// Scoreboard.jsx
function LiveGameHeaderClock() {
  const getPeriodTime = useGameStore((s) => s.getPeriodTime);

  const [displayTime, setDisplayTime] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayTime(getPeriodTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [getPeriodTime]);

  return <div>{formatSecondsToMmss(displayTime)}</div>;
}

export default LiveGameHeaderClock;
