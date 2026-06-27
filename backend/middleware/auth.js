const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'your-secret-key';

exports.jwtRequired = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing Authorization Header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { sub: id, username, email, is_admin }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

exports.jwtOptional = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    // Ignore invalid tokens for optional endpoints
  }
  next();
};

exports.isAdmin = async (req, res, next) => {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  try {
    const admin = await prisma.admin.findUnique({
      where: { user_id: req.user.user_id }
    });
    if (!admin) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Attach admin profile to request
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
