"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen w-full flex-col items-center justify-center bg-gray-100 p-4 text-center">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold text-red-600">Something went wrong!</h1>
          <p className="text-gray-600">
            A critical error occurred in the application.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => reset()}
              className="rounded bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 transition"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
