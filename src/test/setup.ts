import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'node:util'

if (!globalThis.fetch) {
  globalThis.fetch = jest.fn(async () => {
    throw new Error('fetch nao deve ser chamado nestes testes.')
  }) as typeof fetch
}

if (!globalThis.Headers) {
  globalThis.Headers = class HeadersMock {} as unknown as typeof Headers
}

if (!globalThis.Request) {
  globalThis.Request = class RequestMock {} as unknown as typeof Request
}

if (!globalThis.Response) {
  globalThis.Response = class ResponseMock {} as unknown as typeof Response
}

Object.assign(globalThis, {
  TextEncoder,
  TextDecoder,
  __FLUENTIA_ENV__: {},
})
