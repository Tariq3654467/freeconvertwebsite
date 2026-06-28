const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { jwtRequired, isAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/:pageKey', async (req, res) => {
  const pageKey = req.params.pageKey;

  const page = await prisma.pageContent.findUnique({
    where: { page_key: pageKey }
  });

  return res.status(200).json({
    page_key: pageKey,
    title: page?.title || '',
    subtitle: page?.subtitle || '',
    body: page?.body || '',
    updated_at: page?.updated_at || null
  });
});

router.put('/:pageKey', jwtRequired, isAdmin, async (req, res) => {
  const pageKey = req.params.pageKey;
  const { title = '', subtitle = '', body = '' } = req.body || {};

  const page = await prisma.pageContent.upsert({
    where: { page_key: pageKey },
    update: { title, subtitle, body },
    create: { page_key: pageKey, title, subtitle, body }
  });

  return res.status(200).json({
    message: 'Page content updated',
    page
  });
});

module.exports = router;
