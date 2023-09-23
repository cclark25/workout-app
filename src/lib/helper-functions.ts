import { WorkoutSet } from 'src/components/data/workout-set';
import { Ref } from 'vue';

export function calculateOneRepMax(workoutSet: WorkoutSet) {
  return workoutSet.liftWeight * (1 + workoutSet.repCount / 30);
}

export function getWeightForRepGoal(
  targetRepCount: number,
  workoutSet: WorkoutSet
) {
  const oneRepMax = calculateOneRepMax(workoutSet);
  const result = oneRepMax / (1 + targetRepCount / 30);
  return result;
}

export function roundTo(value: number, decimalPlaces: number) {
  const displacement = Math.pow(10, decimalPlaces);
  return Math.round(value * displacement) / displacement;
}

export function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  const sum = values.reduce((p, c) => p + c, 0);
  const count = values.length;
  const avg = sum / count;
  console.log('values: ', { sum, count, avg, values });

  return avg;
}
