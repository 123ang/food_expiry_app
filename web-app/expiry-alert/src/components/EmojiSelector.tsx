import React, { useState } from 'react';
import { EMOJI_CATEGORIES } from '../constants/emojis';
import { useLanguage } from '../contexts/LanguageContext';

interface EmojiSelectorProps {
  selectedEmoji: string;
  onEmojiSelect: (emoji: string) => void;
  backgroundColor?: string;
}

const EmojiSelector: React.FC<EmojiSelectorProps> = ({ 
  selectedEmoji, 
  onEmojiSelect, 
  backgroundColor = '#FF6B6B' 
}) => {
  const { t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['emojiCategory.food']));

  const toggleCategory = (categoryTitle: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryTitle)) {
      newExpanded.delete(categoryTitle);
    } else {
      newExpanded.add(categoryTitle);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="emoji-selector">
      <div className="form-label">
        {t('categories.icon')}
      </div>
      
      <div 
        className="selected-icon" 
        style={{ 
          backgroundColor: backgroundColor,
          border: backgroundColor === 'transparent' ? '2px dashed #ccc' : 'none'
        }}
      >
        {selectedEmoji}
      </div>

      <div className="emoji-categories">
        {EMOJI_CATEGORIES.map((category) => (
          <div key={category.title} className="emoji-category">
            <button
              type="button"
              className={`category-header ${expandedCategories.has(category.title) ? 'expanded' : ''}`}
              onClick={() => toggleCategory(category.title)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-title">{t(category.title)}</span>
              <span className="expand-icon">
                {expandedCategories.has(category.title) ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedCategories.has(category.title) && (
              <div className="emoji-grid">
                {category.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onEmojiSelect(item.emoji)}
                    className={`emoji-option ${selectedEmoji === item.emoji ? 'active' : ''}`}
                    title={item.label}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmojiSelector; 