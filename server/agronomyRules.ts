import { CropType, GrowthStage, SoilType, MoistureRange } from '../src/types';
import { INDIAN_CROP_DATABASE, INDIAN_SOIL_PROFILES } from '../src/data/indianAgriData';

export interface CropBenchmark {
  crop: CropType;
  optimalPh: [number, number];
  kcValues: Partial<Record<GrowthStage, number>>; // Crop coefficient for water requirement
  defaultMoistureByStage: Partial<Record<GrowthStage, MoistureRange>>;
  nutrientReferenceMgKg: {
    nitrogen: [number, number]; // [min, max]
    phosphorus: [number, number];
    potassium: [number, number];
  };
  criticalStressTempC: number;
}

// Generate CROP_BENCHMARKS from INDIAN_CROP_DATABASE
export const CROP_BENCHMARKS: Record<CropType, CropBenchmark> = Object.keys(
  INDIAN_CROP_DATABASE
).reduce((acc, cropKey) => {
  const c = INDIAN_CROP_DATABASE[cropKey as CropType];
  acc[cropKey as CropType] = {
    crop: c.crop,
    optimalPh: c.optimalPh,
    kcValues: c.kcValues,
    defaultMoistureByStage: c.defaultMoistureByStage,
    nutrientReferenceMgKg: {
      nitrogen: [c.recommendedNpkKgAcre.nitrogen * 2, c.recommendedNpkKgAcre.nitrogen * 4],
      phosphorus: [c.recommendedNpkKgAcre.phosphorus * 1.5, c.recommendedNpkKgAcre.phosphorus * 3],
      potassium: [c.recommendedNpkKgAcre.potassium * 2, c.recommendedNpkKgAcre.potassium * 4],
    },
    criticalStressTempC: c.criticalStressTempC,
  };
  return acc;
}, {} as Record<CropType, CropBenchmark>);

export const SOIL_CHARACTERISTICS: Record<
  SoilType,
  {
    drainageRate: number; // 0.1 (slow clay) to 0.9 (fast sand)
    waterHoldingCapacity: string;
    recommendedCycleMinutes: number; // typical run duration per irrigation pulse
  }
> = Object.keys(INDIAN_SOIL_PROFILES).reduce((acc, soilKey) => {
  const s = INDIAN_SOIL_PROFILES[soilKey as SoilType];
  acc[soilKey as SoilType] = {
    drainageRate: s.drainageRate,
    waterHoldingCapacity: s.waterHoldingCapacity,
    recommendedCycleMinutes: s.recommendedCycleMinutes,
  };
  return acc;
}, {} as Record<SoilType, { drainageRate: number; waterHoldingCapacity: string; recommendedCycleMinutes: number }>);
