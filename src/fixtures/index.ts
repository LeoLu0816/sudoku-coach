import type { Difficulty, TechniqueId } from '@/types'

import { fixturePuzzles, type FixturePuzzle } from './puzzles'
import { techniqueScenarios, type TechniqueScenario } from './techniqueScenarios'

export { fixturePuzzles, techniqueScenarios }
export type { FixturePuzzle, TechniqueScenario }

/** 依 ID 取單題，方便測試與後續功能共用同一份 fixture。 */
export function getPuzzle(id: string): FixturePuzzle | undefined {
  return fixturePuzzles.find((puzzle) => puzzle.id === id)
}

/** 依難度篩出所有完整題目 fixture。 */
export function getPuzzlesByDifficulty(difficulty: Difficulty): FixturePuzzle[] {
  return fixturePuzzles.filter((puzzle) => puzzle.difficulty === difficulty)
}

/** 依技巧篩出所有專屬場景，供技巧 solver 測試直接取用。 */
export function getScenariosFor(technique: TechniqueId): TechniqueScenario[] {
  return techniqueScenarios.filter((scenario) => scenario.technique === technique)
}
