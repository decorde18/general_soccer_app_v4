// Inside PlayerRow.jsx
import Button from "@/components/ui/Button";
import { useState, useRef, useEffect } from "react";

function PlayerRow({ player, handleStatus, section, starterLength }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropUp, setDropUp] = useState(false); // New state for direction
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Detect if dropdown should open upwards
  const handleToggle = (e) => {
    // 1. Get the button's position
    const rect = e.currentTarget.getBoundingClientRect();

    // 2. Find the scrolling container (the section div)
    // We use the 'overflow-y-auto' parent or a specific class
    const container = e.currentTarget.closest(".overflow-y-auto");

    if (container) {
      const containerRect = container.getBoundingClientRect();
      // Calculate space between button bottom and container bottom
      const spaceBelow = containerRect.bottom - rect.bottom;

      // Set to true if space is less than the dropdown height (~180px)
      setDropUp(spaceBelow < 180);
    } else {
      // Fallback to window logic if no scroll container is found
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 180);
    }

    setShowDropdown(!showDropdown);
  };
  const getActionsBySection = (section, playerStatus) => {
    const actions = [];

    if (section === "available") {
      actions.push(
        { label: "Start", gameStatus: "starter", variant: "primary" },
        { label: "Bench", gameStatus: "dressed", variant: "muted" }
      );
    }

    if (section === "starters") {
      actions.push(
        {
          label: "GK",
          gameStatus: "goalkeeper",
          variant: playerStatus === "goalkeeper" ? "success" : "muted",
        },
        { label: "Bench", gameStatus: "dressed", variant: "muted" }
      );
    }

    if (section === "bench") {
      actions.push({
        label: "Start",
        gameStatus: "starter",
        variant: "primary",
      });
    }

    return actions;
  };

  const getSettingsOptions = (section, playerStatus) => {
    if (section === "starters" || section === "bench") {
      return [
        { label: "Not Dressed", value: "not_dressed" },
        { label: "Unavailable", value: "unavailable" },
        { label: "Injured", value: "injured" },
      ];
    }
    if (section === "available") {
      return [
        { label: "Dressed", value: "dressed" },
        { label: "Injured", value: "injured" },
        { label: "Unavailable", value: "unavailable" },
      ];
    }
    if (section === "unavailable") {
      const otherStatus =
        playerStatus === "injured" ? "unavailable" : "injured";
      return [
        {
          label: otherStatus === "injured" ? "Injured" : "Unavailable",
          value: otherStatus,
        },
        { label: "Dressed", value: "dressed" },
        { label: "Not Dressed", value: "not_dressed" },
      ];
    }
    return [];
  };

  const ActionButtons = () => {
    const actions = getActionsBySection(section, player.gameStatus);
    const settingsOptions = getSettingsOptions(section, player.gameStatus);

    return (
      <div className='flex gap-1.5 relative'>
        {actions.map((action) => (
          <Button
            key={action.gameStatus}
            size='xs'
            variant={action.variant}
            onClick={() => handleStatus(player.id, action.gameStatus)}
            disabled={
              (starterLength === 11 && action.gameStatus === "starter") ||
              (action.gameStatus === "goalkeeper" && starterLength === 0)
            }
          >
            {action.label}
          </Button>
        ))}

        {settingsOptions.length > 0 && (
          <div ref={dropdownRef} className='relative'>
            <Button
              size='xs'
              variant='outline'
              className='px-1.5'
              onClick={handleToggle}
            >
              ⚙️
            </Button>

            {showDropdown && (
              <div
                className={`absolute px-2 right-0 z-50 min-w-[140px] py-2 bg-surface border border-border rounded-md shadow-xl ring-1 ring-black ring-opacity-5 
    ${dropUp ? "bottom-full mb-2" : "top-full mt-1"}`}
              >
                <div className='px-3 py-1 border-b border-border mb-2'>
                  <span className='text-[10px] uppercase tracking-wider font-bold text-muted'>
                    Move to:
                  </span>
                </div>
                <div className='flex flex-col space-y-1.5'>
                  {settingsOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant='outline'
                      size='xs'
                      /* Reduced vertical padding (py-1) and ensured full width */
                      className='w-full text-left px-3 py-1 text-xs transition-colors hover:bg-muted/50 text-text flex items-center justify-between border-none shadow-none group'
                      onClick={() => {
                        handleStatus(player.id, option.value);
                        setShowDropdown(false);
                      }}
                    >
                      {option.label}
                      <span className='text-[10px] opacity-0 group-hover:opacity-100 transition-opacity'>
                        →
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded-lg border-2 transition-all duration-200 ${
        player.gameStatus === "goalkeeper"
          ? "bg-success/5 border-success shadow-sm"
          : "bg-surface border-border hover:border-primary/50 hover:shadow-sm"
      }`}
    >
      <div className='flex items-center gap-3'>
        <div className='w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm'>
          {player.jerseyNumber}
        </div>
        <div className='flex flex-col'>
          <div className='text-sm font-semibold text-text leading-tight'>
            {player.fullName}
          </div>
          {section === "unavailable" && (
            <span className='text-[10px] font-bold text-danger/80 uppercase'>
              {player.gameStatus}
            </span>
          )}
        </div>
      </div>
      <ActionButtons />
    </div>
  );
}

export default PlayerRow;
