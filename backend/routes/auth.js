const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { getPasswordHash, verifyPassword } = require('../utils/security');
const { jwtRequired, isAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'your-secret-key';

router.post('/signup', async (req, res) => {
  const { username = '', email = '', password = '' } = req.body;

  if (!username.trim() || !email.trim() || !password) {
    return res.status(400).json({ message: 'Username, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { username: username.trim() }] }
  });

  if (existingUser) {
    if (existingUser.username === username.trim()) return res.status(400).json({ message: 'Username already taken' });
    if (existingUser.email === email.toLowerCase()) return res.status(400).json({ message: 'Email already registered' });
  }

  const hashedPassword = await getPasswordHash(password);
  
  const adminEmail = (process.env.ADMIN_EMAIL || 'tariq.devp@gmail.com').trim().toLowerCase();
  const isSetupAdmin = email.trim().toLowerCase() === adminEmail;

  try {
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password_hash: hashedPassword,
        is_admin: isSetupAdmin,
        admin_profile: isSetupAdmin ? {
          create: {
            role: 'moderator'
          }
        } : undefined
      }
    });

    return res.status(201).json({ message: 'Account created' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email = '', password = '' } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign({
    user_id: user.id, // to match original ID passing
    username: user.username,
    email: user.email,
    is_admin: user.is_admin
  }, JWT_SECRET, { expiresIn: '1d' });

  return res.status(200).json({ access_token: token });
});

router.get('/users', jwtRequired, isAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.per_page) || 10;
  
  const users = await prisma.user.findMany({
    skip: (page - 1) * perPage,
    take: perPage,
    select: {
      id: true,
      username: true,
      email: true,
      is_admin: true,
      created_at: true
    }
  });

  const total = await prisma.user.count();

  return res.status(200).json({
    users,
    total,
    pages: Math.ceil(total / perPage),
    current_page: page
  });
});

router.get('/users/:id', jwtRequired, isAdmin, async (req, res) => {
  const user = await prisma.user.findUnique({ 
    where: { id: parseInt(req.params.id) },
    select: {
      id: true,
      username: true,
      email: true,
      is_admin: true,
      created_at: true
    }
  });
  
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.status(200).json(user);
});

router.post('/users/:id/toggle-admin', jwtRequired, isAdmin, async (req, res) => {
  const targetUserId = parseInt(req.params.id);
  
  if (targetUserId === req.user.user_id) {
    return res.status(400).json({ message: 'Cannot modify your own admin status' });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { admin_profile: true }
  });

  if (!targetUser) return res.status(404).json({ message: 'User not found' });

  const isNowAdmin = !targetUser.is_admin;

  if (isNowAdmin && !targetUser.admin_profile) {
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        is_admin: true,
        admin_profile: {
          create: { role: 'moderator' }
        }
      }
    });
  } else if (!isNowAdmin && targetUser.admin_profile) {
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        is_admin: false,
        admin_profile: {
          delete: true
        }
      }
    });
  } else {
    // Should not happen theoretically unless inconsistencies exist
    await prisma.user.update({
      where: { id: targetUserId },
      data: { is_admin: isNowAdmin }
    });
  }

  const updatedUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      username: true,
      email: true,
      is_admin: true,
      created_at: true
    }
  });

  return res.status(200).json({ message: 'Admin status updated', user: updatedUser });
});

router.delete('/users/:id', jwtRequired, isAdmin, async (req, res) => {
  const targetUserId = parseInt(req.params.id);
  
  if (targetUserId === req.user.user_id) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }

  try {
    await prisma.user.delete({ where: { id: targetUserId } });
    return res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    return res.status(404).json({ message: 'User not found or error deleting' });
  }
});

router.get('/stats', jwtRequired, isAdmin, async (req, res) => {
  const [total_users, total_blogs, published_blogs, draft_blogs, viewCountAggr] = await Promise.all([
    prisma.user.count(),
    prisma.blog.count(),
    prisma.blog.count({ where: { status: 'published' } }),
    prisma.blog.count({ where: { status: 'draft' } }),
    prisma.blog.aggregate({ _sum: { view_count: true } })
  ]);

  return res.status(200).json({
    total_users,
    total_blogs,
    published_blogs,
    draft_blogs,
    total_views: viewCountAggr._sum.view_count || 0
  });
});

module.exports = router;
