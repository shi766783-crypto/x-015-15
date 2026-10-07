import { computed } from 'vue'

const SCORE_DONE = 10 // 完成的烹饪记录每条得分
const SCORE_ATTEMPT = 3 // 未完成（进行中、失败等）的记录给鼓励分
const DONE_STATUS = ['完成', '已完成']

const borrowerOf = (entry) => (typeof entry?.borrower === 'string' ? entry.borrower.trim() : '')

export function useLeaderboard(state) {
  // 根据烹饪记录（state.usages）里的经办人、烹饪次数、完成情况重新计算榜单
  const leaderboard = computed(() => {
    const groups = new Map()
    for (const entry of state.usages ?? []) {
      const name = borrowerOf(entry)
      // 没有经办人的记录不计入任何成员的排名，由 unattributedCooks 单独提示
      if (!name) continue
      if (!groups.has(name)) groups.set(name, { name, total: 0, done: 0, score: 0, latest: '' })
      const group = groups.get(name)
      const finished = DONE_STATUS.includes(entry.status)
      group.total += 1
      if (finished) group.done += 1
      group.score += finished ? SCORE_DONE : SCORE_ATTEMPT
      if ((entry.date || '') > group.latest) group.latest = entry.date || ''
    }
    return [...groups.values()]
      .map((group) => ({
        ...group,
        completionRate: Math.round((group.done / group.total) * 100),
      }))
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.done - a.done ||
          b.total - a.total ||
          b.latest.localeCompare(a.latest) ||
          a.name.localeCompare(b.name, 'zh'),
      )
  })

  // 未填写经办人的烹饪记录，用于榜单底部的提示
  const unattributedCooks = computed(() =>
    (state.usages ?? []).filter((entry) => !borrowerOf(entry)),
  )

  return { leaderboard, unattributedCooks }
}
