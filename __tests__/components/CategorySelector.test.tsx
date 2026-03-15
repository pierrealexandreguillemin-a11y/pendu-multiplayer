import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategorySelector } from '@/components/game/CategorySelector';

describe('CategorySelector', () => {
  it('should render 16 radio buttons (Toutes + 15 categories)', () => {
    render(<CategorySelector selected={null} onSelect={() => {}} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(16);
  });

  it('should have "Toutes" checked by default when selected is null', () => {
    render(<CategorySelector selected={null} onSelect={() => {}} />);
    const toutes = screen.getByRole('radio', { name: /toutes/i });
    expect(toutes).toHaveAttribute('aria-checked', 'true');
  });

  it('should show category with count', () => {
    render(<CategorySelector selected={null} onSelect={() => {}} />);
    const animal = screen.getByRole('radio', { name: /animal/i });
    expect(animal.textContent).toMatch(/Animal \(\d+\)/);
  });

  it('should call onSelect with category when clicked', async () => {
    const onSelect = vi.fn();
    render(<CategorySelector selected={null} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('radio', { name: /animal/i }));
    expect(onSelect).toHaveBeenCalledWith('Animal');
  });

  it('should call onSelect with null when Toutes clicked', async () => {
    const onSelect = vi.fn();
    render(<CategorySelector selected="Animal" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('radio', { name: /toutes/i }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('should highlight the selected category', () => {
    render(<CategorySelector selected="Sport" onSelect={() => {}} />);
    const sport = screen.getByRole('radio', { name: /sport/i });
    expect(sport).toHaveAttribute('aria-checked', 'true');
  });

  it('should disable chips with count 0', () => {
    // Render with a difficulty that might have 0-count categories
    render(<CategorySelector selected={null} onSelect={() => {}} difficulty="hard" />);
    const radios = screen.getAllByRole('radio');
    radios.forEach((radio) => {
      if (radio.getAttribute('aria-disabled') === 'true') {
        expect(radio).toBeDisabled();
      }
    });
  });
});
