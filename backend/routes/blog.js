const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { jwtRequired, jwtOptional, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

const UPLOAD_FOLDER = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = `${uuidv4()}${ext}`;
      cb(null, name);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB featured image cap
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Only JPG, PNG, GIF, and WEBP images are allowed'), false);
    }
    cb(null, true);
  }
});

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

router.post('/', jwtRequired, isAdmin, upload.single('featured_image'), async (req, res) => {
  const {
    title,
    content,
    excerpt,
    category,
    tags,
    status = 'draft',
    author_name,
    author_profession,
    author_linkedin,
    author_facebook,
    author_instagram,
    meta_title,
    meta_description,
    keywords
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  if (title.length > 60) {
    return res.status(400).json({ message: 'Title must be 60 characters or less' });
  }

  if (meta_description && meta_description.length > 160) {
    return res.status(400).json({ message: 'Meta description must be 160 characters or less' });
  }

  let slug = slugify(title);
  const existing = await prisma.blog.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${uuidv4().substring(0, 8)}`;
  }

  const tagsArray = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
    ? tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    : [];

  const featuredImagePath = req.file ? `/uploads/${req.file.filename}` : req.body.featured_image;

  const blog = await prisma.blog.create({
    data: {
      admin_id: req.admin.id,
      title,
      slug,
      content,
      excerpt,
      category,
      tags: tagsArray,
      featured_image: featuredImagePath,
      status,
      author_name,
      author_profession,
      author_linkedin,
      author_facebook,
      author_instagram,
      meta_title,
      meta_description,
      keywords
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

router.put('/:id', jwtRequired, isAdmin, upload.single('featured_image'), async (req, res) => {
  const blogId = req.params.id;
  const blog = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!blog) return res.status(404).json({ message: 'Blog not found' });

  if (blog.admin_id !== req.admin.id) {
    return res.status(403).json({ message: 'You can only edit your own blogs' });
  }

  const data = req.body;
  const updateData = {};

  if (data.title) {
    if (data.title.length > 60) {
      return res.status(400).json({ message: 'Title must be 60 characters or less' });
    }
    updateData.title = data.title;
  }

  if (data.content) updateData.content = data.content;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.category !== undefined) updateData.category = data.category;

  if (data.tags !== undefined) {
    updateData.tags = Array.isArray(data.tags)
      ? data.tags
      : String(data.tags)
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
  }

  if (req.file) {
    updateData.featured_image = `/uploads/${req.file.filename}`;
  } else if (data.featured_image !== undefined) {
    updateData.featured_image = data.featured_image;
  }

  if (data.status) updateData.status = data.status;
  if (data.author_name !== undefined) updateData.author_name = data.author_name;
  if (data.author_profession !== undefined) updateData.author_profession = data.author_profession;
  if (data.author_linkedin !== undefined) updateData.author_linkedin = data.author_linkedin;
  if (data.author_facebook !== undefined) updateData.author_facebook = data.author_facebook;
  if (data.author_instagram !== undefined) updateData.author_instagram = data.author_instagram;
  if (data.meta_title !== undefined) updateData.meta_title = data.meta_title;
  if (data.meta_description !== undefined) {
    if (data.meta_description.length > 160) {
      return res.status(400).json({ message: 'Meta description must be 160 characters or less' });
    }
    updateData.meta_description = data.meta_description;
  }
  if (data.keywords !== undefined) updateData.keywords = data.keywords;

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
