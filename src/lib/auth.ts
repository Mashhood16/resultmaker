import { jwtVerify, SignJWT } from 'jose'

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET_KEY is not set')
    }
    return 'default_secret_key_for_development'
  }
  return secret
}

export const verifyAuth = async (token: string) => {
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(getJwtSecretKey()))
    return verified.payload as { id: string; role: 'admin' | 'school'; username: string }
  } catch (err) {
    throw new Error('Your token has expired.')
  }
}

export const signToken = async (payload: { id: string; role: 'admin' | 'school'; username: string }) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(new TextEncoder().encode(getJwtSecretKey()))
}
