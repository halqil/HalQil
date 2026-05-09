import { Router } from 'express';
import {
  applyForProvider, getMyProfile, updateProfile,
  addSkill, removeSkill,
  addPortfolioImage, removePortfolioImage,
  applyToCreateOrganization, applyToJoinOrganization,
  updateAvailabilityStatus, getSchedule, updateSchedule, updateBio,
  getMyApplication, updateProviderSettings,
} from '../controllers/provider.controller';
import { validate } from '../middlewares/validate';
import { applyProviderSchema, updateProfileSchema, addSkillSchema } from '../schemas/provider.schema';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

router.use(authenticate);

// Provider application
router.post('/apply', applyForProvider);
router.get('/my-application', getMyApplication);

// Profile management
router.get('/profile', getMyProfile);
router.patch('/profile', validate(updateProfileSchema), updateProfile);
router.patch('/bio', updateBio);
router.patch('/settings', updateProviderSettings);

// Status and Schedule
router.patch('/availability', updateAvailabilityStatus);
router.get('/schedule', getSchedule);
router.post('/schedule', updateSchedule);

// Skills
router.post('/skills', validate(addSkillSchema), addSkill);
router.delete('/skills/:skillId', removeSkill);

// Portfolio
router.post('/portfolio', upload.single('image'), addPortfolioImage);
router.delete('/portfolio/:imageId', removePortfolioImage);

// Organization
router.post('/organization/apply-create', applyToCreateOrganization);
router.post('/organization/apply-join', applyToJoinOrganization);

export default router;
