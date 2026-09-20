import express from 'express';
import { isAuth } from '../middlewares/isAuth.js';
import { discoverPeople, getFollowers, getFollowing } from '../controllers/networkControllers.js';

const router=express.Router();

router.get("/discover",isAuth,discoverPeople);
router.get("/followers",isAuth,getFollowers);
router.get("/following",isAuth,getFollowing);

export default router;