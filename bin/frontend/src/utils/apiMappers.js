export const normalizeFoodItem = (food) => {
  const profile = food?.nutrientProfile || {};
  const servingSize = profile.servingSize || 100;
  const factor = servingSize > 0 ? 100 / servingSize : 1;

  const calories = profile.calories ?? food?.calories ?? 0;
  const protein = profile.protein ?? food?.protein ?? 0;
  const carbs = profile.carbohydrates ?? food?.carbohydrates ?? 0;
  const fat = profile.fat ?? food?.fat ?? 0;

  return {
    ...food,
    servingSize,
    caloriesPer100g: calories * factor,
    proteinPer100g: protein * factor,
    carbsPer100g: carbs * factor,
    fatPer100g: fat * factor,
  };
};

export const mapDietaryEntry = (entry) => {
  const food = entry?.foodItem || {};
  const profile = food?.nutrientProfile || {};
  const servingSize = profile.servingSize || 100;
  const portion = entry?.portionSize || 0;
  const factor = servingSize > 0 ? portion / servingSize : 0;

  const calories = (profile.calories ?? food?.calories ?? 0) * factor;
  const protein = (profile.protein ?? food?.protein ?? 0) * factor;
  const carbs = (profile.carbohydrates ?? food?.carbohydrates ?? 0) * factor;
  const fat = (profile.fat ?? food?.fat ?? 0) * factor;
  const fiber = (profile.fiber ?? 0) * factor;

  return {
    id: entry?.id,
    foodName: food?.name || 'Unknown',
    mealType: entry?.mealType,
    portionSize: entry?.portionSize || 0,
    entryDate: entry?.consumedAt || entry?.createdAt,
    consumedAt: entry?.consumedAt,
    calories,
    protein,
    carbs,
    fat,
    fiber,
  };
};

export const mapDietaryEntries = (entries) => (entries || []).map(mapDietaryEntry);
