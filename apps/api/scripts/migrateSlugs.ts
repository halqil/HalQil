import { prisma } from '../src/lib/prisma';
import { generateSlug } from '../src/utils/slug';

async function main() {
  console.log('Starting migration of slugs...');
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    if (cat.slug.length === 36 && cat.slug.includes('-')) {
      const newSlug = generateSlug(cat.name);
      await prisma.category.update({ where: { id: cat.id }, data: { slug: newSlug } });
      console.log('Updated category:', cat.name, '->', newSlug);
    }
  }

  const skills = await prisma.skill.findMany();
  for (const skill of skills) {
    if (skill.slug.length === 36 && skill.slug.includes('-')) {
      const newSlug = generateSlug(skill.name);
      await prisma.skill.update({ where: { id: skill.id }, data: { slug: newSlug } });
      console.log('Updated skill:', skill.name, '->', newSlug);
    }
  }
  console.log('Migration completed.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
