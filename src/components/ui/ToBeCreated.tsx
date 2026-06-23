"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Construction, ArrowLeft, Home, Compass } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface ToBeCreatedProps {
  title?: string;
  description?: string;
}

export default function ToBeCreated({
  title = "Coming Soon",
  description = "This page is currently under development. Our team is building something amazing here. Please check back later!",
}: ToBeCreatedProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Background radial soft light */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden opacity-30">
        <div className="h-[400px] w-[400px] rounded-full bg-primary/20 blur-[80px]" />
      </div>

      <Card
        variant="default"
        padding="lg"
        shadow={true}
        className="relative max-w-md w-full border-border/80 bg-surface/60 backdrop-blur-xl text-center overflow-hidden"
      >
        {/* Animated accent border top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-purple animate-pulse" />

        {/* Animated Construction Icon Sphere */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner border border-primary/20 relative">
          <div className="absolute inset-0 rounded-3xl bg-primary/5 animate-ping opacity-75" />
          <Construction size={40} className="relative z-10 animate-bounce" />
        </div>

        {/* Heading & Text */}
        <h1 className="bg-gradient-to-r from-text via-primary to-accent bg-clip-text text-3xl font-extrabold tracking-tight text-transparent mb-2">
          {title}
        </h1>
        
        <p className="text-base text-muted/90 leading-relaxed mb-8 max-w-sm mx-auto">
          {description}
        </p>

        {/* Interactive Features List Placeholder */}
        <div className="border border-border/60 bg-background/50 rounded-xl p-4 mb-8 text-left space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Features under construction:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-text/80">
            <div className="flex items-center gap-2">
              <Compass size={14} className="text-primary" />
              <span>Interactive Data</span>
            </div>
            <div className="flex items-center gap-2">
              <Compass size={14} className="text-primary" />
              <span>Slick Charts</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => router.back()}
            className="w-full sm:w-auto flex flex-row items-center gap-2 py-2.5 px-4"
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              className="w-full flex flex-row items-center gap-2 py-2.5 px-4"
            >
              <Home size={16} />
              <span>Return Home</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
