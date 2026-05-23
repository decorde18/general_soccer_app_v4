"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function LoginButton() {
  return (
    <Link href='/login' className='inline-flex'>
      <Button variant='outline' size='sm'>
        Login
      </Button>
    </Link>
  );
}
