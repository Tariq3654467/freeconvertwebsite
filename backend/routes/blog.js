const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { jwtRequired, jwtOptional, isAdmin } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-');
}

router.get('/', async (req, res) => {
  // Public endpoint
  const status = req.query.status || 'published';
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.per_page) || 10;
  
  const blogs = await prisma.blog.findMany({
    where: { status },
    orderBy: { created_at: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage,
  });

  const total = await prisma.blog.count({ where: { status } });

  return res.status(200).json({
    blogs,
    total,
    pages: Math.ceil(total / perPage),
    current_page: page
  });
});

router.post('/', jwtRequired, isAdmin, async (req, res) => {
  const { title, content, excerpt, category, tags, featured_image, status = 'draft' } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  let slug = slugify(title);
  const existing = await prisma.blog.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${uuidv4().substring(0, 8)}`;
  }

  const blog = await prisma.blog.create({
    data: {
      admin_id: req.admin.id,
      title,
      slug,
      content,
      excerpt,
      category,
      tags: tags || [],
      featured_image,
      status
    }
  });

  return res.status(201).json({ message: 'Blog created', blog });
});

router.get('/admin/all', jwtRequired, isAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.per_page) || 10;

  const blogs = await prisma.blog.findMany({
    where: { admin_id: req.admin.id },
    orderBy: { created_at: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage
  });
  
  const total = await prisma.blog.count({ where: { admin_id: req.admin.id } });

  return res.status(200).json({
    blogs,
    total,
    pages: Math.ceil(total / perPage),
    current_page: page
  });
});

router.get('/:id', jwtOptional, async (req, res) => {
  let blog = await prisma.blog.findUnique({ where: { id: req.params.id } });
  if (!blog) {
    blog = await prisma.blog.findUnique({ where: { slug: req.params.id } });
  }

  if (!blog) return res.status(404).json({ message: 'Blog not found' });

  let requesterIsAdmin = false;
  if (req.user && req.user.is_admin) {
    requesterIsAdmin = true;
  }

  if (blog.status !== 'published' && !requesterIsAdmin) {
    return res.status(404).json({ message: 'Blog not found' });
  }

  if (blog.status === 'published') {
    blog = await prisma.blog.update({
      where: { id: blog.id },
      data: { view_count: { increment: 1 } }
    });
  }

  return res.status(200).json(blog);
});

router.put('/:id', jwtRequired, isAdmin, async (req, res) => {
  const blogId = req.params.id;
  const blog = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!blog) return res.status(404).json({ message: 'Blog not found' });

  if (blog.admin_id !== req.admin.id) {
    return res.status(403).json({ message: 'You can only edit your own blogs' });
  }

  const data = req.body;
  const updateData = {};
  if (data.title) updateData.title = data.title;
  if (data.content) updateData.content = data.content;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.featured_image !== undefined) updateData.featured_image = data.featured_image;
  if (data.status) updateData.status = data.status;

  const updatedBlog = await prisma.blog.update({
    where: { id: blogId },
    data: updateData
  });

  return res.status(200).json({ message: 'Blog updated', blog: updatedBlog });
});

router.delete('/:id', jwtRequired, isAdmin, async (req, res) => {
  const blog = await prisma.blog.findUnique({ where: { id: req.params.id } });
  if (!blog) return res.status(404).json({ message: 'Blog not found' });

  if (blog.admin_id !== req.admin.id) {
    return res.status(403).json({ message: 'You can only delete your own blogs' });
  }

  await prisma.blog.delete({ where: { id: req.params.id } });
  return res.status(200).json({ message: 'Blog deleted' });
});

module.exports = router;
