import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from "typeorm";

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
}