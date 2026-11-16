
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index
} from "typeorm";

import { CatProfileEntity } from "./CatProfile";

@Entity("water_daily_targets")
@Index(
    "UQ_water_daily_target_cat_date",
    ["cat", "recordDate"],
    { unique: true }
)
export class WaterDailyTarget {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        name: "offered_ml",
        type: "real"
    })
    offeredMl!: number;

    @Column({
        name: "record_date",
        type: "text"
    })
    recordDate!: string;

    @Column({
        name: "created_at",
        type: "text"
    })
    createdAt!: string;

    @Column({
        name: "updated_at",
        type: "text"
    })
    updatedAt!: string;

    // Many daily targets can belong to one cat.
    // Only one target is allowed per cat per date.
    @ManyToOne(
        () => CatProfileEntity,
        (cat) => cat.waterDailyTargets,
        { nullable: false }
    )
    @JoinColumn({
        name: "cat_id",
        referencedColumnName: "id"
    })
    cat!: CatProfileEntity;
}
