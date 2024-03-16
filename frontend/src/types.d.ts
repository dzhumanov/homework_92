export interface LoginMutation {
  username: string;
  password: string;
}

export interface RegisterMutation {
  username: string;
  password: string;
  displayName: string;
}

export interface GlobalError {
  error: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface ValidationError {
  errors: {
    [key: string]: {
      name: string;
      message: string;
    };
  };
  message: string;
  name: string;
  _message: string;
}

export interface User {
  _id: string;
  username: string;
  role: string;
  token: string;
  displayName: string;
}
