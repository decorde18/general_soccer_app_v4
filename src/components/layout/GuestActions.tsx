import Link from "next/link";
import LoginButton from "@/components/ui/LoginButton";
import Button from "@/components/ui/Button";

export default function GuestActions() {
  return (
    <div className="flex items-center gap-2">
      <LoginButton />
      <Link href="/auth/register" className="inline-flex">
        <Button variant="secondary" size="sm">
          Register
        </Button>
      </Link>
    </div>
  );
}