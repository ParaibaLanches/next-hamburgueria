import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret123'

export const signToken = (payload: object, expiresIn = '1d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any })
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}
