// Loading State Utilities

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingStateData<T> {
  state: LoadingState;
  data?: T;
  error?: string;
}

export function createLoadingState<T>(initialState: LoadingState = 'idle'): LoadingStateData<T> {
  return {
    state: initialState,
  };
}

export function setLoading<T>(loadingData: LoadingStateData<T>): LoadingStateData<T> {
  return {
    ...loadingData,
    state: 'loading',
  };
}

export function setSuccess<T>(loadingData: LoadingStateData<T>, data: T): LoadingStateData<T> {
  return {
    state: 'success',
    data,
  };
}

export function setError<T>(loadingData: LoadingStateData<T>, error: string): LoadingStateData<T> {
  return {
    state: 'error',
    error,
  };
}

export function resetLoadingState<T>(loadingData: LoadingStateData<T>): LoadingStateData<T> {
  return {
    state: 'idle',
  };
}

export function isLoading<T>(loadingData: LoadingStateData<T>): boolean {
  return loadingData.state === 'loading';
}

export function isSuccess<T>(loadingData: LoadingStateData<T>): boolean {
  return loadingData.state === 'success';
}

export function isError<T>(loadingData: LoadingStateData<T>): boolean {
  return loadingData.state === 'error';
}

export function isIdle<T>(loadingData: LoadingStateData<T>): boolean {
  return loadingData.state === 'idle';
}
