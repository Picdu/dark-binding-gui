import axios, { AxiosRequestConfig } from 'axios';

let httpsAgent: any;
if (typeof window === 'undefined') {
  httpsAgent = new (require('https').Agent)({
    rejectUnauthorized: false,
    keepAlive: true,
    keepAliveMsecs: 60000,
  });
}

const getAuthHeaders = () => {
  if (global.credentials) {
    const { password, port } = global.credentials;

    // Riot requires Basic auth with the fixed "riot" username.
    // Put it in the Authorization header - URL-embedded credentials break
    // with modern axios and special characters in the password.
    return {
      Authorization: `Basic ${Buffer.from(`riot:${password}`).toString(
        'base64'
      )}`,
    };
  }

  return {};
};

const getURL = () => {
  if (global.credentials) {
    const { port } = global.credentials;

    return `https://127.0.0.1:${port}`;
  }

  return `lcu://`;
};

async function request<T>(path: string, options?: AxiosRequestConfig) {
  const response = await axios(path, {
    // @ts-ignore
    baseURL: getURL(),
    httpsAgent,
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options?.headers || {}),
    },
  });

  return response.data as Promise<T>;
}

type ReqOptions = { headers?: Record<string, string> };

export const get = <ResponseType>(path: string, options?: ReqOptions) => () =>
  request<ResponseType>(path, { ...options, method: 'GET' });

export const patch = <BodyType, ResponseType>(
  path: string,
  options?: ReqOptions
) => (data: BodyType) =>
  request<ResponseType>(path, {
    ...options,
    data,
    method: 'PATCH',
  });

export const post = <BodyType, ResponseType>(
  path: string,
  options?: ReqOptions
) => (data: BodyType) =>
  request<ResponseType>(path, {
    ...options,
    data,
    method: 'POST',
  });
