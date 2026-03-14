"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserGroups } from "@/app/actions/family"
import { FamiliaClient } from "@/components/familia/familia-client"
import type { FamilyGroupForClient } from "@/lib/services/family.service"

export default function FamiliaPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<FamilyGroupForClient[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getUserGroups().then((data) => {
      setGroups(data)
      setLoaded(true)
    })
  }, [])

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grupos Familiares</h1>
          <p className="text-muted-foreground">Comparte y gestiona finanzas en grupo</p>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted/60" />
          ))}
        </div>
      </div>
    )
  }

  return <FamiliaClient initialGroups={groups} currentUserId={user?.id ?? ""} />
}
