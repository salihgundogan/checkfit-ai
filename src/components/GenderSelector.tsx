import React from 'react';

interface GenderSelectorProps {
  selectedGender: string;
  onChange: (value: string) => void;
  onSelectNext: () => void; // Seçim yapıldığında çalışacak
}

export const GenderSelector: React.FC<GenderSelectorProps> = ({ selectedGender, onChange, onSelectNext }) => {
  
  const handleSelect = (value: string) => {
    onChange(value);
    // Kısa bir gecikme ile scrolldan emin olmak için
    setTimeout(() => {
        onSelectNext();
    }, 300);
  };

  return (
    <div className="flex flex-col gap-3 mt-2">
      <label className="text-sm font-semibold text-text-main dark:text-[#e0e6e0] ml-1">
        Biyolojik Cinsiyet
      </label>
      <div className="grid grid-cols-2 gap-4">
        {['female', 'male'].map((gender) => (
          <label key={gender} className="cursor-pointer group relative">
            <input
              type="radio"
              name="sex"
              value={gender}
              checked={selectedGender === gender}
              onChange={() => handleSelect(gender)}
              className="peer sr-only"
            />
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-transparent bg-surface-light dark:bg-surface-dark p-6 shadow-sm transition-all peer-checked:border-primary peer-checked:bg-primary/5 dark:peer-checked:bg-primary/10 hover:shadow-md hover:scale-[1.02]">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors duration-300 ${selectedGender === gender ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                <span className="material-symbols-outlined text-3xl">
                  {gender === 'female' ? 'female' : 'male'}
                </span>
              </div>
              <span className="font-semibold text-text-main dark:text-white">
                {gender === 'female' ? 'Kadın' : 'Erkek'}
              </span>
            </div>
            <div className="absolute top-3 right-3 opacity-0 peer-checked:opacity-100 text-primary transition-all duration-300 transform scale-50 peer-checked:scale-100">
              <span className="material-symbols-outlined filled">check_circle</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};