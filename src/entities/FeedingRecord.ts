
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn
} from "typeorm";

import { CatProfileEntity } from "./CatProfile";

@Entity("feeding_records")
export class FeedingRecord {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "food_name", type: "text" })
    foodName!: string;

    @Column({ name: "quantity_grams", type: "real" })
    quantityGrams!: number;

    @Column({ name: "meal_time", type: "text" })
    mealTime!: string;

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

    // Many feeding records belong to one cat.
    @ManyToOne(
        () => CatProfileEntity,
        (cat) => cat.feedingRecords,
        { nullable: false }
    )
    @JoinColumn({
        name: "cat_id",
        referencedColumnName: "id"
    })
    cat!: CatProfileEntity;
}
