'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Users, Hash, RefreshCw, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatAddress } from '@/lib/utils/formatters'
import type { StoreWithStaffCount, StoreAddress } from '@/lib/types/database'

interface StoreCardProps {
  store: StoreWithStaffCount
}

export function StoreCard({ store }: StoreCardProps) {

  return (
    <Link
      href={`/stores/${store.store_id}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden transition-all card-hover"
    >
      {/* Store Image */}
      <div className="relative h-40 bg-muted overflow-hidden">
        {store.store_img ? (
          <Image
            src={store.store_img}
            alt={store.store_name || 'Store'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-linear-to-br from-primary/20 to-primary/5">
            <span className="text-4xl font-bold text-primary/40">
              {store.store_name?.charAt(0).toUpperCase() || 'S'}
            </span>
          </div>
        )}
        {/* Status Badge */}
        {store.deleted_at && (
          <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-black bg-yellow-500 px-2 py-1 rounded-full shadow-sm">
            Archived
          </div>
        )}
      </div>

      {/* Store Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {store.store_name || 'Unnamed Store'}
          </h3>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="line-clamp-2">
            {formatAddress(store.store_address as StoreAddress | null)}
          </span>
        </div>

        {/* Active Staff */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-success">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium">{store.staff_count}</span>
          </div>
          <span className="text-muted-foreground">active staff</span>
        </div>
      </div>
    </Link>
  )
}
