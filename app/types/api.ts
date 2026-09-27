export type ApiSuccess<T, M = undefined> = {
  success: true;
  data: T;
  metadata?: M;
};

export type ApiFailure = {
  success: false;
  code: string;
  message: string;
};
