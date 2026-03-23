export type ApiResult<T> = {
  success: boolean;
  message?: string;
  error?: string;
  data: T;
};
