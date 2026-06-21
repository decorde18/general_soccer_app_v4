import Select from "@/components/ui/Select";
import { getActiveViewOptions } from "@/lib/navAccess";

interface ViewSwitcherProps {
  isAdmin?: boolean;
  value: string;
  onChange: (e: any) => void;
}

export default function ViewSwitcher({ isAdmin, value, onChange }: ViewSwitcherProps) {
  return (
    <div className="p-4 border-b border-border">
      <Select
        label="Switch View"
        options={getActiveViewOptions(isAdmin)}
        value={value}
        onChange={onChange}
        width="full"
        showPlaceholder={false}
      />
    </div>
  );
}