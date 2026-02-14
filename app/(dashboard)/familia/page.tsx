import { getUserGroups } from "@/app/actions/family"
import { FamiliaClient } from "@/components/familia/familia-client"

export default async function FamiliaPage() {
  const groups = await getUserGroups()

  return <FamiliaClient initialGroups={groups} />
}
