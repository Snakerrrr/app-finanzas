"use client"

import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { FamiliaClient } from "@/components/familia/familia-client"

export default function FamiliaPage() {
  const { user } = useAuth()
  const { familyGroups } = useData()

  return <FamiliaClient initialGroups={familyGroups} currentUserId={user?.id ?? ""} />
}
