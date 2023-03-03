import { Router } from "express";
import { getProductions } from "../controllers/production.controller";
//import validateToken from "./validate-token";

const router = Router();

router.get("/", getProductions);

export default router;
