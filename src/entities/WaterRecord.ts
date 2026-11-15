
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn
} from "typeorm";

import { CatProfileEntity } from "./CatProfile";

@Entity("water_records")
export class WaterRecord {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "offered_ml", type: "real" })
    offeredMl!: number;

    @Column({
        name: "consumed_ml",
        type: "real",
        nullable: true
    })
    consumedMl!: number | null;

    @Column({ type: "integer", default: 0 })
    measured!: number;

    @Column({ type: "text", default: "" })
    notes!: string;

    @Column({ name: "created_at", type: "text" })
    createdAt!: string;

    @Column({
        name: "record_date",
        type: "text",
        nullable: true
    })
    recordDate!: string | null;

    // Many water records belong to one cat.
    @ManyToOne(
        () => CatProfileEntity,
        (cat) => cat.waterRecords,
        { nullable: false }
    )
    @JoinColumn({
        name: "cat_id",
        referencedColumnName: "id"
    })
    cat!: CatProfileEntity;
}
