import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    adminCreateUser,
    adminGetAllUsers,
    adminUpdateUser,
    adminDeleteUser,
    adminResetPassword
} from "../controllers/user.controllers.js";


import { 
    createIssue,
    getissue,
    updateResponses,
    getIssueforuser,
    completeIssue,
    acknowledgeResponse,
    fetchReport,
    getAdmin
} from "../controllers/issue.controllers.js";

import { 
    addDepartment, 
    deleteDepartment, 
    updateDepartmentType,
    checkDepartmentType,
    fetchMentainanceDeparments,
    getAllDepartments,
    getPublicDepartments,
    editDepartment
} from "../controllers/department.controllers.js";


import { verifyJWT, isAdmin } from "../middlewares/auth.middlewares.js";


const router = Router()

// Public routes - only login is public
router.route("/login").post(loginUser)

// Public route to get departments for registration
router.route("/departments").get(verifyJWT,getPublicDepartments)

// Secured routes (for all authenticated users)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(verifyJWT, refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

// Route for checking if user is authenticated 
router.route("/protected-route").get(verifyJWT, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "User is authenticated",
        user: {
            id: req.user.id,
            email: req.user.email,
            fullName: req.user.full_name,
            isAdmin: req.user.is_admin
        }
    });
})

// Issue management routes
router.route("/raise-issue").post(verifyJWT, createIssue)
router.route("/get-issue").get(verifyJWT, getissue)
router.route("/get-issue-for-user").get(verifyJWT, getIssueforuser)
router.route("/update-response").put(verifyJWT, updateResponses)
router.route("/complete-report").post(verifyJWT, completeIssue)
router.route("/acknowledge-time").post(verifyJWT, acknowledgeResponse)
router.route("/fetch-report").get(verifyJWT, fetchReport)
router.route("/get-admin").get(verifyJWT, getAdmin)

// Public department information routes (for all users)
router.get('/department/:name', checkDepartmentType);
router.get('/department-names', verifyJWT, fetchMentainanceDeparments);

// Admin dashboard route
router.route("/dashboard").get(verifyJWT, isAdmin, (req, res) => {
    return res.status(200).json({ message: "Admin dashboard access granted" });
})

// Admin department management routes
router.post('/departments', verifyJWT, isAdmin, addDepartment);
router.delete('/departments/:departmentId', verifyJWT, isAdmin, deleteDepartment);
router.put('/departments/:departmentId/type', verifyJWT, isAdmin, updateDepartmentType);
router.put('/departments/:departmentId', verifyJWT, isAdmin, editDepartment);
router.route("/departments").get(verifyJWT, isAdmin, (req, res) => {
    return res.status(200).json({ message: "Admin can manage all departments" });
})

router.get('/get-departments', verifyJWT, isAdmin, getAllDepartments);

// Admin user management routes
router.route("/users/register").post(verifyJWT, isAdmin, adminCreateUser);
router.route("/users").get(verifyJWT, isAdmin, adminGetAllUsers);
router.route("/users/:userId").put(verifyJWT, isAdmin, adminUpdateUser);
router.route("/users/:userId").delete(verifyJWT, isAdmin, adminDeleteUser);
router.route("/users/:userId/reset-password").post(verifyJWT, isAdmin, adminResetPassword);

router.get('/ping', (req, res) => {
    return res.status(200).json({ message: "Server is running" });
});

export default router