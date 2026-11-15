
import { getCatProfile } from "../services/cat.service";
import { getFeedingSummary } from "../services/feeding.service";
import { getWaterSummary } from "../services/water.service";

// Get combined daily wellness information
export const getDailyWellness = async (date: string) => {

    // 1. Get the cat profile
    const cat = await getCatProfile();

    // Stop if the cat profile does not exist
    if (!cat) {
        return null;
    }

    // 2. Get feeding and water summaries in parallel
    const [feedingSummary, waterSummary] = await Promise.all([
        getFeedingSummary(date),
        getWaterSummary(date)
    ]);

    // 3. Return combined daily wellness data
    return {
        date,

        cat: {
            id: cat.id,
            name: cat.name,
            age: cat.age,
            weightKg: cat.weightKg
        },

        feeding: feedingSummary,
        water: waterSummary
    };
};
