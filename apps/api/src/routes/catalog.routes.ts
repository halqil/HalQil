import { Router } from 'express';
import { 
  getDistricts, getPublicCategories, getCategoryBySlug, getSkillBySlug,
  getCategoryProviders, getCategoryOrganizations,
  getSkillProviders, getSkillOrganizations,
  getServiceTypeBySlug, getServiceTypeProviders, getServiceTypeOrganizations
} from '../controllers/catalog.controller';

const router = Router();

// Public endpoints — no auth required
router.get('/categories', getPublicCategories);
router.get('/categories/:slug', getCategoryBySlug);
router.get('/categories/:slug/providers', getCategoryProviders);
router.get('/categories/:slug/organizations', getCategoryOrganizations);
router.get('/categories/:categorySlug/:skillSlug', getSkillBySlug);
router.get('/categories/:categorySlug/:skillSlug/providers', getSkillProviders);
router.get('/categories/:categorySlug/:skillSlug/organizations', getSkillOrganizations);
router.get('/categories/:categorySlug/:skillSlug/service-types/:stSlug', getServiceTypeBySlug);
router.get('/categories/:categorySlug/:skillSlug/service-types/:stSlug/providers', getServiceTypeProviders);
router.get('/categories/:categorySlug/:skillSlug/service-types/:stSlug/organizations', getServiceTypeOrganizations);
router.get('/districts', getDistricts);

export default router;
