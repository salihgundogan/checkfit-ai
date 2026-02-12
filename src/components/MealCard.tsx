import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';

interface MealCardProps {
  mealType: string;       // Kahvaltı, Öğle...
  foodName?: string;      // Yemeğin adı
  calories?: number;      // Kalori değeri
  imageSource?: ImageSourcePropType; // Yemeğin resmi
  isEmpty?: boolean;      // Boş durum mu?
  onAddPress?: () => void; // Ekle butonuna basılınca
}

const MealCard: React.FC<MealCardProps> = ({ 
  mealType, 
  foodName, 
  calories, 
  imageSource, 
  isEmpty = false, 
  onAddPress 
}) => {
  return (
    <View style={[styles.container, isEmpty && styles.emptyContainer]}>
      {/* Sol Kısım: Resim veya İkon */}
      <View style={[styles.imageContainer, isEmpty && styles.emptyImageContainer]}>
        {isEmpty ? (
            // Boşsa çatal bıçak ikonu (Text olarak simüle edildi)
            <Text style={styles.emptyIconText}>🍽️</Text>
        ) : (
            // Doluysa resim
            imageSource && <Image source={imageSource} style={styles.image} />
        )}
      </View>

      {/* Orta Kısım: Yazılar */}
      <View style={styles.textContainer}>
        <Text style={styles.mealType}>{mealType}</Text>
        <Text style={[styles.foodName, isEmpty && styles.emptyFoodName]}>
          {isEmpty ? 'Henüz girilmedi' : foodName}
        </Text>
      </View>

      {/* Sağ Kısım: Kalori veya Ekle Butonu */}
      <View style={styles.rightContainer}>
        {isEmpty ? (
          <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
             <Text style={styles.plusText}>+</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.caloriesText}>{calories}</Text>
            <Text style={styles.kcalLabel}>kcal</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    // Gölge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyContainer: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: 'transparent', // Hover efekti yerine React Native'de border kontrolü
    borderStyle: 'dashed',
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#f3f4f6',
  },
  emptyImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emptyIconText: {
    fontSize: 24,
    color: '#9ca3af',
  },
  textContainer: {
    flex: 1,
  },
  mealType: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111811',
  },
  emptyFoodName: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  rightContainer: {
    justifyContent: 'center',
  },
  caloriesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111811',
  },
  kcalLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(19, 236, 34, 0.1)', // Primary color opacity
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    fontSize: 20,
    color: '#13ec22', // Primary
    fontWeight: 'bold',
    marginTop: -2,
  }
});

export default MealCard;