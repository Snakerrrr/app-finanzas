"use server"

import * as tipsService from "@/lib/services/tips.service"

export async function getDailyTip() {
  return tipsService.getDailyTip()
}

export async function getRandomTips(count: number = 3) {
  return tipsService.getRandomTips(count)
}
