import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the landing page for signed-out visitors', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
});
