
import {
    Entity,
    PrimaryColumn,
    Column,
    OneToMany
} from "typeorm";

import { FeedingRecord } from "./FeedingRecord";
import { WaterRecord } from "./WaterRecord";
import { WaterDailyTarget } from "./WaterDailyTarget";

@Entity("cat_profile")
export class CatProfileEntity {

    @PrimaryColumn({ type: "integer" })
    id!: number;

    @Column({ type: "text" })
    name!: string;

    @Column({ type: "real" })
    age!: number;

    @Column({
        name: "weight_kg",
        type: "real"
    })
    weightKg!: number;

    @Column({
        name: "favorite_food",
        type: "text"
    })
    favoriteFood!: string;

    @Column({ type: "text" })
    activity!: string;


    // One cat can have many feeding records.
    @OneToMany(
        () => FeedingRecord,
        (feedingRecord) => feedingRecord.cat
    )
    feedingRecords!: FeedingRecord[];


    // One cat can have many individual water records.
    @OneToMany(
        () => WaterRecord,
        (waterRecord) => waterRecord.cat
    )
    waterRecords!: WaterRecord[];


    // One cat can have many daily water targets.
    // Each target represents one specific date.
    @OneToMany(
        () => WaterDailyTarget,
        (target) => target.cat
    )
    waterDailyTargets!: WaterDailyTarget[];
}
