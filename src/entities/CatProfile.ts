
import {
    Entity,
    PrimaryColumn,
    Column
} from "typeorm";

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
}
