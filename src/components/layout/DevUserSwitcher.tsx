import Select from "@/components/ui/Select";
import { DEV_USERS } from "@/lib/devUsers";


interface DevUserSwitcherProps {
  value: string;
  onChange: (e: any) => void;
}

export default function DevUserSwitcher({ value, onChange }: DevUserSwitcherProps) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="hidden lg:block mr-2">
      <Select
        options={[{ value: "", label: "Real User" }, ...DEV_USERS]}
        value={value}
        onChange={onChange}
        width="auto"
        className="min-w-[140px]"
        showPlaceholder={false}
      />
    </div>
  );
}