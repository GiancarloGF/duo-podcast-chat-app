export function getHighestConsecutiveCompleted(
  completedEpisodeNumbers: Set<number>
): number {
  let currentNumber = 1;

  while (completedEpisodeNumbers.has(currentNumber)) {
    currentNumber += 1;
  }

  return currentNumber - 1;
}

export function getCurrentEpisodeNumber(
  completedEpisodeNumbers: Set<number>
): number {
  return getHighestConsecutiveCompleted(completedEpisodeNumbers) + 1;
}
