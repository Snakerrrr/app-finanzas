import { auth } from "@/auth"
import { getUserGroups } from "@/app/actions/family"
import { FamiliaClient } from "@/components/familia/familia-client"

export default async function FamiliaPage() {
  const session = await auth()
  const groups = await getUserGroups()

  return <FamiliaClient initialGroups={groups} currentUserId={session?.user?.id ?? ""} />
}
