import { toast, useToastStore } from './toast';

describe('toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });
  afterEach(() => jest.useRealTimers());

  it('auto-dismisses after its duration', () => {
    toast.success('Saved');
    expect(useToastStore.getState().toasts).toHaveLength(1);
    jest.advanceTimersByTime(4_000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('keeps at most three visible, dropping the oldest', () => {
    ['a', 'b', 'c', 'd'].forEach(message => toast.info(message));
    expect(useToastStore.getState().toasts.map(t => t.message)).toEqual(['b', 'c', 'd']);
  });

  it('dismisses on demand', () => {
    const id = toast.error('Oops');
    toast.dismiss(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
