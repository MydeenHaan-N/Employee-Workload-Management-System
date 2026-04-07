import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models/index.js';

const getAuthCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 1000,
});

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'roleDetails', attributes: ['id', 'name'] }],
    });

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        roleId: user.roleId,
        roleName: user.roleDetails?.name,
        fullName: user.fullName,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, getAuthCookieOptions());
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        roleId: user.roleId,
        roleName: user.roleDetails?.name,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, as: 'roleDetails', attributes: ['id', 'name'] }],
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        roleId: user.roleId,
        roleName: user.roleDetails?.name,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const logout = (_req, res) => {
  res.clearCookie('token', getAuthCookieOptions());
  res.json({ message: 'Logged out successfully' });
};

export { login, getMe, logout };
