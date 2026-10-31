import { decodeToken, encodeToken } from './token.util';

describe('token.util', () => {
  it('codifica y decodifica el payload (ida y vuelta)', () => {
    const payload = { sub: 'ñandú@demo.test', role: 'admin' as const, exp: 4102444800 };
    expect(decodeToken(encodeToken(payload))).toEqual(payload);
  });

  it('devuelve null con un token malformado', () => {
    expect(decodeToken('esto-no-es-un-token')).toBeNull();
  });
});
