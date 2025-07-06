import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { 
    uploadLicense, 
    getAllLicenses, 
    getExpiringLicenses, 
    getLicenseFile,
    updateLicense,
    deleteLicense
} from "../controllers/license.controllers.js";

const router = Router();

// License management routes
router.route("/upload").post(verifyJWT, uploadLicense);
router.route("/all").get(verifyJWT, getAllLicenses);
router.route("/expiring").get(verifyJWT, getExpiringLicenses);
router.route("/:id").get(verifyJWT, getLicenseFile);
router.route("/:id").put(verifyJWT, updateLicense);
router.route("/:id").delete(verifyJWT, deleteLicense);

export default router;