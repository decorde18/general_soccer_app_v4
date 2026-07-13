import React from "react";
import Link from "next/link";
import {
  Users,
  Shield,
  Calendar,
  Trophy,
  Activity,
  MapPin,
  Map,
  ArrowRight,
  Building,
} from "lucide-react";
import { Card } from "@/components/ui/Card";

export default async function AdminDashboardPage() {
  const adminModules = [
    {
      title: "User Accounts",
      description:
        "Manage login credentials, profiles, passwords, and system administrator access levels.",
      route: "/admin/users",
      icon: Users,
      color:
        "from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-500",
    },
    {
      title: "Clubs & Teams",
      description:
        "Manage soccer club profiles, high school configurations, and create or edit active playing teams.",
      route: "/admin/clubs",
      icon: Building,
      color:
        "from-indigo-500/10 to-blue-500/10 border-indigo-500/20 text-indigo-500",
    },
    {
      title: "Club & Team Roles",
      description:
        "Assign club administrators, directors, head/assistant coaches, team managers, and stats keepers.",
      route: "/admin/club-staff",
      icon: Shield,
      color:
        "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-500",
    },
    {
      title: "Seasons Lifecycle",
      description:
        "Create, edit, and configure seasons, start/end dates, and lifecycle statuses (upcoming, active, etc.).",
      route: "/admin/seasons",
      icon: Calendar,
      color:
        "from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-500",
    },
    {
      title: "Leagues & Tournaments",
      description:
        "Configure the organizational hierarchy, divisions, conferences, and tournament brackets.",
      route: "/admin/leagues",
      icon: Activity,
      color:
        "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-500",
    },
    {
      title: "Governing Bodies",
      description:
        "Manage soccer associations, regional leagues, and governing organizations profiles.",
      route: "/governing-bodies",
      icon: Trophy,
      color:
        "from-yellow-500/10 to-amber-500/10 border-yellow-500/20 text-yellow-500",
    },
    {
      title: "Locations & Fields",
      description:
        "Configure stadium names, locations, and sublocation game fields or turf surfaces.",
      route: "/locations",
      icon: MapPin,
      color: "from-rose-500/10 to-red-500/10 border-rose-500/20 text-rose-500",
    },
    {
      title: "Addresses Directory",
      description:
        "Manage mail address profiles linked to clubs and soccer facilities.",
      route: "/addresses",
      icon: Map,
      color: "from-cyan-500/10 to-sky-500/10 border-cyan-500/20 text-cyan-500",
    },
  ];

  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8'>
      {/* Header Banner */}
      <div className='relative overflow-hidden rounded-2xl border border-border bg-surface/50 p-8 shadow-sm backdrop-blur-sm'>
        <div className='absolute inset-y-0 right-0 w-1/3 bg-linear-to-l from-primary/5 to-transparent pointer-events-none' />
        <div className='relative z-10 space-y-2'>
          <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider'>
            System Administration
          </span>
          <h1 className='text-3xl font-extrabold tracking-tight text-text'>
            Admin Management Portal
          </h1>
          <p className='text-muted text-sm max-w-2xl'>
            Welcome to the soccer app administration center. Choose an
            administrative module below to configure global settings, manage
            security roles, or configure league parameters.
          </p>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {adminModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              href={module.route}
              key={module.route}
              className='block group h-full'
            >
              <Card
                variant='hover'
                padding='lg'
                className='h-full border-border/80 bg-surface/50 hover:border-primary/40 flex flex-col justify-between transition-all duration-200'
              >
                <div className='space-y-4'>
                  {/* Icon Box */}
                  <div
                    className={`h-12 w-12 rounded-xl border flex items-center justify-center bg-linear-to-br ${module.color}`}
                  >
                    <Icon size={22} />
                  </div>

                  {/* Title & Desc */}
                  <div className='space-y-1.5'>
                    <h3 className='font-bold text-lg text-text group-hover:text-primary transition-colors flex items-center gap-1.5'>
                      <span>{module.title}</span>
                    </h3>
                    <p className='text-muted text-sm leading-relaxed'>
                      {module.description}
                    </p>
                  </div>
                </div>

                {/* Footer Link Button */}
                <div className='pt-6 mt-auto flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:translate-x-1.5 transition-transform duration-200'>
                  <span>Open Settings</span>
                  <ArrowRight size={14} />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
