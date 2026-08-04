import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const getDistricts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const districts = [
      // Toshkent shahri tumanlari
      { id: "toshkent-chilonzor",      name: "Chilonzor",       city: "Toshkent shahri" },
      { id: "toshkent-yunusobod",      name: "Yunusobod",       city: "Toshkent shahri" },
      { id: "toshkent-mirzo-ulugbek",  name: "Mirzo Ulug'bek",  city: "Toshkent shahri" },
      { id: "toshkent-shayxontohur",   name: "Shayxontohur",    city: "Toshkent shahri" },
      { id: "toshkent-olmazor",        name: "Olmazor",         city: "Toshkent shahri" },
      { id: "toshkent-uchtepa",        name: "Uchtepa",         city: "Toshkent shahri" },
      { id: "toshkent-yakkasaroy",     name: "Yakkasaroy",      city: "Toshkent shahri" },
      { id: "toshkent-sergeli",        name: "Sergeli",         city: "Toshkent shahri" },
      { id: "toshkent-bektemir",       name: "Bektemir",        city: "Toshkent shahri" },
      { id: "toshkent-mirobod",        name: "Mirobod",         city: "Toshkent shahri" },
      // Toshkent viloyati tumanlari
      { id: "toshvil-angren",          name: "Angren",          city: "Toshkent viloyati" },
      { id: "toshvil-bekabad",         name: "Bekabad",         city: "Toshkent viloyati" },
      { id: "toshvil-boka",            name: "Bo'ka",           city: "Toshkent viloyati" },
      { id: "toshvil-bostonliq",       name: "Bo'stonliq",      city: "Toshkent viloyati" },
      { id: "toshvil-chinoz",          name: "Chinoz",          city: "Toshkent viloyati" },
      { id: "toshvil-chirchiq",        name: "Chirchiq",        city: "Toshkent viloyati" },
      { id: "toshvil-ohangaron",       name: "Ohangaron",       city: "Toshkent viloyati" },
      { id: "toshvil-olmaliq",         name: "Olmaliq",         city: "Toshkent viloyati" },
      { id: "toshvil-oqqorgon",        name: "Oqqo'rg'on",      city: "Toshkent viloyati" },
      { id: "toshvil-parkent",         name: "Parkent",         city: "Toshkent viloyati" },
      { id: "toshvil-piskent",         name: "Piskent",         city: "Toshkent viloyati" },
      { id: "toshvil-quyi-chirchiq",   name: "Quyi Chirchiq",   city: "Toshkent viloyati" },
      { id: "toshvil-toshkent",        name: "Toshkent tumani", city: "Toshkent viloyati" },
      { id: "toshvil-urtachirchiq",    name: "O'rta Chirchiq",  city: "Toshkent viloyati" },
      { id: "toshvil-yangiyo'l",       name: "Yangiyo'l",       city: "Toshkent viloyati" },
      { id: "toshvil-yuqori-chirchiq", name: "Yuqori Chirchiq", city: "Toshkent viloyati" },
      { id: "toshvil-zangiota",        name: "Zangiota",        city: "Toshkent viloyati" },
      { id: "toshvil-nurafshon",       name: "Nurafshon",       city: "Toshkent viloyati" },
    ];

    res.json({ success: true, data: districts });
  } catch (error) {
    next(error);
  }
};

export const getPublicCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { skills: { where: { isActive: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const data = await Promise.all(categories.map(async (cat) => {
      const providersCount = await prisma.providerProfile.count({
        where: { status: 'APPROVED', providerSkills: { some: { skill: { categoryId: cat.id } } } }
      });
      const organizationsCount = await prisma.organization.count({
        where: { isActive: true, skills: { some: { skill: { categoryId: cat.id } } } }
      });
      return { ...cat, providersCount, organizationsCount };
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const category = await prisma.category.findUnique({
      where: { slug, isActive: true },
      include: {
        skills: {
          where: { isActive: true },
          include: {
            _count: { select: { providerSkills: { where: { provider: { status: 'APPROVED' } } } } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Kategoriya topilmadi' });
    }

    const providersCount = await prisma.providerProfile.count({
      where: { status: 'APPROVED', providerSkills: { some: { skill: { categoryId: category.id } } } }
    });
    const organizationsCount = await prisma.organization.count({
      where: { isActive: true, skills: { some: { skill: { categoryId: category.id } } } }
    });

    res.json({ success: true, data: { ...category, providersCount, organizationsCount } });
  } catch (error) {
    next(error);
  }
};

export const getSkillBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categorySlug, skillSlug } = req.params;
    
    const category = await prisma.category.findUnique({ where: { slug: categorySlug, isActive: true } });
    if (!category) return res.status(404).json({ success: false, error: 'Kategoriya topilmadi' });

    const skill = await prisma.skill.findUnique({
      where: {
        categoryId_slug: { categoryId: category.id, slug: skillSlug }
      },
      include: {
        serviceTypes: { where: { isActive: true } },
        category: true
      }
    });

    if (!skill || !skill.isActive) {
      return res.status(404).json({ success: false, error: 'Xizmat turi topilmadi' });
    }

    const providersCount = await prisma.providerProfile.count({
      where: { status: 'APPROVED', providerSkills: { some: { skillId: skill.id } } }
    });
    const organizationsCount = await prisma.organization.count({
      where: { isActive: true, skills: { some: { skillId: skill.id } } }
    });

    res.json({ success: true, data: { ...skill, providersCount, organizationsCount } });
  } catch (error) {
    next(error);
  }
};

export const getCategoryProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) return res.status(404).json({ success: false, error: 'Kategoriya topilmadi' });

    const providers = await prisma.providerProfile.findMany({
      where: {
        status: 'APPROVED',
        providerSkills: { some: { skill: { categoryId: category.id } } }
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, reliability: true } },
        providerSkills: { include: { skill: true } }
      }
    });

    const mappedProviders = providers.map(p => ({
      id: p.id,
      name: p.user.name,
      avatar: p.user.avatar,
      reliability: p.user.reliability,
      rating: p.rating,
      workMode: p.workMode,
      skills: p.providerSkills.map(ps => ({
        id: ps.skill.id,
        name: ps.skill.name,
        price_from: ps.priceFrom,
        price_to: ps.priceTo
      }))
    }));

    res.json({ success: true, data: mappedProviders });
  } catch (error) {
    next(error);
  }
};

export const getCategoryOrganizations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) return res.status(404).json({ success: false, error: 'Kategoriya topilmadi' });

    const organizations = await prisma.organization.findMany({
      where: {
        isActive: true,
        skills: { some: { skill: { categoryId: category.id } } }
      },
      select: { id: true, name: true, logo: true, rating: true, reliability: true, description: true }
    });

    res.json({ success: true, data: organizations });
  } catch (error) {
    next(error);
  }
};

export const getSkillProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categorySlug, skillSlug } = req.params;
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return res.status(404).json({ success: false, error: 'Kategoriya topilmadi' });
    const skill = await prisma.skill.findUnique({ where: { categoryId_slug: { categoryId: category.id, slug: skillSlug } } });
    if (!skill) return res.status(404).json({ success: false, error: 'Skill topilmadi' });

    const providers = await prisma.providerProfile.findMany({
      where: {
        status: 'APPROVED',
        providerSkills: { some: { skillId: skill.id } }
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, reliability: true } },
        providerSkills: { include: { skill: true } }
      }
    });

    const mappedProviders = providers.map(p => ({
      id: p.id,
      name: p.user.name,
      avatar: p.user.avatar,
      reliability: p.user.reliability,
      rating: p.rating,
      workMode: p.workMode,
      skills: p.providerSkills.map(ps => ({
        id: ps.skill.id,
        name: ps.skill.name,
        price_from: ps.priceFrom,
        price_to: ps.priceTo
      }))
    }));

    res.json({ success: true, data: mappedProviders });
  } catch (error) {
    next(error);
  }
};

export const getSkillOrganizations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categorySlug, skillSlug } = req.params;
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return res.status(404).json({ success: false, error: 'Kategoriya topilmadi' });
    const skill = await prisma.skill.findUnique({ where: { categoryId_slug: { categoryId: category.id, slug: skillSlug } } });
    if (!skill) return res.status(404).json({ success: false, error: 'Skill topilmadi' });

    const organizations = await prisma.organization.findMany({
      where: {
        isActive: true,
        skills: { some: { skillId: skill.id } }
      },
      select: { id: true, name: true, logo: true, rating: true, reliability: true, description: true }
    });

    res.json({ success: true, data: organizations });
  } catch (error) {
    next(error);
  }
};

export const getServiceTypeBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categorySlug, skillSlug, stSlug } = req.params;
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return res.status(404).json({ success: false, error: 'Kategoriya topilmadi' });
    const skill = await prisma.skill.findUnique({ where: { categoryId_slug: { categoryId: category.id, slug: skillSlug } } });
    if (!skill) return res.status(404).json({ success: false, error: 'Skill topilmadi' });

    const st = await prisma.serviceType.findUnique({
      where: { skillId_slug: { skillId: skill.id, slug: stSlug } },
      include: { skill: { include: { category: true } } }
    });

    if (!st || !st.isActive) return res.status(404).json({ success: false, error: 'Xizmat turi topilmadi' });

    res.json({ success: true, data: st });
  } catch (error) {
    next(error);
  }
};

export const getServiceTypeProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categorySlug, skillSlug, stSlug } = req.params;
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return res.status(404).json({ success: false, error: 'Kategoriya topilmadi' });
    const skill = await prisma.skill.findUnique({ where: { categoryId_slug: { categoryId: category.id, slug: skillSlug } } });
    if (!skill) return res.status(404).json({ success: false, error: 'Skill topilmadi' });
    const st = await prisma.serviceType.findUnique({ where: { skillId_slug: { skillId: skill.id, slug: stSlug } } });
    if (!st || !st.isActive) return res.status(404).json({ success: false, error: 'Service Type topilmadi' });

    const providers = await prisma.providerProfile.findMany({
      where: {
        status: 'APPROVED',
        providerSkills: { some: { skillId: skill.id } } // Currently mapping by skillId. If we add ServiceType relation later, we update here.
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, reliability: true } },
        providerSkills: { include: { skill: true } }
      }
    });

    const mappedProviders = providers.map(p => ({
      id: p.id,
      name: p.user.name,
      avatar: p.user.avatar,
      reliability: p.user.reliability,
      rating: p.rating,
      workMode: p.workMode,
      skills: p.providerSkills.map(ps => ({
        id: ps.skill.id,
        name: ps.skill.name,
        price_from: ps.priceFrom,
        price_to: ps.priceTo
      }))
    }));

    res.json({ success: true, data: mappedProviders });
  } catch (error) {
    next(error);
  }
};

export const getServiceTypeOrganizations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categorySlug, skillSlug, stSlug } = req.params;
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return res.status(404).json({ success: false, error: 'Kategoriya topilmadi' });
    const skill = await prisma.skill.findUnique({ where: { categoryId_slug: { categoryId: category.id, slug: skillSlug } } });
    if (!skill) return res.status(404).json({ success: false, error: 'Skill topilmadi' });
    const st = await prisma.serviceType.findUnique({ where: { skillId_slug: { skillId: skill.id, slug: stSlug } } });
    if (!st || !st.isActive) return res.status(404).json({ success: false, error: 'Service Type topilmadi' });

    const organizations = await prisma.organization.findMany({
      where: {
        isActive: true,
        skills: { some: { skillId: skill.id } } // Again, filtering by skillId for now.
      },
      select: { id: true, name: true, logo: true, rating: true, reliability: true, description: true }
    });

    res.json({ success: true, data: organizations });
  } catch (error) {
    next(error);
  }
};
