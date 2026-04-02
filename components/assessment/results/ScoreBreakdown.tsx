'use client'

import { useState } from 'react'
import type { ScoreBreakdown as ScoreBreakdownType } from '@/lib/types/results'
import styles from './ScoreBreakdown.module.css'

export interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType[]
  totalScore: number
  maxScore: number
}

/** Group breakdown items by category */
function groupByCategory(
  items: ScoreBreakdownType[],
): Map<string, ScoreBreakdownType[]> {
  const groups = new Map<string, ScoreBreakdownType[]>()
  for (const item of items) {
    const existing = groups.get(item.category) ?? []
    existing.push(item)
    groups.set(item.category, existing)
  }
  return groups
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ScoreBreakdown({
  breakdown,
  totalScore,
  maxScore,
}: ScoreBreakdownProps) {
  const groups = groupByCategory(breakdown)
  const categories = Array.from(groups.keys())
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const totalPercent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  return (
    <div className={styles.container}>
      <div className={styles.totalHeader}>
        <h4 className={styles.totalLabel}>Total Score</h4>
        <span className={styles.totalValue}>
          {totalScore}/{maxScore} ({totalPercent}%)
        </span>
      </div>

      <div className={styles.totalTrack}>
        <div
          className={styles.totalFill}
          style={{ width: `${totalPercent}%` }}
        />
      </div>

      <div className={styles.categories} role="list">
        {categories.map((category) => {
          const items = groups.get(category)!
          const isOpen = openCategories.has(category)
          const categoryPoints = items.reduce((s, i) => s + i.points, 0)
          const categoryMax = items.reduce((s, i) => s + i.maxPoints, 0)
          const categoryId = `score-category-${category.replace(/\s+/g, '-').toLowerCase()}`

          return (
            <div key={category} className={styles.categoryGroup} role="listitem">
              <button
                type="button"
                className={styles.categoryButton}
                onClick={() => toggleCategory(category)}
                aria-expanded={isOpen}
                aria-controls={categoryId}
              >
                <ChevronIcon open={isOpen} />
                <span className={styles.categoryName}>{category}</span>
                <span className={styles.categoryScore}>
                  {categoryPoints}/{categoryMax}
                </span>
              </button>

              {isOpen && (
                <div
                  id={categoryId}
                  className={styles.factorList}
                  role="list"
                >
                  {items.map((item, idx) => {
                    const factorPercent =
                      item.maxPoints > 0
                        ? Math.round((item.points / item.maxPoints) * 100)
                        : 0
                    return (
                      <div
                        key={`${item.factor}-${idx}`}
                        className={styles.factor}
                        role="listitem"
                      >
                        <div className={styles.factorHeader}>
                          <span className={styles.factorName}>
                            {item.factor}
                          </span>
                          <span className={styles.factorScore}>
                            {item.points}/{item.maxPoints}
                          </span>
                        </div>
                        <div className={styles.miniTrack}>
                          <div
                            className={styles.miniFill}
                            style={{ width: `${factorPercent}%` }}
                          />
                        </div>
                        {item.explanation && (
                          <p className={styles.factorExplanation}>
                            {item.explanation}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
