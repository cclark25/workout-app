import { DateTime } from 'luxon';
import { Serializer } from '../models';
import { Routine } from './routine';
declare const crypto: any;

export interface WorkoutSetSerial {
  repCount: number;
  liftWeight: number;
  recordTimestamp: number;
  weightUnits: 'lbs';
  uuid?: string;
  liftHeightCentimeters?: number;
}

export class WorkoutSet {
  constructor(
    public repCount: number,
    public liftWeight: number,
    public recordTimestamp: DateTime,
    public weightUnits: 'lbs' = 'lbs',
    public readonly uuid: string = crypto.randomUUID(),
    public liftHeightCentimeters: number | undefined = undefined
  ) {
    if (isNaN(repCount)) {
      throw Error('repCount is not a number!');
    }
    if (isNaN(liftWeight)) {
      throw Error('liftWeight is not a number!');
    }
  }

  public getEnergyEstimate(parentRoutine: Routine | undefined) {
    const meters =
      (this.liftHeightCentimeters ||
        parentRoutine?.configuration.liftHeightCentimeters ||
        30) / 100;
    return {
      unit: 'cal',
      // Convert lbs to Newtons
      value:
        (this.repCount * meters * this.liftWeight * 32.174 * 4.4482216153) /
        4184,
    };
  }
}

export class WorkoutSetSerializer
  implements Serializer<WorkoutSet, WorkoutSetSerial>
{
  public serialize(value: WorkoutSet) {
    const serial: WorkoutSetSerial = {
      uuid: value.uuid,
      repCount: value.repCount,
      liftWeight: value.liftWeight,
      weightUnits: value.weightUnits,
      recordTimestamp: value.recordTimestamp.toMillis(),
      liftHeightCentimeters: value.liftHeightCentimeters,
    };

    return serial;
  }

  public deserialize(source: WorkoutSetSerial): WorkoutSet {
    const set = new WorkoutSet(
      Number(source.repCount),
      Number(source.liftWeight),
      DateTime.fromMillis(source.recordTimestamp),
      source.weightUnits,
      source.uuid,
      source.liftHeightCentimeters
    );

    return set;
  }
}
