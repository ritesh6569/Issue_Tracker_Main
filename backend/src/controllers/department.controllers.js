import { getConnection } from "../db/index.js";  
import { ApiResponse } from "../utils/ApiResponse.js";

const addDepartment = async (req, res) => {
  const { name, type } = req.body;

  // Validate required fields
  if (!name || !type) {
    return res.status(400).json(new ApiResponse(400, null, "Name and Type are required"));
  }

  try {
    const connection = await getConnection();
    
    // Check if department with same name already exists
    const [existingDept] = await connection.query("SELECT * FROM departments WHERE name = ?", [name]);
    
    if (existingDept.length > 0) {
      return res.status(409).json(new ApiResponse(409, null, "Department with this name already exists"));
    }
    
    // If no duplicate found, insert the new department
    await connection.query("INSERT INTO departments (name, type) VALUES (?, ?)", [name, type]);

    res.status(201).json(new ApiResponse(201, { name, type }, "Department added successfully"));
  } catch (error) {
    console.error("Error adding department:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
};

const deleteDepartment = async (req, res) => {
  const { departmentId } = req.params;

  try {
    const connection = await getConnection();
    const [result] = await connection.query("DELETE FROM departments WHERE department_id = ?", [departmentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json(new ApiResponse(404, null, "Department not found"));
    }

    res.status(200).json(new ApiResponse(200, { departmentId }, "Department deleted successfully"));
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
};

const updateDepartmentType = async (req, res) => {
  const { departmentId } = req.params;
  const { type } = req.body;

  if (!type) {
    return res.status(400).json(new ApiResponse(400, null, "Type is required"));
  }

  try {
    const connection = await getConnection();
    const [result] = await connection.query("UPDATE departments SET type = ? WHERE department_id = ?", [type, departmentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json(new ApiResponse(404, null, "Department not found"));
    }

    res.status(200).json(new ApiResponse(200, { departmentId, type }, "Department type updated successfully"));
  } catch (error) {
    console.error("Error updating department type:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
};

const checkDepartmentType = async (req, res) => {
  const { name } = req.params;

  try {
    const connection = await getConnection();
    const [rows] = await connection.query("SELECT type FROM departments WHERE name = ?", [name]);

    if (rows.length === 0) {
      return res.status(404).json(new ApiResponse(404, null, "Department not found"));
    }

    const departmentType = rows[0].type;
    res.status(200).json(new ApiResponse(200, { name, type: departmentType }, "Department type fetched successfully"));
  } catch (error) {
    console.error("Error fetching department type:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
};

const fetchMentainanceDeparments = async (req, res) => {
  
  try {
    const connection = await getConnection();
    const [departments] = await connection.query("SELECT name FROM departments WHERE type = 'Maintainance' or type = 'maintenance'");

    if (departments.length === 0) {
      return res.status(404).json(new ApiResponse(404, null, "Department not found"));
    }

    res.status(200).json(new ApiResponse(200, { departments }, "Maintenance departments fetched successfully"));
  } catch (error) {
    console.error("Error fetching department type:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
};


const getAllDepartments = async (req, res) => {
  try {
    const connection = await getConnection();
    const [departments] = await connection.query("SELECT * FROM departments");

    if (departments.length === 0) {
      return res.status(404).json(new ApiResponse(404, null, "No departments found"));
    }
    
    console.log(departments);
    
    res.status(200).json(new ApiResponse(200,departments, "Departments fetched successfully"));
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
 }
};

// Public endpoint to fetch departments for registration
const getPublicDepartments = async (req, res) => {
  try {
    const connection = await getConnection();
    const [departments] = await connection.query("SELECT * FROM departments");

    if (departments.length === 0) {
      return res.status(404).json(new ApiResponse(404, null, "No departments found"));
    }
    
    res.status(200).json(new ApiResponse(200, departments, "Departments fetched successfully"));
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
};

// Edit department details
const editDepartment = async (req, res) => {
  const { departmentId } = req.params;
  const { name, type } = req.body;

  if (!name && !type) {
    return res.status(400).json(new ApiResponse(400, null, "At least one field (name or type) is required for update"));
  }

  try {
    const connection = await getConnection();
    
    // Check if department exists
    const [existingDept] = await connection.query("SELECT * FROM departments WHERE department_id = ?", [departmentId]);
    
    if (existingDept.length === 0) {
      return res.status(404).json(new ApiResponse(404, null, "Department not found"));
    }
    
    // If name is provided, check if it's different from current and not a duplicate
    if (name && name !== existingDept[0].name) {
      const [nameCheck] = await connection.query("SELECT * FROM departments WHERE name = ? AND department_id != ?", [name, departmentId]);
      if (nameCheck.length > 0) {
        return res.status(409).json(new ApiResponse(409, null, "Department name already exists"));
      }
    }
    
    // Build update query based on provided fields
    const updateFields = [];
    const updateValues = [];
    
    if (name) {
      updateFields.push("name = ?");
      updateValues.push(name);
    }
    
    if (type) {
      updateFields.push("type = ?");
      updateValues.push(type);
    }
    
    // Add department ID to values
    updateValues.push(departmentId);
    
    // Execute update
    const [result] = await connection.query(
      `UPDATE departments SET ${updateFields.join(", ")} WHERE department_id = ?`,
      updateValues
    );
    
    if (result.affectedRows === 0) {
      return res.status(500).json(new ApiResponse(500, null, "Failed to update department"));
    }
    
    // Get updated department
    const [updatedDept] = await connection.query("SELECT * FROM departments WHERE department_id = ?", [departmentId]);
    
    res.status(200).json(new ApiResponse(200, updatedDept[0], "Department updated successfully"));
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
};

export {
  addDepartment,
  deleteDepartment,
  updateDepartmentType,
  checkDepartmentType,
  fetchMentainanceDeparments,
  getAllDepartments,
  getPublicDepartments,
  editDepartment
};
