export interface Theme {
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  textSecondary: string;
  borderColor: string;
  primaryColor: string;
  secondaryColor: string;
  dangerColor: string;
  warningColor: string;
  successColor: string;
  shadowColor: string;
}

export const lightTheme: Theme = {
  backgroundColor: '#F9F9F9',
  cardBackground: '#FFFFFF',
  textColor: '#333333',
  textSecondary: '#666666',
  borderColor: '#E0E0E0',
  primaryColor: '#4CAF50',
  secondaryColor: '#FFA726',
  dangerColor: '#FF5252',
  warningColor: '#FFA726',
  successColor: '#4CAF50',
  shadowColor: 'rgba(0, 0, 0, 0.08)',
};

export const darkTheme: Theme = {
  backgroundColor: '#1A1B1E',
  cardBackground: '#2D2F34',
  textColor: '#FFFFFF',
  textSecondary: '#A0A0A0',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  primaryColor: '#4CAF50',
  secondaryColor: '#FFA726',
  dangerColor: '#FF5252',
  warningColor: '#FFA726',
  successColor: '#4CAF50',
  shadowColor: 'rgba(0, 0, 0, 0.2)',
}; 