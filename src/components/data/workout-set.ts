import { DateTime } from 'luxon';
import { Serializer } from '../models';
declare const crypto: any;

export interface WorkoutSetSerial {
  repCount: number;
  liftWeight: number;
  recordTimestamp: number;
  weightUnits: 'lbs';
  uuid?: string;
}

export class WorkoutSet {
  constructor(
    public repCount: number,
    public liftWeight: number,
    public recordTimestamp: DateTime,
    public weightUnits: 'lbs' = 'lbs',
    public readonly uuid: string = crypto.randomUUID()
  ) {
    if (isNaN(repCount)) {
      throw Error('repCount is not a number!');
    }
    if (isNaN(liftWeight)) {
      throw Error('liftWeight is not a number!');
    }
  }

  public getEnergyEstimate() {
    const meters = 0.3;
    return {
      unit: 'cal',
      // Estimate a rep to be 30 cm and convert lbs to Newtons
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
    return {
      ...value,
      repCount: value.repCount,
      liftWeight: value.liftWeight,
      weightUnits: value.weightUnits,
      recordTimestamp: value.recordTimestamp.toMillis(),
    };
  }

  public deserialize(source: WorkoutSetSerial): WorkoutSet {
    const set = new WorkoutSet(
      Number(source.repCount),
      Number(source.liftWeight),
      DateTime.fromMillis(source.recordTimestamp),
      source.weightUnits,
      source.uuid
    );

    return set;
  }
}
