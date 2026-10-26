import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageContext';
import HeroSection from '../components/home/HeroSection';

let media;
let mediaChange;

function renderHero({ loadImages = true } = {}) {
  const result = render(
    <MemoryRouter><LanguageProvider><HeroSection /></LanguageProvider></MemoryRouter>
  );
  if (loadImages) {
    result.container.querySelectorAll('.hero-background').forEach((image) => fireEvent.load(image));
  }
  return result;
}
function slide(number) {
  return screen.getByRole('button', { name: new RegExp(`Show image ${number}:`) });
}
function tick(ms = 3000) {
  act(() => vi.advanceTimersByTime(ms));
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  media = {
    matches: false,
    addEventListener: vi.fn((_, listener) => { mediaChange = listener; }),
    removeEventListener: vi.fn(),
  };
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => (
    query === '(hover: hover)' ? { matches: true } : media
  ));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Homepage hero carousel', () => {
  it('preserves copy and routes, replaces fabricated statistics, and uses decorative local images', () => {
    const { container } = renderHero();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Secure, Transparent & Intelligent FDR Management');
    expect(screen.getByRole('link', { name: 'Institution Login' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Explore Services' })).toHaveAttribute('href', '/services');
    expect(screen.getByText('AI-Assisted FDR Verification')).toBeInTheDocument();
    expect(screen.getByText('Regulatory Compliance Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Smart Renewal & Risk Alerts')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/12,400|4,850|99\.8/);
    const images = container.querySelectorAll('.hero-background');
    expect(images).toHaveLength(3);
    images.forEach((image) => {
      expect(image).toHaveAttribute('alt', '');
      expect(image.src).toMatch(/\.webp$/);
    });
    expect(images[0]).toHaveAttribute('fetchpriority', 'high');
    expect(images[1]).toHaveAttribute('loading', 'eager');
    expect(container.querySelector('[aria-live]')).toBeNull();
  });

  it('rotates at three seconds and loops back to the first photograph', () => {
    renderHero();
    tick(2999);
    expect(slide(1)).toHaveAttribute('aria-pressed', 'true');
    tick(1);
    expect(slide(2)).toHaveAttribute('aria-pressed', 'true');
    tick();
    expect(slide(3)).toHaveAttribute('aria-pressed', 'true');
    tick();
    expect(slide(1)).toHaveAttribute('aria-pressed', 'true');
  });

  it('selects a photograph manually and restarts the timer even on reselect', () => {
    renderHero();
    tick(2000);
    fireEvent.click(slide(3));
    expect(slide(3)).toHaveAttribute('aria-pressed', 'true');
    tick(2000);
    fireEvent.click(slide(3));
    tick(2999);
    expect(slide(3)).toHaveAttribute('aria-pressed', 'true');
    tick(1);
    expect(slide(1)).toHaveAttribute('aria-pressed', 'true');
  });

  it('pauses on hover and while control focus moves within the group, then resumes', () => {
    renderHero();
    const hero = screen.getByRole('region');
    fireEvent.mouseEnter(hero);
    tick(6000);
    expect(slide(1)).toHaveAttribute('aria-pressed', 'true');
    fireEvent.focus(slide(1));
    fireEvent.mouseLeave(hero);
    tick();
    expect(slide(1)).toHaveAttribute('aria-pressed', 'true');
    fireEvent.blur(slide(1), { relatedTarget: slide(2) });
    fireEvent.focus(slide(2));
    tick();
    expect(slide(1)).toHaveAttribute('aria-pressed', 'true');
    fireEvent.blur(slide(2), { relatedTarget: document.body });
    tick();
    expect(slide(2)).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports an explicit persistent pause and resume', () => {
    renderHero();
    fireEvent.click(screen.getByRole('button', { name: 'Pause image rotation' }));
    tick(9000);
    expect(slide(1)).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Resume image rotation' }));
    tick();
    expect(slide(2)).toHaveAttribute('aria-pressed', 'true');
  });

  it('resumes autoplay after a pointer click leaves a dot focused and the mouse exits', () => {
    renderHero();
    const hero = screen.getByRole('region');
    fireEvent.mouseEnter(hero);
    fireEvent.pointerDown(slide(2));
    fireEvent.focus(slide(2));
    fireEvent.click(slide(2));
    tick(4000);
    expect(slide(2)).toHaveAttribute('aria-pressed', 'true');
    fireEvent.mouseLeave(hero);
    tick(2999);
    expect(slide(2)).toHaveAttribute('aria-pressed', 'true');
    tick(1);
    expect(slide(3)).toHaveAttribute('aria-pressed', 'true');
  });

  it('pauses again when a pointer-focused control is operated with the keyboard', () => {
    renderHero();
    fireEvent.pointerDown(slide(2));
    fireEvent.focus(slide(2));
    fireEvent.click(slide(2));
    fireEvent.keyDown(slide(2), { key: 'Tab' });
    tick(6000);
    expect(slide(2)).toHaveAttribute('aria-pressed', 'true');
    fireEvent.blur(slide(2), { relatedTarget: document.body });
    tick();
    expect(slide(3)).toHaveAttribute('aria-pressed', 'true');
  });

  it('progressively requests hidden images after the first image loads', () => {
    const { container } = renderHero({ loadImages: false });
    const images = container.querySelectorAll('.hero-background');
    expect(images[1]).toHaveAttribute('loading', 'lazy');
    fireEvent.load(images[0]);
    expect(images[1]).toHaveAttribute('loading', 'eager');
    expect(images[2]).toHaveAttribute('loading', 'eager');
  });

  it('disables autoplay for reduced motion while retaining manual navigation', () => {
    media.matches = true;
    renderHero();
    tick(9000);
    expect(slide(1)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: 'Pause image rotation' })).toBeNull();
    fireEvent.click(slide(3));
    expect(slide(3)).toHaveAttribute('aria-pressed', 'true');
    act(() => mediaChange({ matches: false }));
    tick();
    expect(slide(1)).toHaveAttribute('aria-pressed', 'true');
    act(() => mediaChange({ matches: true }));
    tick(9000);
    expect(slide(1)).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the current image visible until the requested background loads', () => {
    const { container } = renderHero({ loadImages: false });
    tick(6000);
    expect(slide(1)).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(slide(3));
    expect(slide(1)).toHaveAttribute('aria-pressed', 'true');
    fireEvent.load(container.querySelectorAll('.hero-background')[2]);
    expect(slide(3)).toHaveAttribute('aria-pressed', 'true');
  });

  it('cleans up its interval and motion preference listener on unmount', () => {
    const startInterval = vi.spyOn(window, 'setInterval');
    const clearInterval = vi.spyOn(window, 'clearInterval');
    const { unmount } = renderHero();
    const interval = startInterval.mock.results.at(-1).value;
    unmount();
    expect(clearInterval).toHaveBeenCalledWith(interval);
    expect(media.removeEventListener).toHaveBeenCalledWith('change', mediaChange);
  });
});
