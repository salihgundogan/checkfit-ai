export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number; // ml cinsinden su içeriği
  servingSize: string;
  icon: string;
}

export const FOOD_DATASET: FoodItem[] = [
  { id: '1', name: 'Haşlanmış Yumurta', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, water: 37, servingSize: '1 adet (50g)', icon: 'egg' },
  { id: '2', name: 'Yulaf Ezmesi', calories: 150, protein: 5, carbs: 27, fat: 2.5, water: 10, servingSize: '1 Kase (40g kuru)', icon: 'breakfast-dining' },
  { id: '3', name: 'Tam Buğday Ekmeği', calories: 69, protein: 3.6, carbs: 11.6, fat: 0.9, water: 8, servingSize: '1 Dilim (28g)', icon: 'bakery-dining' },
  { id: '4', name: 'Avokado', calories: 160, protein: 2, carbs: 8.5, fat: 14.7, water: 72, servingSize: 'Yarım (100g)', icon: 'eco' },
  { id: '5', name: 'Beyaz Peynir', calories: 93, protein: 6, carbs: 0.7, fat: 7.5, water: 15, servingSize: '30g', icon: 'cheese' },
  { id: '6', name: 'Muz', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, water: 88, servingSize: '1 Orta Boy (118g)', icon: 'nutrition' },
  { id: '7', name: 'Izgara Tavuk Göğsü', calories: 165, protein: 31, carbs: 0, fat: 3.6, water: 65, servingSize: '100g', icon: 'kebab-dining' },
  { id: '8', name: 'Elma', calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, water: 86, servingSize: '1 Adet (100g)', icon: 'apple' },
  { id: '9', name: 'Yoğurt (Tam Yağlı)', calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, water: 88, servingSize: '100g', icon: 'icecream' },
  { id: '10', name: 'Çiğ Badem', calories: 164, protein: 6, carbs: 6, fat: 14, water: 1, servingSize: '28g (1 avuç)', icon: 'grain' },
  { id: '11', name: 'Somon Izgara', calories: 208, protein: 22, carbs: 0, fat: 13, water: 60, servingSize: '100g', icon: 'set-meal' },
  { id: '12', name: 'Mercimek Çorbası', calories: 120, protein: 8, carbs: 20, fat: 1, water: 150, servingSize: '1 Kepçe (200ml)', icon: 'soup-kitchen' }
];