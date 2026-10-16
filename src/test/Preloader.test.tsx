import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import Preloader from "@/components/Preloader";

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("Preloader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra o progresso como barra acessível", () => {
    mockReducedMotion(false);
    render(<Preloader onFinished={() => {}} />);

    const bar = screen.getByRole("progressbar", { name: /preparando seu açaí/i });
    expect(bar).toHaveAttribute("aria-valuenow", "0");

    act(() => { vi.advanceTimersByTime(1000); });
    expect(Number(bar.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
  });

  it("com movimento normal, a montagem do logo leva alguns segundos", () => {
    mockReducedMotion(false);
    const onFinished = vi.fn();
    render(<Preloader onFinished={onFinished} />);

    act(() => { vi.advanceTimersByTime(1500); });
    expect(onFinished).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(4000); });
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it("com 'reduzir movimento' ligado, sai quase na hora", () => {
    mockReducedMotion(true);
    const onFinished = vi.fn();
    render(<Preloader onFinished={onFinished} />);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(onFinished).toHaveBeenCalledTimes(1);
  });
});
