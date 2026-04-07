import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models/index.js';

const getTokenFromCookieHeader = (cookieHeader) => {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((part) => part.trim());
  const tokenCookie = cookies.find((part) => part.startsWith('token='));

  if (!tokenCookie) return null;

  return decodeURIComponent(tokenCookie.slice('token='.length));
};

const authenticateJWT = async (req, res, next) => {
  const token = getTokenFromCookieHeader(req.headers.cookie);
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'roleDetails', attributes: ['id', 'name'] }],
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user.id,
      fullName: user.fullName,
      roleId: user.roleId,
      roleName: user.roleDetails?.name,
    };
    next();
  } catch {
    res.status(400).json({ message: 'Invalid token' });
  }
};

export default authenticateJWT;
