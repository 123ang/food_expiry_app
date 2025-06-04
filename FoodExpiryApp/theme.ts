export interface Theme {
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  textSecondary: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  borderColor: string;
  shadowColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  borderRadius: number;
}

export const lightTheme: Theme = {
  backgroundColor: '#F2EFE9',
  cardBackground: '#BFBBB4',
  textColor: '#594d3e',
  textSecondary: '#594d3e',
  primaryColor: '#80BEAF',
  secondaryColor: '#86B7D5',
  tertiaryColor: '#594d3e',
  borderColor: '#E0E0E0',
  shadowColor: 'rgba(0, 0, 0, 0.08)',
  successColor: '#80BEAF',
  warningColor: '#86B7D5',
  dangerColor: '#FF5252',
  borderRadius: 16,
};

export const darkTheme: Theme = {
  backgroundColor: '#1A1B1E',
  cardBackground: '#2D2F34',
  textColor: '#FFFFFF',
  textSecondary: '#A0A0A0',
  primaryColor: '#80BEAF',
  secondaryColor: '#86B7D5',
  tertiaryColor: '#594d3e',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  shadowColor: 'rgba(0, 0, 0, 0.2)',
  successColor: '#80BEAF',
  warningColor: '#86B7D5',
  dangerColor: '#FF5252',
  borderRadius: 16,
}; 